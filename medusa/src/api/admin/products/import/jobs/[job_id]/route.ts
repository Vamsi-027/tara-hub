import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { job_id } = req.params as { job_id: string };
    if (!job_id) {
      return res.status(400).json({ error: "job_id parameter required" });
    }

    const batchJobService = req.scope.resolve("batchJobService");
    const job = await batchJobService.retrieve(job_id, { relations: ["result"] });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const stats = calculateEnhancedStats(job);
    const phase = derivePhase(job);
    const artifacts = getArtifactUrls(job);

    return res.json({
      job_id: job.id,
      trace_id: job.context?.trace_id || job.id,
      idempotency_key: job.context?.idempotency_key,
      status: mapJobStatus(job.status),
      phase,
      progress: {
        percentage: calculateProgress(job),
        rows_total: stats.rows_total,
        rows_processed: stats.rows_processed,
        rows_valid: stats.rows_valid,
        rows_invalid: stats.rows_invalid,
        rows_skipped: stats.rows_skipped,
      },
      performance: {
        processing_rate: stats.processing_rate,
        estimated_time_remaining: stats.estimated_time_remaining,
        started_at: job.created_at,
        updated_at: job.updated_at,
        completed_at: job.completed_at,
        duration_ms: stats.duration_ms,
      },
      artifacts,
      options: job.context?.options,
      context: {
        import_id: job.context?.import_id,
        user_id: job.context?.user_id,
      },
      error: job.failed_reason
        ? {
            code: (job as any).failed_reason?.code || "UNKNOWN",
            message: (job as any).failed_reason?.message || job.failed_reason,
            details: (job as any).failed_reason?.details,
          }
        : undefined,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve job status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function calculateProgress(job: any): number {
  const processed = job.result?.progress?.processedRows || job.result?.rows_processed || 0;
  const total = job.result?.progress?.totalRows || job.result?.rows_total || 0;
  if (!total) return 0;
  return Math.round((processed / total) * 100);
}

function calculateEnhancedStats(job: any): any {
  const start = new Date(job.created_at).getTime();
  const elapsedMs = Date.now() - start;
  const processed = job.result?.rows_processed || 0;
  const total = job.result?.rows_total || 0;
  const rate = processed && elapsedMs ? Math.round((processed / (elapsedMs / 1000)) * 10) / 10 : 0;
  const remaining = total - processed;
  const eta = rate > 0 && remaining > 0 ? Math.ceil(remaining / rate) : null;

  return {
    rows_total: total,
    rows_processed: processed,
    rows_valid: job.result?.rows_valid || 0,
    rows_invalid: job.result?.rows_invalid || 0,
    rows_skipped: job.result?.rows_skipped || 0,
    created: job.result?.created || 0,
    updated: job.result?.updated || 0,
    failed: job.result?.failed || 0,
    duration_ms: elapsedMs,
    processing_rate: rate,
    estimated_time_remaining: eta,
  };
}

function getArtifactUrls(job: any): any {
  return job.result?.artifacts || {};
}

function mapJobStatus(batchJobStatus: string): string {
  const statusMap: Record<string, string> = {
    created: "created",
    pre_processed: "validating",
    confirmed: "processing",
    processing: "processing",
    completed: "completed",
    canceled: "canceled",
    failed: "failed",
  };
  return statusMap[batchJobStatus] || batchJobStatus;
}

function derivePhase(job: any): string {
  if (job.status === "created") return "queued";
  if (job.status === "pre_processed") return "validating";
  if (job.status === "processing" || job.status === "confirmed") {
    const pct = calculateProgress(job);
    if (pct === 0) return "initializing";
    if (pct < 10) return "parsing";
    if (pct < 50) return "validating";
    if (pct < 90) return "importing";
    return "finalizing";
  }
  if (job.status === "completed") return "completed";
  if (job.status === "failed") return "failed";
  if (job.status === "canceled") return "canceled";
  return "unknown";
}

