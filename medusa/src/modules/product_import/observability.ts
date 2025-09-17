/*
  Observability and Metrics Collection

  Provides comprehensive metrics collection for monitoring import job performance,
  failure rates, backpressure events, and system health.
*/

import { EventEmitter } from 'events';

export interface ImportMetrics {
  // Job metrics
  jobs_created: number;
  jobs_completed: number;
  jobs_failed: number;
  jobs_in_progress: number;
  jobs_queued: number;

  // Row processing metrics
  rows_processed_total: number;
  rows_valid_total: number;
  rows_invalid_total: number;
  rows_skipped_total: number;

  // Performance metrics
  avg_processing_rate: number; // rows per second
  avg_job_duration_ms: number;
  p95_job_duration_ms: number;
  p99_job_duration_ms: number;

  // Memory metrics
  memory_usage_mb: number;
  memory_peak_mb: number;
  backpressure_events: number;
  gc_events: number;

  // Error metrics
  validation_errors_total: number;
  parsing_errors_total: number;
  db_errors_total: number;
  dlq_entries_total: number;

  // Resource metrics
  active_memory_managers: number;
  active_stream_parsers: number;
  artifact_storage_mb: number;

  // Rate limiting metrics
  rate_limit_throttles: number;
  image_validation_skipped: number;
}

export interface MetricEvent {
  timestamp: Date;
  type: string;
  value: number;
  labels?: Record<string, string>;
}

export interface AlertCondition {
  metric: keyof ImportMetrics;
  threshold: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  duration?: number; // Sustained duration in seconds
  cooldown?: number; // Cooldown period after alert
}

export class ImportObservability extends EventEmitter {
  private metrics: ImportMetrics;
  private metricHistory: Map<string, MetricEvent[]>;
  private jobDurations: number[] = [];
  private alertConditions: AlertCondition[] = [];
  private lastAlerts: Map<string, Date> = new Map();
  private collectionInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.metricHistory = new Map();
    this.setupDefaultAlerts();
  }

  private initializeMetrics(): ImportMetrics {
    return {
      jobs_created: 0,
      jobs_completed: 0,
      jobs_failed: 0,
      jobs_in_progress: 0,
      jobs_queued: 0,
      rows_processed_total: 0,
      rows_valid_total: 0,
      rows_invalid_total: 0,
      rows_skipped_total: 0,
      avg_processing_rate: 0,
      avg_job_duration_ms: 0,
      p95_job_duration_ms: 0,
      p99_job_duration_ms: 0,
      memory_usage_mb: 0,
      memory_peak_mb: 0,
      backpressure_events: 0,
      gc_events: 0,
      validation_errors_total: 0,
      parsing_errors_total: 0,
      db_errors_total: 0,
      dlq_entries_total: 0,
      active_memory_managers: 0,
      active_stream_parsers: 0,
      artifact_storage_mb: 0,
      rate_limit_throttles: 0,
      image_validation_skipped: 0
    };
  }

  private setupDefaultAlerts(): void {
    this.alertConditions = [
      {
        metric: 'jobs_failed',
        threshold: 5,
        operator: 'gt',
        duration: 300, // 5 minutes
        cooldown: 900 // 15 minutes
      },
      {
        metric: 'memory_usage_mb',
        threshold: 450, // 450MB
        operator: 'gt',
        duration: 60,
        cooldown: 300
      },
      {
        metric: 'backpressure_events',
        threshold: 10,
        operator: 'gt',
        duration: 120,
        cooldown: 600
      },
      {
        metric: 'dlq_entries_total',
        threshold: 50,
        operator: 'gt',
        duration: 180,
        cooldown: 1800
      },
      {
        metric: 'avg_processing_rate',
        threshold: 5, // Less than 5 rows/second
        operator: 'lt',
        duration: 300,
        cooldown: 600
      }
    ];
  }

  /**
   * Start collecting metrics periodically
   */
  public startCollection(intervalMs: number = 30000): void {
    if (this.collectionInterval) {
      return;
    }

    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkAlertConditions();
      this.publishMetrics();
    }, intervalMs);

    console.log(`[Observability] Started metrics collection (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop metrics collection
   */
  public stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
      console.log('[Observability] Stopped metrics collection');
    }
  }

  /**
   * Record a job event
   */
  public recordJobEvent(event: 'created' | 'completed' | 'failed' | 'started', jobId: string): void {
    switch (event) {
      case 'created':
        this.metrics.jobs_created++;
        this.metrics.jobs_queued++;
        break;
      case 'started':
        this.metrics.jobs_queued = Math.max(0, this.metrics.jobs_queued - 1);
        this.metrics.jobs_in_progress++;
        break;
      case 'completed':
        this.metrics.jobs_completed++;
        this.metrics.jobs_in_progress = Math.max(0, this.metrics.jobs_in_progress - 1);
        break;
      case 'failed':
        this.metrics.jobs_failed++;
        this.metrics.jobs_in_progress = Math.max(0, this.metrics.jobs_in_progress - 1);
        break;
    }

    this.recordMetric('job_event', 1, { event, job_id: jobId });
  }

  /**
   * Record job duration
   */
  public recordJobDuration(durationMs: number): void {
    this.jobDurations.push(durationMs);

    // Keep only last 100 durations for percentile calculation
    if (this.jobDurations.length > 100) {
      this.jobDurations.shift();
    }

    this.updateDurationMetrics();
  }

  /**
   * Record row processing
   */
  public recordRowProcessing(valid: number, invalid: number, skipped: number): void {
    this.metrics.rows_valid_total += valid;
    this.metrics.rows_invalid_total += invalid;
    this.metrics.rows_skipped_total += skipped;
    this.metrics.rows_processed_total += valid + invalid + skipped;
  }

  /**
   * Record processing rate
   */
  public recordProcessingRate(rowsPerSecond: number): void {
    // Calculate moving average
    const alpha = 0.3; // Smoothing factor
    this.metrics.avg_processing_rate =
      this.metrics.avg_processing_rate * (1 - alpha) + rowsPerSecond * alpha;
  }

  /**
   * Record memory event
   */
  public recordMemoryEvent(event: 'usage' | 'peak' | 'backpressure' | 'gc', valueMB?: number): void {
    switch (event) {
      case 'usage':
        this.metrics.memory_usage_mb = valueMB || 0;
        break;
      case 'peak':
        this.metrics.memory_peak_mb = Math.max(this.metrics.memory_peak_mb, valueMB || 0);
        break;
      case 'backpressure':
        this.metrics.backpressure_events++;
        break;
      case 'gc':
        this.metrics.gc_events++;
        break;
    }
  }

  /**
   * Record error event
   */
  public recordError(type: 'validation' | 'parsing' | 'db' | 'dlq', count: number = 1): void {
    switch (type) {
      case 'validation':
        this.metrics.validation_errors_total += count;
        break;
      case 'parsing':
        this.metrics.parsing_errors_total += count;
        break;
      case 'db':
        this.metrics.db_errors_total += count;
        break;
      case 'dlq':
        this.metrics.dlq_entries_total += count;
        break;
    }
  }

  /**
   * Get current metrics snapshot
   */
  public getMetrics(): ImportMetrics {
    return { ...this.metrics };
  }

  /**
   * Get metric history for a specific metric
   */
  public getMetricHistory(metric: string, limit: number = 100): MetricEvent[] {
    const history = this.metricHistory.get(metric) || [];
    return history.slice(-limit);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Update duration metrics
   */
  private updateDurationMetrics(): void {
    if (this.jobDurations.length === 0) return;

    const sum = this.jobDurations.reduce((a, b) => a + b, 0);
    this.metrics.avg_job_duration_ms = sum / this.jobDurations.length;
    this.metrics.p95_job_duration_ms = this.calculatePercentile(this.jobDurations, 95);
    this.metrics.p99_job_duration_ms = this.calculatePercentile(this.jobDurations, 99);
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.recordMemoryEvent('usage', memUsage.heapUsed / 1024 / 1024);
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(): void {
    const now = new Date();

    for (const condition of this.alertConditions) {
      const metricValue = this.metrics[condition.metric];
      let shouldAlert = false;

      switch (condition.operator) {
        case 'gt':
          shouldAlert = metricValue > condition.threshold;
          break;
        case 'lt':
          shouldAlert = metricValue < condition.threshold && metricValue > 0;
          break;
        case 'gte':
          shouldAlert = metricValue >= condition.threshold;
          break;
        case 'lte':
          shouldAlert = metricValue <= condition.threshold;
          break;
        case 'eq':
          shouldAlert = metricValue === condition.threshold;
          break;
      }

      if (shouldAlert) {
        const alertKey = `${condition.metric}_${condition.operator}_${condition.threshold}`;
        const lastAlert = this.lastAlerts.get(alertKey);

        // Check cooldown
        if (lastAlert) {
          const cooldownMs = (condition.cooldown || 300) * 1000;
          if (now.getTime() - lastAlert.getTime() < cooldownMs) {
            continue; // Skip due to cooldown
          }
        }

        // Emit alert
        this.emit('alert', {
          condition,
          value: metricValue,
          timestamp: now,
          message: `${condition.metric} ${condition.operator} ${condition.threshold} (current: ${metricValue})`
        });

        this.lastAlerts.set(alertKey, now);
        console.warn('[Observability] Alert triggered:', alertKey, metricValue);
      }
    }
  }

  /**
   * Publish metrics to external systems
   */
  private publishMetrics(): void {
    // This would integrate with your metrics platform
    this.emit('metrics', this.metrics);

    // Example integrations:
    // - Datadog: datadogClient.gauge('medusa.import', metrics)
    // - CloudWatch: cloudwatch.putMetricData(metrics)
    // - Prometheus: prometheusRegistry.register(metrics)

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Observability] Metrics published:', {
        jobs: {
          created: this.metrics.jobs_created,
          completed: this.metrics.jobs_completed,
          failed: this.metrics.jobs_failed,
          in_progress: this.metrics.jobs_in_progress
        },
        performance: {
          avg_rate: this.metrics.avg_processing_rate,
          avg_duration: this.metrics.avg_job_duration_ms
        },
        memory: {
          usage: this.metrics.memory_usage_mb,
          backpressure: this.metrics.backpressure_events
        },
        errors: {
          validation: this.metrics.validation_errors_total,
          dlq: this.metrics.dlq_entries_total
        }
      });
    }
  }

  /**
   * Record a metric event
   */
  private recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const event: MetricEvent = {
      timestamp: new Date(),
      type: name,
      value,
      labels
    };

    if (!this.metricHistory.has(name)) {
      this.metricHistory.set(name, []);
    }

    const history = this.metricHistory.get(name)!;
    history.push(event);

    // Keep only last 1000 events per metric
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Get dashboard data for UI
   */
  public getDashboardData(): any {
    const metrics = this.getMetrics();

    return {
      overview: {
        total_jobs: metrics.jobs_created,
        success_rate: metrics.jobs_created > 0
          ? ((metrics.jobs_completed / metrics.jobs_created) * 100).toFixed(1)
          : 0,
        failure_rate: metrics.jobs_created > 0
          ? ((metrics.jobs_failed / metrics.jobs_created) * 100).toFixed(1)
          : 0,
        active_jobs: metrics.jobs_in_progress,
        queued_jobs: metrics.jobs_queued
      },
      performance: {
        avg_processing_rate: metrics.avg_processing_rate.toFixed(1),
        avg_duration_seconds: (metrics.avg_job_duration_ms / 1000).toFixed(1),
        p95_duration_seconds: (metrics.p95_job_duration_ms / 1000).toFixed(1),
        p99_duration_seconds: (metrics.p99_job_duration_ms / 1000).toFixed(1)
      },
      resources: {
        memory_usage_mb: metrics.memory_usage_mb.toFixed(1),
        memory_peak_mb: metrics.memory_peak_mb.toFixed(1),
        backpressure_events: metrics.backpressure_events,
        gc_events: metrics.gc_events
      },
      quality: {
        total_rows: metrics.rows_processed_total,
        valid_rate: metrics.rows_processed_total > 0
          ? ((metrics.rows_valid_total / metrics.rows_processed_total) * 100).toFixed(1)
          : 0,
        error_rate: metrics.rows_processed_total > 0
          ? ((metrics.rows_invalid_total / metrics.rows_processed_total) * 100).toFixed(1)
          : 0,
        dlq_size: metrics.dlq_entries_total
      },
      alerts: Array.from(this.lastAlerts.entries()).map(([key, date]) => ({
        alert: key,
        triggered_at: date.toISOString()
      }))
    };
  }
}

// Singleton instance
let observability: ImportObservability | null = null;

export function getObservability(): ImportObservability {
  if (!observability) {
    observability = new ImportObservability();

    // Auto-start in production
    if (process.env.NODE_ENV === 'production') {
      observability.startCollection();
    }
  }
  return observability;
}