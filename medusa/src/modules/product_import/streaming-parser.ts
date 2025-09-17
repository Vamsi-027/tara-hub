/*
  Streaming Parser with Memory Bounds and Backpressure Control

  This module provides memory-efficient streaming parsing for CSV and XLSX files,
  with built-in backpressure handling and error recovery.
*/

import { Readable, Transform, pipeline } from 'stream';
import { promisify } from 'util';
import * as csv from 'csv-parse';
import * as XLSX from 'xlsx';
import { MemoryManager, AdaptiveBatchSizer } from './memory-manager';
import { ProductRow, productRowSchema } from './schemas';
import { ZodError } from 'zod';

const pipelineAsync = promisify(pipeline);

export interface StreamingConfig {
  maxRowsInMemory: number;
  bufferSizeBytes: number;
  enableCompression: boolean;
  tempDir?: string;
  maxFileSize: number; // bytes
  timeout: number; // ms
}

export interface ParseProgress {
  totalRows: number;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  currentBatch: number;
  estimatedTimeRemaining: number;
  processingRate: number; // rows per second
  memoryUsage: number; // MB
  phase: 'parsing' | 'validating' | 'buffering' | 'completed' | 'failed';
}

export interface ParsedBatch {
  rows: ProductRow[];
  batchIndex: number;
  startRowIndex: number;
  endRowIndex: number;
  errors: ParseError[];
  metadata: {
    processingTime: number;
    memoryUsed: number;
    validationStats: ValidationStats;
  };
}

export interface ParseError {
  rowIndex: number;
  column?: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  originalData?: any;
}

export interface ValidationStats {
  totalFields: number;
  validFields: number;
  invalidFields: number;
  coercedFields: number;
  missingRequired: number;
}

export class StreamingParser {
  private memoryManager: MemoryManager;
  private batchSizer: AdaptiveBatchSizer;
  private config: StreamingConfig;
  private progress: ParseProgress;
  private startTime: number;
  private tempBuffers: Map<number, ProductRow[]> = new Map();

  constructor(
    memoryManager: MemoryManager,
    config: Partial<StreamingConfig> = {}
  ) {
    this.memoryManager = memoryManager;
    this.batchSizer = new AdaptiveBatchSizer(memoryManager);
    this.config = {
      maxRowsInMemory: config.maxRowsInMemory || 1000,
      bufferSizeBytes: config.bufferSizeBytes || 64 * 1024, // 64KB
      enableCompression: config.enableCompression ?? true,
      tempDir: config.tempDir || '/tmp/medusa-import',
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      timeout: config.timeout || 30 * 60 * 1000, // 30 minutes
    };

    this.progress = {
      totalRows: 0,
      processedRows: 0,
      validRows: 0,
      invalidRows: 0,
      currentBatch: 0,
      estimatedTimeRemaining: 0,
      processingRate: 0,
      memoryUsage: 0,
      phase: 'parsing'
    };

    this.startTime = Date.now();
  }

  public async parseCSVStream(
    stream: Readable,
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<void> {
    const parser = csv.parse({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true, // Handle UTF-8 BOM
    });

    const validator = this.createValidationTransform(onBatch, onProgress);

    try {
      await pipelineAsync(
        stream,
        parser,
        validator
      );
    } catch (error) {
      this.progress.phase = 'failed';
      throw new StreamingParseError('CSV parsing failed', error as Error);
    }
  }

  public async parseXLSXStream(
    buffer: Buffer,
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void,
    sheetName?: string
  ): Promise<void> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellText: false, cellDates: true });
      const worksheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];

      if (!worksheet) {
        throw new StreamingParseError('No worksheet found');
      }

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: ''
      }) as string[][];

      if (jsonData.length === 0) {
        throw new StreamingParseError('Empty worksheet');
      }

      // First row as headers
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      this.progress.totalRows = dataRows.length;

      // Process in batches to avoid memory issues
      const batchSize = this.batchSizer.getCurrentBatchSize();

      for (let i = 0; i < dataRows.length; i += batchSize) {
        await this.memoryManager.waitForAvailableSlot();

        const batchRows = dataRows.slice(i, i + batchSize);
        const objects = batchRows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        await this.processBatchFromObjects(objects, i, onBatch, onProgress);
      }

    } catch (error) {
      this.progress.phase = 'failed';
      throw new StreamingParseError('XLSX parsing failed', error as Error);
    }
  }

  private createValidationTransform(
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void
  ): Transform {
    let currentBatch: any[] = [];
    let batchStartIndex = 0;

    return new Transform({
      objectMode: true,
      async transform(chunk: any, encoding, callback) {
        try {
          await this.memoryManager.waitForAvailableSlot();

          currentBatch.push(chunk);
          this.progress.processedRows++;

          const batchSize = this.batchSizer.getCurrentBatchSize();

          if (currentBatch.length >= batchSize) {
            await this.processBatchFromObjects(
              currentBatch,
              batchStartIndex,
              onBatch,
              onProgress
            );

            batchStartIndex += currentBatch.length;
            currentBatch = [];
          }

          callback();
        } catch (error) {
          callback(error);
        }
      }.bind(this),

      async flush(callback) {
        try {
          if (currentBatch.length > 0) {
            await this.processBatchFromObjects(
              currentBatch,
              batchStartIndex,
              onBatch,
              onProgress
            );
          }

          this.progress.phase = 'completed';
          callback();
        } catch (error) {
          callback(error);
        }
      }.bind(this)
    });
  }

  private async processBatchFromObjects(
    objects: any[],
    startIndex: number,
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<void> {
    const batchStartTime = Date.now();
    const memoryBefore = this.memoryManager.getMetrics().used;

    if (!this.memoryManager.reserveProcessingSlot()) {
      // Wait for available slot with exponential backoff
      await this.memoryManager.waitForAvailableSlot();
      if (!this.memoryManager.reserveProcessingSlot()) {
        throw new StreamingParseError('Unable to reserve processing slot');
      }
    }

    try {
      const validatedBatch = await this.validateBatch(objects, startIndex);

      // Record performance metrics
      const processingTime = Date.now() - batchStartTime;
      const memoryAfter = this.memoryManager.getMetrics().used;
      const memoryUsed = memoryAfter - memoryBefore;

      this.batchSizer.recordBatchPerformance(objects.length, processingTime, memoryUsed);

      // Update progress
      this.updateProgress(validatedBatch, processingTime);

      if (onProgress) {
        onProgress({ ...this.progress });
      }

      // Process the batch
      await onBatch(validatedBatch);

      this.memoryManager.releaseProcessingSlot(true);

    } catch (error) {
      this.memoryManager.releaseProcessingSlot(false);
      throw error;
    }
  }

  private async validateBatch(objects: any[], startIndex: number): Promise<ParsedBatch> {
    const batchIndex = this.progress.currentBatch++;
    const rows: ProductRow[] = [];
    const errors: ParseError[] = [];
    const stats: ValidationStats = {
      totalFields: 0,
      validFields: 0,
      invalidFields: 0,
      coercedFields: 0,
      missingRequired: 0
    };

    for (let i = 0; i < objects.length; i++) {
      const rowIndex = startIndex + i + 1; // +1 for header row
      const object = objects[i];

      try {
        // Apply security validation first
        const sanitizedObject = this.sanitizeRowData(object, rowIndex, errors);

        // Count total fields
        stats.totalFields += Object.keys(sanitizedObject).length;

        // Validate with Zod schema
        const result = productRowSchema.safeParse(sanitizedObject);

        if (result.success) {
          rows.push(result.data);
          stats.validFields += Object.keys(result.data).length;
        } else {
          this.handleValidationErrors(result.error, rowIndex, sanitizedObject, errors, stats);
        }

      } catch (error) {
        errors.push({
          rowIndex,
          error: `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'critical',
          originalData: object
        });
        stats.invalidFields++;
      }
    }

    this.progress.validRows += rows.length;
    this.progress.invalidRows += errors.filter(e => e.severity === 'error' || e.severity === 'critical').length;

    return {
      rows,
      batchIndex,
      startRowIndex: startIndex,
      endRowIndex: startIndex + objects.length - 1,
      errors,
      metadata: {
        processingTime: Date.now() - this.startTime,
        memoryUsed: this.memoryManager.getMetrics().used,
        validationStats: stats
      }
    };
  }

  private sanitizeRowData(object: any, rowIndex: number, errors: ParseError[]): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(object)) {
      if (typeof value === 'string') {
        // Check for CSV injection patterns
        if (this.containsCSVInjection(value)) {
          errors.push({
            rowIndex,
            column: key,
            error: 'Potential CSV injection detected',
            severity: 'critical',
            originalData: { [key]: value }
          });
          sanitized[key] = this.sanitizeString(value);
        } else {
          sanitized[key] = value.trim();
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private containsCSVInjection(value: string): boolean {
    // Check for common CSV injection patterns
    const injectionPatterns = [
      /^[=+\-@]/,  // Starts with formula characters
      /^\s*[=+\-@]/, // Starts with formula characters after whitespace
    ];

    return injectionPatterns.some(pattern => pattern.test(value));
  }

  private sanitizeString(value: string): string {
    // Remove or escape dangerous characters
    return value.replace(/^[=+\-@]+/, '').trim();
  }

  private handleValidationErrors(
    zodError: ZodError,
    rowIndex: number,
    originalData: any,
    errors: ParseError[],
    stats: ValidationStats
  ): void {
    for (const issue of zodError.issues) {
      const field = issue.path.join('.');

      errors.push({
        rowIndex,
        column: field,
        error: issue.message,
        severity: issue.code === 'invalid_type' && field.includes('title') ? 'critical' : 'error',
        originalData: { [field]: originalData[field] }
      });

      if (issue.code === 'invalid_type') {
        stats.invalidFields++;
      } else {
        stats.coercedFields++;
      }
    }
  }

  private updateProgress(batch: ParsedBatch, processingTime: number): void {
    const elapsed = Date.now() - this.startTime;
    this.progress.processingRate = this.progress.processedRows / (elapsed / 1000);

    if (this.progress.totalRows > 0 && this.progress.processingRate > 0) {
      const remaining = this.progress.totalRows - this.progress.processedRows;
      this.progress.estimatedTimeRemaining = remaining / this.progress.processingRate * 1000;
    }

    this.progress.memoryUsage = this.memoryManager.getMetrics().used;
    this.progress.phase = 'validating';
  }

  public getProgress(): ParseProgress {
    return { ...this.progress };
  }

  public cleanup(): void {
    this.tempBuffers.clear();
    this.memoryManager.forceGarbageCollection();
  }
}

export class StreamingParseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StreamingParseError';
  }
}

// Utility functions for file validation
export function validateFileSize(buffer: Buffer | { size: number }, maxSize: number): void {
  const size = Buffer.isBuffer(buffer) ? buffer.length : buffer.size;
  if (size > maxSize) {
    throw new StreamingParseError(`File size ${size} exceeds maximum ${maxSize} bytes`);
  }
}

export function detectFileType(filename: string, buffer?: Buffer): 'csv' | 'xlsx' | 'unknown' {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';

  // Try to detect from buffer content
  if (buffer) {
    // Check for ZIP signature (XLSX files are ZIP archives)
    if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      return 'xlsx';
    }

    // Basic CSV detection (look for common delimiters in first 1KB)
    const sample = buffer.slice(0, 1024).toString('utf8');
    if (sample.includes(',') || sample.includes(';') || sample.includes('\t')) {
      return 'csv';
    }
  }

  return 'unknown';
}