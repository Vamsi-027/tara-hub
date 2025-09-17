/*
  Streaming Parser with Memory Bounds and Backpressure Control

  This module provides memory-efficient streaming parsing for CSV and XLSX files,
  with built-in backpressure handling and error recovery.
*/

import { Readable, Transform, pipeline } from 'stream';
import { promisify } from 'util';
import * as csv from 'csv-parse';
import * as ExcelJS from 'exceljs';
import { MemoryManager, AdaptiveBatchSizer } from './memory-manager';
import { ProductRow, productRowSchema } from './schemas';
import { ColumnMapper, ColumnMapping } from './column-mapper';
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
  private columnMapper: ColumnMapper;
  private config: StreamingConfig;
  private progress: ParseProgress;
  private startTime: number;
  private tempBuffers: Map<number, ProductRow[]> = new Map();
  private columnMappings?: ColumnMapping[];

  constructor(
    memoryManager: MemoryManager,
    config: Partial<StreamingConfig> = {},
    columnMapper?: ColumnMapper
  ) {
    this.memoryManager = memoryManager;
    this.batchSizer = new AdaptiveBatchSizer(memoryManager);
    this.columnMapper = columnMapper || new ColumnMapper();
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
    onProgress?: (progress: ParseProgress) => void,
    columnMappingJson?: Record<string, string>,
    mappingProfileId?: string
  ): Promise<void> {
    const parser = csv.parse({
      columns: true,
      trim: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      bom: true, // Handle UTF-8 BOM
    });

    // Set up column mapping configuration
    this.columnMappings = undefined; // Reset for fresh detection
    const mappingConfig = { columnMappingJson, mappingProfileId };

    const validator = this.createValidationTransform(onBatch, onProgress, mappingConfig);

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
    buffer: Buffer | Readable,
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void,
    sheetName?: string,
    columnMappingJson?: Record<string, string>,
    mappingProfileId?: string
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const stream = Buffer.isBuffer(buffer) ? Readable.from(buffer) : buffer;

      // Use streaming reader for memory efficiency
      await workbook.xlsx.read(stream);

      const worksheet = sheetName
        ? workbook.getWorksheet(sheetName)
        : workbook.getWorksheet(1);

      if (!worksheet) {
        throw new StreamingParseError('No worksheet found');
      }

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || '');
      });

      // Detect or apply column mappings
      if (!this.columnMappings) {
        const sampleRows: any[][] = [];

        // Collect sample rows for column detection
        for (let rowNum = 2; rowNum <= Math.min(12, worksheet.rowCount); rowNum++) {
          const row = worksheet.getRow(rowNum);
          const rowData: any[] = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[colNumber - 1] = cell.value;
          });
          sampleRows.push(rowData);
        }

        // Apply column mapping before validation
        if (columnMappingJson) {
          this.columnMappings = headers.map(header => ({
            sourceColumn: header,
            targetField: columnMappingJson[header] || header,
            confidence: columnMappingJson[header] ? 1.0 : 0.5,
            dataType: 'string' as any,
            sampleValues: [],
            isRequired: false,
            conflicts: []
          }));
        } else {
          this.columnMappings = await this.columnMapper.detectColumns(
            headers,
            sampleRows,
            mappingProfileId
          );
        }
      }

      // Count total rows for progress tracking
      this.progress.totalRows = worksheet.rowCount - 1; // Minus header row

      // Process rows in batches with deterministic iteration (fixes async bug)
      let currentBatch: any[] = [];
      let batchStartIndex = 0;

      // Use deterministic loop instead of eachRow to properly handle async/await
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        await this.memoryManager.waitForAvailableSlot();

        const row = worksheet.getRow(rowNumber);

        // Skip empty rows
        if (!row.hasValues) continue;

        // Convert row to mapped object
        const mappedObject: any = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const sourceColumn = headers[colNumber - 1];
          const mapping = this.columnMappings?.find(m => m.sourceColumn === sourceColumn);
          const targetField = mapping?.targetField || sourceColumn;
          mappedObject[targetField] = cell.value;
        });

        currentBatch.push(mappedObject);

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
      }

      // Process remaining rows
      if (currentBatch.length > 0) {
        await this.processBatchFromObjects(
          currentBatch,
          batchStartIndex,
          onBatch,
          onProgress
        );
      }

      this.progress.phase = 'completed';

    } catch (error) {
      this.progress.phase = 'failed';
      throw new StreamingParseError('XLSX parsing failed', error as Error);
    }
  }

  private createValidationTransform(
    onBatch: (batch: ParsedBatch) => Promise<void>,
    onProgress?: (progress: ParseProgress) => void,
    mappingConfig?: { columnMappingJson?: Record<string, string>; mappingProfileId?: string }
  ): Transform {
    let currentBatch: any[] = [];
    let batchStartIndex = 0;
    let mappingDetectionBuffer: any[] = [];
    let headersCollected = false;
    let headers: string[] = [];
    let mappingDetectionComplete = false;
    const maxSampleRows = 20; // Buffer first N rows for mapping detection

    return new Transform({
      objectMode: true,
      async transform(chunk: any, encoding, callback) {
        try {
          await this.memoryManager.waitForAvailableSlot();

          // Collect headers from first chunk
          if (!headersCollected) {
            headersCollected = true;
            headers = Object.keys(chunk);
          }

          // Buffer rows for mapping detection if needed
          if (!mappingDetectionComplete && !mappingConfig?.columnMappingJson) {
            mappingDetectionBuffer.push(chunk);

            // Once we have enough samples, detect mappings
            if (mappingDetectionBuffer.length >= Math.min(maxSampleRows, 10)) {
              mappingDetectionComplete = true;

              // Convert buffer to sample rows format
              const sampleRows = mappingDetectionBuffer.map(row =>
                headers.map(h => row[h])
              );

              // Detect column mappings
              this.columnMappings = await this.columnMapper.detectColumns(
                headers,
                sampleRows,
                mappingConfig?.mappingProfileId
              );

              // Process all buffered rows with mappings
              for (const bufferedChunk of mappingDetectionBuffer) {
                const mappedChunk = this.applyColumnMapping(bufferedChunk);
                currentBatch.push(mappedChunk);
                this.progress.processedRows++;
              }

              // Clear buffer to free memory
              mappingDetectionBuffer = [];
            } else {
              // Continue buffering
              callback();
              return;
            }
          } else if (!this.columnMappings && mappingConfig?.columnMappingJson) {
            // Apply provided column mapping
            this.columnMappings = headers.map(header => ({
              sourceColumn: header,
              targetField: mappingConfig.columnMappingJson![header] || header,
              confidence: mappingConfig.columnMappingJson![header] ? 1.0 : 0.5,
              dataType: 'string' as any,
              sampleValues: [],
              isRequired: false,
              conflicts: []
            }));
            mappingDetectionComplete = true;
          }

          // Apply column mapping to chunk
          if (mappingDetectionComplete) {
            const mappedChunk = this.applyColumnMapping(chunk);
            currentBatch.push(mappedChunk);
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
          }

          callback();
        } catch (error) {
          callback(error as Error);
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
          callback(error as Error);
        }
      }.bind(this)
    });
  }

  private applyColumnMapping(chunk: any): any {
    const mappedChunk: any = {};
    for (const [sourceColumn, value] of Object.entries(chunk)) {
      const mapping = this.columnMappings?.find(m => m.sourceColumn === sourceColumn);
      const targetField = mapping?.targetField || sourceColumn;
      mappedChunk[targetField] = value;
    }
    return mappedChunk;
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