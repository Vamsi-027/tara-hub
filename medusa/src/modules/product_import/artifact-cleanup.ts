/*
  Artifact Cleanup Service

  Manages retention and cleanup of import job artifacts based on TTL
*/

import { promises as fs, Stats } from 'fs';
import * as path from 'path';
import { CronJob } from 'cron';

export interface CleanupConfig {
  artifactsPath: string;
  retentionDays: number;
  cleanupSchedule: string; // Cron expression
  dryRun: boolean;
  maxAgeOverride?: number; // Override for testing (in milliseconds)
}

export interface CleanupResult {
  scanned: number;
  deleted: number;
  retained: number;
  errors: number;
  freedSpaceMB: number;
  executionTimeMs: number;
}

export class ArtifactCleanupService {
  private config: CleanupConfig;
  private cronJob?: CronJob;
  private isRunning = false;

  constructor(config: Partial<CleanupConfig> = {}) {
    this.config = {
      artifactsPath: config.artifactsPath || '/tmp/medusa-imports',
      retentionDays: config.retentionDays || 7,
      cleanupSchedule: config.cleanupSchedule || '0 2 * * *', // 2 AM daily
      dryRun: config.dryRun || false
    };
  }

  /**
   * Start scheduled cleanup job
   */
  public startScheduledCleanup(): void {
    if (this.cronJob) {
      console.warn('Cleanup job already running');
      return;
    }

    this.cronJob = new CronJob(
      this.config.cleanupSchedule,
      async () => {
        console.log('[ArtifactCleanup] Starting scheduled cleanup');
        const result = await this.cleanup();
        this.logCleanupResult(result);
      },
      null,
      true,
      'UTC'
    );

    console.log(`[ArtifactCleanup] Scheduled cleanup started: ${this.config.cleanupSchedule}`);
  }

  /**
   * Stop scheduled cleanup job
   */
  public stopScheduledCleanup(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('[ArtifactCleanup] Scheduled cleanup stopped');
    }
  }

  /**
   * Run cleanup immediately
   */
  public async cleanup(): Promise<CleanupResult> {
    if (this.isRunning) {
      throw new Error('Cleanup already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();

    const result: CleanupResult = {
      scanned: 0,
      deleted: 0,
      retained: 0,
      errors: 0,
      freedSpaceMB: 0,
      executionTimeMs: 0
    };

    try {
      // Ensure artifacts directory exists
      await fs.access(this.config.artifactsPath).catch(() => {
        throw new Error(`Artifacts directory not found: ${this.config.artifactsPath}`);
      });

      // Get all job directories
      const jobDirs = await this.getJobDirectories();
      result.scanned = jobDirs.length;

      // Process each job directory
      for (const jobDir of jobDirs) {
        try {
          const shouldDelete = await this.shouldDeleteJob(jobDir);

          if (shouldDelete) {
            const freedSpace = await this.deleteJobArtifacts(jobDir);
            result.deleted++;
            result.freedSpaceMB += freedSpace;
          } else {
            result.retained++;
          }
        } catch (error) {
          console.error(`[ArtifactCleanup] Error processing ${jobDir}:`, error);
          result.errors++;
        }
      }

    } catch (error) {
      console.error('[ArtifactCleanup] Cleanup failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      result.executionTimeMs = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Get all job directories in artifacts path
   */
  private async getJobDirectories(): Promise<string[]> {
    const entries = await fs.readdir(this.config.artifactsPath, { withFileTypes: true });

    return entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('import_'))
      .map(entry => path.join(this.config.artifactsPath, entry.name));
  }

  /**
   * Determine if job artifacts should be deleted based on age
   */
  private async shouldDeleteJob(jobPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(jobPath);
      const ageMs = Date.now() - stats.mtime.getTime();

      // Use override for testing if provided
      const maxAgeMs = this.config.maxAgeOverride ||
        (this.config.retentionDays * 24 * 60 * 60 * 1000);

      return ageMs > maxAgeMs;
    } catch (error) {
      console.error(`[ArtifactCleanup] Failed to stat ${jobPath}:`, error);
      return false;
    }
  }

  /**
   * Delete job artifacts directory and calculate freed space
   */
  private async deleteJobArtifacts(jobPath: string): Promise<number> {
    if (this.config.dryRun) {
      console.log(`[ArtifactCleanup] DRY RUN - Would delete: ${jobPath}`);
      const size = await this.calculateDirectorySize(jobPath);
      return size / (1024 * 1024); // Convert to MB
    }

    const sizeBytes = await this.calculateDirectorySize(jobPath);
    await fs.rm(jobPath, { recursive: true, force: true });
    console.log(`[ArtifactCleanup] Deleted: ${jobPath} (freed ${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`);

    return sizeBytes / (1024 * 1024);
  }

  /**
   * Calculate total size of directory in bytes
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Log cleanup result with appropriate severity
   */
  private logCleanupResult(result: CleanupResult): void {
    const logLevel = result.errors > 0 ? 'warn' : 'info';

    console[logLevel]('[ArtifactCleanup] Cleanup completed:', {
      ...result,
      freedSpaceMB: `${result.freedSpaceMB.toFixed(2)}MB`,
      executionTimeMs: `${result.executionTimeMs}ms`,
      successRate: result.scanned > 0
        ? `${((result.deleted + result.retained) / result.scanned * 100).toFixed(1)}%`
        : 'N/A'
    });

    // Emit metrics for monitoring
    this.emitMetrics(result);
  }

  /**
   * Emit metrics for observability platforms
   */
  private emitMetrics(result: CleanupResult): void {
    // This would integrate with your metrics system (Datadog, CloudWatch, etc.)
    const metrics = {
      'artifact_cleanup.scanned': result.scanned,
      'artifact_cleanup.deleted': result.deleted,
      'artifact_cleanup.retained': result.retained,
      'artifact_cleanup.errors': result.errors,
      'artifact_cleanup.freed_space_mb': result.freedSpaceMB,
      'artifact_cleanup.duration_ms': result.executionTimeMs
    };

    // Example: Send to monitoring system
    // metricsClient.gauge(metrics);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[ArtifactCleanup] Metrics:', metrics);
    }
  }

  /**
   * Get cleanup status and configuration
   */
  public getStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    config: CleanupConfig;
  } {
    return {
      isRunning: this.isRunning,
      isScheduled: !!this.cronJob,
      config: this.config
    };
  }

  /**
   * Update configuration (requires restart of scheduled job)
   */
  public updateConfig(newConfig: Partial<CleanupConfig>): void {
    const wasScheduled = !!this.cronJob;

    if (wasScheduled) {
      this.stopScheduledCleanup();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasScheduled) {
      this.startScheduledCleanup();
    }
  }
}

// Singleton instance for application-wide use
let cleanupService: ArtifactCleanupService | null = null;

export function getCleanupService(config?: Partial<CleanupConfig>): ArtifactCleanupService {
  if (!cleanupService) {
    cleanupService = new ArtifactCleanupService(config);
  }
  return cleanupService;
}

// Initialize on module load if in production
if (process.env.NODE_ENV === 'production') {
  const service = getCleanupService({
    retentionDays: parseInt(process.env.ARTIFACT_RETENTION_DAYS || '7'),
    dryRun: process.env.ARTIFACT_CLEANUP_DRY_RUN === 'true'
  });
  service.startScheduledCleanup();
}