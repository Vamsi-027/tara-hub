import { NextRequest } from "next/server";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getJobFromStorage } from "../../utils/job-storage";

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const jobId = req.params.id;

    // Retrieve job from storage with enhanced status
    const job = await getEnhancedJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate processing metrics
    const processingRate = calculateProcessingRate(job);
    const estimatedTimeRemaining = calculateETA(job, processingRate);

    // Enhanced status payload
    const enhancedStatus = {
      id: job.id,
      trace_id: job.trace_id || job.id,
      idempotency_key: job.idempotency_key,
      status: job.status,
      phase: job.phase || derivePhase(job),
      progress: {
        rows_total: job.total_rows,
        rows_processed: job.processed_rows,
        rows_valid: job.valid_rows,
        rows_invalid: job.invalid_rows,
        rows_skipped: job.skipped_rows,
        percentage: job.total_rows > 0 ? Math.round((job.processed_rows / job.total_rows) * 100) : 0
      },
      performance: {
        processing_rate: processingRate, // rows per second
        estimated_time_remaining: estimatedTimeRemaining, // seconds
        started_at: job.created_at,
        updated_at: job.updated_at,
        completed_at: job.completed_at
      },
      artifacts: {
        validation_report: job.validation_report_url,
        error_rows: job.error_rows_csv_url,
        result_summary: job.result_summary_csv_url,
        annotated_input: job.annotated_xlsx_url, // Only for XLSX or if requested
        checkpoint: job.checkpoint_url,
        dlq_entries: job.dlq_url
      },
      options: {
        dry_run: job.dry_run,
        upsert_by: job.upsert_by,
        variant_strategy: job.variant_strategy,
        force_prune_missing_variants: job.force_prune_missing_variants,
        image_strategy: job.image_strategy,
        mapping_profile_id: job.mapping_profile_id
      },
      error: job.error ? {
        code: job.error.code,
        message: job.error.message,
        details: job.error.details
      } : undefined
    };

    return res.status(200).json(enhancedStatus);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve job status',
      details: error instanceof Error ? error.message : undefined
    });
  }
}

function calculateProcessingRate(job: any): number {
  if (!job.started_at || job.processed_rows === 0) return 0;

  const elapsedSeconds = (Date.now() - new Date(job.started_at).getTime()) / 1000;
  return Math.round((job.processed_rows / elapsedSeconds) * 10) / 10; // 1 decimal place
}

function calculateETA(job: any, rate: number): number | null {
  if (!rate || job.status === 'completed' || job.status === 'failed') return null;

  const remainingRows = job.total_rows - job.processed_rows;
  if (remainingRows <= 0) return 0;

  return Math.ceil(remainingRows / rate);
}

function derivePhase(job: any): string {
  if (job.status === 'pending') return 'queued';
  if (job.status === 'processing') {
    if (job.processed_rows === 0) return 'initializing';
    if (job.processed_rows < job.total_rows * 0.1) return 'parsing';
    if (job.processed_rows < job.total_rows * 0.5) return 'validating';
    if (job.processed_rows < job.total_rows * 0.9) return 'importing';
    return 'finalizing';
  }
  if (job.status === 'completed') return 'completed';
  if (job.status === 'failed') return 'failed';
  return 'unknown';
}

async function getEnhancedJobStatus(jobId: string): Promise<any> {
  // This would fetch from your job storage (Redis, DB, etc.)
  // Enhanced to include all necessary fields
  return getJobFromStorage(jobId);
}