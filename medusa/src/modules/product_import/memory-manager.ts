/*
  Enhanced Memory Management System with Backpressure Control

  This module provides sophisticated memory management for large file processing,
  implementing backpressure mechanisms to prevent memory exhaustion.
*/

import { EventEmitter } from 'events';

export interface MemoryConfig {
  maxMemoryUsage: number; // Maximum memory usage in MB
  warningThreshold: number; // Warning threshold as percentage (0-1)
  criticalThreshold: number; // Critical threshold as percentage (0-1)
  checkInterval: number; // Memory check interval in ms
  backpressureThreshold: number; // Backpressure threshold as percentage (0-1)
}

export interface MemoryMetrics {
  used: number; // Current memory usage in MB
  max: number; // Maximum allowed memory in MB
  percentage: number; // Current usage percentage (0-1)
  isWarning: boolean;
  isCritical: boolean;
  shouldApplyBackpressure: boolean;
}

export interface ProcessingQueue {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  maxConcurrent: number;
}

export class MemoryManager extends EventEmitter {
  private config: MemoryConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private processingQueue: ProcessingQueue;
  private pausedProcessing = false;

  constructor(config: Partial<MemoryConfig> = {}) {
    super();

    this.config = {
      maxMemoryUsage: config.maxMemoryUsage || 512, // 512MB default
      warningThreshold: config.warningThreshold || 0.7, // 70%
      criticalThreshold: config.criticalThreshold || 0.85, // 85%
      checkInterval: config.checkInterval || 1000, // 1 second
      backpressureThreshold: config.backpressureThreshold || 0.8, // 80%
    };

    this.processingQueue = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      maxConcurrent: this.calculateOptimalConcurrency()
    };
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.checkInterval);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  public getMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    const usedMB = memUsage.heapUsed / 1024 / 1024;
    const percentage = usedMB / this.config.maxMemoryUsage;

    return {
      used: usedMB,
      max: this.config.maxMemoryUsage,
      percentage,
      isWarning: percentage >= this.config.warningThreshold,
      isCritical: percentage >= this.config.criticalThreshold,
      shouldApplyBackpressure: percentage >= this.config.backpressureThreshold
    };
  }

  public getQueueStatus(): ProcessingQueue {
    return { ...this.processingQueue };
  }

  public async waitForAvailableSlot(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        const metrics = this.getMetrics();
        const hasSlot = this.processingQueue.processing < this.processingQueue.maxConcurrent;

        if (!metrics.shouldApplyBackpressure && hasSlot && !this.pausedProcessing) {
          resolve();
        } else {
          // Apply exponential backoff
          const delay = Math.min(1000 * Math.pow(2, this.processingQueue.processing), 10000);
          setTimeout(check, delay);
        }
      };
      check();
    });
  }

  public reserveProcessingSlot(): boolean {
    const metrics = this.getMetrics();
    if (metrics.shouldApplyBackpressure || this.processingQueue.processing >= this.processingQueue.maxConcurrent) {
      return false;
    }

    this.processingQueue.processing++;
    this.processingQueue.pending = Math.max(0, this.processingQueue.pending - 1);
    return true;
  }

  public releaseProcessingSlot(success: boolean): void {
    this.processingQueue.processing = Math.max(0, this.processingQueue.processing - 1);

    if (success) {
      this.processingQueue.completed++;
    } else {
      this.processingQueue.failed++;
    }
  }

  public addToPendingQueue(count: number = 1): void {
    this.processingQueue.pending += count;
  }

  public forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      this.emit('gc-forced');
    }
  }

  public pauseProcessing(): void {
    this.pausedProcessing = true;
    this.emit('processing-paused');
  }

  public resumeProcessing(): void {
    this.pausedProcessing = false;
    this.emit('processing-resumed');
  }

  private checkMemoryUsage(): void {
    const metrics = this.getMetrics();

    if (metrics.isCritical && !this.pausedProcessing) {
      this.pauseProcessing();
      this.forceGarbageCollection();
      this.emit('memory-critical', metrics);
    } else if (metrics.isWarning) {
      this.adjustConcurrency(metrics);
      this.emit('memory-warning', metrics);
    } else if (!metrics.isWarning && this.pausedProcessing) {
      this.resumeProcessing();
    }

    // Emit regular metrics for monitoring
    this.emit('memory-metrics', metrics);
  }

  private adjustConcurrency(metrics: MemoryMetrics): void {
    if (metrics.shouldApplyBackpressure) {
      // Reduce concurrency when approaching memory limits
      this.processingQueue.maxConcurrent = Math.max(1, Math.floor(this.processingQueue.maxConcurrent * 0.7));
    } else if (metrics.percentage < this.config.warningThreshold * 0.8) {
      // Gradually increase concurrency when memory usage is low
      const optimal = this.calculateOptimalConcurrency();
      this.processingQueue.maxConcurrent = Math.min(optimal, this.processingQueue.maxConcurrent + 1);
    }
  }

  private calculateOptimalConcurrency(): number {
    const memUsage = process.memoryUsage();
    const availableMemoryMB = this.config.maxMemoryUsage - (memUsage.heapUsed / 1024 / 1024);

    // Estimate memory per concurrent operation (rough estimate: 10MB per operation)
    const estimatedMemoryPerOp = 10;
    const maxByMemory = Math.max(1, Math.floor(availableMemoryMB / estimatedMemoryPerOp));

    // Also consider CPU cores
    const cpuCores = require('os').cpus().length;
    const maxByCpu = Math.max(2, cpuCores * 2);

    return Math.min(maxByMemory, maxByCpu, 20); // Cap at 20 concurrent operations
  }
}

export interface BatchConfig {
  initialSize: number;
  minSize: number;
  maxSize: number;
  adaptiveAdjustment: boolean;
}

export class AdaptiveBatchSizer {
  private config: BatchConfig;
  private currentSize: number;
  private performanceHistory: number[] = [];
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager, config: Partial<BatchConfig> = {}) {
    this.memoryManager = memoryManager;
    this.config = {
      initialSize: config.initialSize || 50,
      minSize: config.minSize || 10,
      maxSize: config.maxSize || 250,
      adaptiveAdjustment: config.adaptiveAdjustment ?? true
    };
    this.currentSize = this.config.initialSize;
  }

  public getCurrentBatchSize(): number {
    const metrics = this.memoryManager.getMetrics();

    if (metrics.isCritical) {
      return this.config.minSize;
    }

    if (metrics.shouldApplyBackpressure) {
      return Math.max(this.config.minSize, Math.floor(this.currentSize * 0.7));
    }

    return this.currentSize;
  }

  public recordBatchPerformance(batchSize: number, processingTimeMs: number, memoryUsed: number): void {
    if (!this.config.adaptiveAdjustment) {
      return;
    }

    const efficiency = batchSize / (processingTimeMs / 1000); // items per second
    this.performanceHistory.push(efficiency);

    // Keep only recent history
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }

    this.adjustBatchSize();
  }

  private adjustBatchSize(): void {
    if (this.performanceHistory.length < 3) {
      return;
    }

    const recentAvg = this.performanceHistory.slice(-3).reduce((a, b) => a + b) / 3;
    const overallAvg = this.performanceHistory.reduce((a, b) => a + b) / this.performanceHistory.length;

    if (recentAvg > overallAvg * 1.1) {
      // Performance is improving, try larger batches
      this.currentSize = Math.min(this.config.maxSize, Math.floor(this.currentSize * 1.2));
    } else if (recentAvg < overallAvg * 0.9) {
      // Performance is degrading, use smaller batches
      this.currentSize = Math.max(this.config.minSize, Math.floor(this.currentSize * 0.8));
    }
  }
}