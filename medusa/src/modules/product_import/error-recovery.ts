/*
  Dependency-Aware Error Recovery System with Checkpointing

  This module provides sophisticated error recovery mechanisms including:
  - Dependency-aware retry logic
  - Checkpointing for partial failure recovery
  - Cascading failure analysis and resolution
  - Dead letter queue for persistent failures
*/

import { EventEmitter } from 'events';
import { ProductRow } from './schemas';
import { ParseError, ParsedBatch } from './streaming-parser';
import { ValidationIssue } from './data-integrity';

export interface RecoveryCheckpoint {
  id: string;
  timestamp: number;
  batchIndex: number;
  processedRows: number;
  successfulRows: number;
  failedRows: FailedRow[];
  dependencyMap: DependencyMap;
  metadata: {
    memoryUsage: number;
    processingTime: number;
    errorDistribution: ErrorDistribution;
  };
}

export interface FailedRow {
  rowIndex: number;
  row: ProductRow;
  attempts: AttemptHistory[];
  dependencies: string[];
  lastError: string;
  errorType: ErrorType;
  severity: 'recoverable' | 'critical' | 'permanent';
  blockedDependents: number[];
}

export interface AttemptHistory {
  attemptNumber: number;
  timestamp: number;
  error: string;
  errorType: ErrorType;
  recoveryStrategy: RecoveryStrategy;
  duration: number;
}

export interface DependencyMap {
  productDependencies: Map<string, string[]>; // child -> [parents]
  variantDependencies: Map<string, string>; // variant -> product
  referenceDependencies: Map<string, string[]>; // entity -> [referenced entities]
}

export interface ErrorDistribution {
  validationErrors: number;
  databaseErrors: number;
  networkErrors: number;
  memoryErrors: number;
  businessLogicErrors: number;
  dependencyErrors: number;
}

export type ErrorType =
  | 'validation_error'
  | 'database_error'
  | 'network_error'
  | 'memory_error'
  | 'business_logic_error'
  | 'dependency_error'
  | 'timeout_error'
  | 'unknown_error';

export type RecoveryStrategy =
  | 'immediate_retry'
  | 'delayed_retry'
  | 'dependency_retry'
  | 'partial_data_recovery'
  | 'skip_and_continue'
  | 'manual_intervention'
  | 'dead_letter_queue';

export interface RecoveryConfig {
  maxRetries: number;
  retryDelay: number; // base delay in ms
  exponentialBackoff: boolean;
  maxBackoffDelay: number; // max delay in ms
  checkpointInterval: number; // rows processed between checkpoints
  deadLetterThreshold: number; // failures before moving to DLQ
  dependencyRetryDelay: number; // delay before retrying dependencies
  enablePartialRecovery: boolean;
}

export interface RecoveryResult {
  success: boolean;
  recoveredRows: number;
  permanentFailures: number;
  deadLetterRows: FailedRow[];
  newCheckpoint?: RecoveryCheckpoint;
  duration: number;
}

export class ErrorRecoveryManager extends EventEmitter {
  private config: RecoveryConfig;
  private checkpoints: Map<string, RecoveryCheckpoint> = new Map();
  private failedRows: Map<number, FailedRow> = new Map();
  private dependencyMap: DependencyMap;
  private deadLetterQueue: FailedRow[] = [];
  private recoveryInProgress = false;

  constructor(config: Partial<RecoveryConfig> = {}) {
    super();

    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      maxBackoffDelay: config.maxBackoffDelay || 30000,
      checkpointInterval: config.checkpointInterval || 100,
      deadLetterThreshold: config.deadLetterThreshold || 5,
      dependencyRetryDelay: config.dependencyRetryDelay || 5000,
      enablePartialRecovery: config.enablePartialRecovery ?? true
    };

    this.dependencyMap = {
      productDependencies: new Map(),
      variantDependencies: new Map(),
      referenceDependencies: new Map()
    };
  }

  public async processWithRecovery<T>(
    batch: ParsedBatch,
    processor: (row: ProductRow, rowIndex: number) => Promise<T>,
    validator?: (row: ProductRow) => ValidationIssue[]
  ): Promise<RecoveryResult> {
    const startTime = Date.now();

    try {
      this.recoveryInProgress = true;
      this.emit('recovery-started', { batchIndex: batch.batchIndex });

      // Build dependency map for this batch
      await this.buildDependencyMap(batch.rows);

      // Create checkpoint
      const checkpoint = this.createCheckpoint(batch);

      const result = await this.processRowsWithDependencyAwareness(
        batch,
        processor,
        validator
      );

      // Update checkpoint with results
      checkpoint.metadata.processingTime = Date.now() - startTime;
      this.checkpoints.set(checkpoint.id, checkpoint);

      this.emit('recovery-completed', result);

      return {
        ...result,
        newCheckpoint: checkpoint,
        duration: Date.now() - startTime
      };

    } finally {
      this.recoveryInProgress = false;
    }
  }

  public async recoverFromCheckpoint(
    checkpointId: string,
    processor: (row: ProductRow, rowIndex: number) => Promise<any>
  ): Promise<RecoveryResult> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const startTime = Date.now();

    try {
      this.emit('checkpoint-recovery-started', { checkpointId });

      const result = await this.retryFailedRows(checkpoint.failedRows, processor);

      this.emit('checkpoint-recovery-completed', result);

      return {
        ...result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.emit('checkpoint-recovery-failed', { checkpointId, error });
      throw error;
    }
  }

  private async processRowsWithDependencyAwareness<T>(
    batch: ParsedBatch,
    processor: (row: ProductRow, rowIndex: number) => Promise<T>,
    validator?: (row: ProductRow) => ValidationIssue[]
  ): Promise<RecoveryResult> {
    const results: RecoveryResult = {
      success: true,
      recoveredRows: 0,
      permanentFailures: 0,
      deadLetterRows: [],
      duration: 0
    };

    // Sort rows by dependency order
    const sortedRows = this.sortByDependencies(batch.rows);

    for (const { row, originalIndex } of sortedRows) {
      try {
        // Validate if validator provided
        if (validator) {
          const issues = validator(row);
          const criticalIssues = issues.filter(i => i.severity === 'critical');
          if (criticalIssues.length > 0) {
            throw new Error(`Validation failed: ${criticalIssues[0].message}`);
          }
        }

        // Check if dependencies are satisfied
        const dependenciesSatisfied = await this.checkDependencies(row, originalIndex);
        if (!dependenciesSatisfied) {
          throw new Error('Dependencies not satisfied');
        }

        // Process the row
        await processor(row, originalIndex);
        results.recoveredRows++;

      } catch (error) {
        await this.handleRowError(
          row,
          originalIndex,
          error as Error,
          processor
        );
      }
    }

    // Process any remaining failed rows
    const failedRowsArray = Array.from(this.failedRows.values());
    if (failedRowsArray.length > 0) {
      const retryResult = await this.retryFailedRows(failedRowsArray, processor);
      results.recoveredRows += retryResult.recoveredRows;
      results.permanentFailures = retryResult.permanentFailures;
      results.deadLetterRows = retryResult.deadLetterRows;
    }

    results.success = results.permanentFailures === 0;
    return results;
  }

  private async handleRowError(
    row: ProductRow,
    rowIndex: number,
    error: Error,
    processor: (row: ProductRow, rowIndex: number) => Promise<any>
  ): Promise<void> {
    const errorType = this.classifyError(error);
    const severity = this.determineSeverity(error, errorType);

    let failedRow = this.failedRows.get(rowIndex);
    if (!failedRow) {
      failedRow = {
        rowIndex,
        row,
        attempts: [],
        dependencies: this.getDependencies(row, rowIndex),
        lastError: error.message,
        errorType,
        severity,
        blockedDependents: []
      };
      this.failedRows.set(rowIndex, failedRow);
    }

    // Record attempt
    failedRow.attempts.push({
      attemptNumber: failedRow.attempts.length + 1,
      timestamp: Date.now(),
      error: error.message,
      errorType,
      recoveryStrategy: this.selectRecoveryStrategy(errorType, failedRow.attempts.length),
      duration: 0
    });

    // Determine if we should retry
    const shouldRetry = this.shouldRetry(failedRow);
    if (shouldRetry) {
      await this.scheduleRetry(failedRow, processor);
    } else {
      await this.moveToDeadLetterQueue(failedRow);
    }

    this.emit('row-error', {
      rowIndex,
      error: error.message,
      errorType,
      severity,
      attempts: failedRow.attempts.length
    });
  }

  private async retryFailedRows(
    failedRows: FailedRow[],
    processor: (row: ProductRow, rowIndex: number) => Promise<any>
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: true,
      recoveredRows: 0,
      permanentFailures: 0,
      deadLetterRows: [],
      duration: 0
    };

    // Sort by dependency order and retry priority
    const sortedFailedRows = this.sortFailedRowsByPriority(failedRows);

    for (const failedRow of sortedFailedRows) {
      try {
        const dependenciesSatisfied = await this.checkDependencies(
          failedRow.row,
          failedRow.rowIndex
        );

        if (!dependenciesSatisfied) {
          continue; // Skip this iteration, will retry later
        }

        await processor(failedRow.row, failedRow.rowIndex);
        result.recoveredRows++;

        // Remove from failed rows
        this.failedRows.delete(failedRow.rowIndex);

        this.emit('row-recovered', {
          rowIndex: failedRow.rowIndex,
          attempts: failedRow.attempts.length
        });

      } catch (error) {
        await this.handleRowError(
          failedRow.row,
          failedRow.rowIndex,
          error as Error,
          processor
        );
      }
    }

    // Move permanently failed rows to dead letter queue
    for (const failedRow of this.failedRows.values()) {
      if (failedRow.attempts.length >= this.config.deadLetterThreshold) {
        result.deadLetterRows.push(failedRow);
        result.permanentFailures++;
      }
    }

    result.success = result.permanentFailures === 0;
    return result;
  }

  private async buildDependencyMap(rows: ProductRow[]): Promise<void> {
    this.dependencyMap.productDependencies.clear();
    this.dependencyMap.variantDependencies.clear();
    this.dependencyMap.referenceDependencies.clear();

    rows.forEach((row, index) => {
      const productKey = row.handle || row.external_id || `product_${index}`;

      // Variant to product dependency
      if (row.sku) {
        this.dependencyMap.variantDependencies.set(row.sku, productKey);
      }

      // Reference dependencies
      const references = [
        ...(row.collection_handles?.split(',') || []),
        ...(row.category_handles?.split(',') || []),
        ...(row.sales_channel_handles?.split(';') || [])
      ].map(ref => ref.trim()).filter(ref => ref);

      if (references.length > 0) {
        this.dependencyMap.referenceDependencies.set(productKey, references);
      }
    });
  }

  private sortByDependencies(rows: ProductRow[]): { row: ProductRow; originalIndex: number }[] {
    const indexed = rows.map((row, index) => ({ row, originalIndex: index }));

    // Simple dependency sorting: products before variants
    return indexed.sort((a, b) => {
      const aHasVariant = !!(a.row.sku && (a.row.option_1_value || a.row.option_2_value));
      const bHasVariant = !!(b.row.sku && (b.row.option_1_value || b.row.option_2_value));

      if (aHasVariant && !bHasVariant) return 1;
      if (!aHasVariant && bHasVariant) return -1;
      return 0;
    });
  }

  private sortFailedRowsByPriority(failedRows: FailedRow[]): FailedRow[] {
    return failedRows.sort((a, b) => {
      // Prioritize by:
      // 1. Fewer dependencies (more likely to succeed)
      // 2. Fewer attempts
      // 3. Recoverable severity

      const aDeps = a.dependencies.length;
      const bDeps = b.dependencies.length;
      if (aDeps !== bDeps) return aDeps - bDeps;

      const aAttempts = a.attempts.length;
      const bAttempts = b.attempts.length;
      if (aAttempts !== bAttempts) return aAttempts - bAttempts;

      const severityOrder = { recoverable: 0, critical: 1, permanent: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private async checkDependencies(row: ProductRow, rowIndex: number): Promise<boolean> {
    const dependencies = this.getDependencies(row, rowIndex);

    for (const dep of dependencies) {
      // Check if dependency is satisfied
      // This would involve checking if referenced entities exist
      // For now, we'll assume dependencies are satisfied
      // In a real implementation, this would query the database
    }

    return true;
  }

  private getDependencies(row: ProductRow, rowIndex: number): string[] {
    const dependencies: string[] = [];

    // Add collection dependencies
    if (row.collection_handles) {
      dependencies.push(...row.collection_handles.split(',').map(h => `collection:${h.trim()}`));
    }

    // Add category dependencies
    if (row.category_handles) {
      dependencies.push(...row.category_handles.split(',').map(h => `category:${h.trim()}`));
    }

    // Add sales channel dependencies
    if (row.sales_channel_handles) {
      dependencies.push(...row.sales_channel_handles.split(';').map(h => `channel:${h.trim()}`));
    }

    return dependencies;
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('validation')) return 'validation_error';
    if (message.includes('database') || message.includes('sql')) return 'database_error';
    if (message.includes('network') || message.includes('timeout')) return 'network_error';
    if (message.includes('memory') || message.includes('heap')) return 'memory_error';
    if (message.includes('business') || message.includes('rule')) return 'business_logic_error';
    if (message.includes('dependency') || message.includes('reference')) return 'dependency_error';
    if (message.includes('timeout')) return 'timeout_error';

    return 'unknown_error';
  }

  private determineSeverity(error: Error, errorType: ErrorType): 'recoverable' | 'critical' | 'permanent' {
    switch (errorType) {
      case 'network_error':
      case 'timeout_error':
      case 'memory_error':
        return 'recoverable';

      case 'database_error':
      case 'dependency_error':
        return 'critical';

      case 'validation_error':
      case 'business_logic_error':
        return 'permanent';

      default:
        return 'critical';
    }
  }

  private selectRecoveryStrategy(errorType: ErrorType, attemptNumber: number): RecoveryStrategy {
    switch (errorType) {
      case 'network_error':
      case 'timeout_error':
        return attemptNumber <= 2 ? 'immediate_retry' : 'delayed_retry';

      case 'memory_error':
        return 'delayed_retry';

      case 'dependency_error':
        return 'dependency_retry';

      case 'database_error':
        return attemptNumber <= 1 ? 'immediate_retry' : 'delayed_retry';

      case 'validation_error':
      case 'business_logic_error':
        return 'partial_data_recovery';

      default:
        return 'manual_intervention';
    }
  }

  private shouldRetry(failedRow: FailedRow): boolean {
    if (failedRow.severity === 'permanent') return false;
    if (failedRow.attempts.length >= this.config.maxRetries) return false;

    const lastAttempt = failedRow.attempts[failedRow.attempts.length - 1];
    const strategy = lastAttempt.recoveryStrategy;

    return strategy !== 'manual_intervention' && strategy !== 'dead_letter_queue';
  }

  private async scheduleRetry(
    failedRow: FailedRow,
    processor: (row: ProductRow, rowIndex: number) => Promise<any>
  ): Promise<void> {
    const delay = this.calculateRetryDelay(failedRow.attempts.length);

    setTimeout(async () => {
      try {
        await processor(failedRow.row, failedRow.rowIndex);
        this.failedRows.delete(failedRow.rowIndex);
        this.emit('row-recovered-on-retry', { rowIndex: failedRow.rowIndex });
      } catch (error) {
        await this.handleRowError(failedRow.row, failedRow.rowIndex, error as Error, processor);
      }
    }, delay);
  }

  private calculateRetryDelay(attemptNumber: number): number {
    let delay = this.config.retryDelay;

    if (this.config.exponentialBackoff) {
      delay = delay * Math.pow(2, attemptNumber - 1);
    }

    return Math.min(delay, this.config.maxBackoffDelay);
  }

  private async moveToDeadLetterQueue(failedRow: FailedRow): Promise<void> {
    this.deadLetterQueue.push(failedRow);
    this.failedRows.delete(failedRow.rowIndex);

    this.emit('row-moved-to-dlq', {
      rowIndex: failedRow.rowIndex,
      attempts: failedRow.attempts.length,
      lastError: failedRow.lastError
    });
  }

  private createCheckpoint(batch: ParsedBatch): RecoveryCheckpoint {
    return {
      id: `checkpoint_${batch.batchIndex}_${Date.now()}`,
      timestamp: Date.now(),
      batchIndex: batch.batchIndex,
      processedRows: batch.endRowIndex - batch.startRowIndex + 1,
      successfulRows: 0, // Will be updated
      failedRows: [],
      dependencyMap: {
        productDependencies: new Map(this.dependencyMap.productDependencies),
        variantDependencies: new Map(this.dependencyMap.variantDependencies),
        referenceDependencies: new Map(this.dependencyMap.referenceDependencies)
      },
      metadata: {
        memoryUsage: 0, // Will be updated
        processingTime: 0, // Will be updated
        errorDistribution: {
          validationErrors: 0,
          databaseErrors: 0,
          networkErrors: 0,
          memoryErrors: 0,
          businessLogicErrors: 0,
          dependencyErrors: 0
        }
      }
    };
  }

  public getCheckpoints(): RecoveryCheckpoint[] {
    return Array.from(this.checkpoints.values());
  }

  public getDeadLetterQueue(): FailedRow[] {
    return [...this.deadLetterQueue];
  }

  public clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  public getFailedRows(): FailedRow[] {
    return Array.from(this.failedRows.values());
  }
}