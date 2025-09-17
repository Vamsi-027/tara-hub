/*
  Product Import Batch Job API Endpoints

  Single-step creation and execution with comprehensive safety gates
*/

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import multer from "multer";
import { Modules } from "@medusajs/framework/utils";
import { IFileModuleService } from "@medusajs/framework/types";
import { z } from "zod";
import * as crypto from "crypto";
import { ImportConfigValidator, getEnvironmentConfig } from "../../../../modules/product_import/import-config";
import { MappingProfileService } from "../../../../modules/product_import/mapping-profiles";
import { ArtifactGenerator } from "../../../../modules/product_import/artifact-generator";

// Load configuration
const configValidator = new ImportConfigValidator(getEnvironmentConfig());
const config = configValidator.getConfig();

// Request validation schemas with safety defaults
const createJobSchema = z.object({
  mode: z.enum(["dry_run", "execute"]).default("dry_run"),
  source_job_id: z.string().optional(),
  upsert: z.enum(["off", "handle", "sku", "external_id"]).default(config.defaults.upsert_by),
  variant_strategy: z.enum(["explicit", "default_type"]).default(config.defaults.variant_strategy),
  image_strategy: z.enum(["merge", "replace", "append"]).default(config.defaults.image_strategy),
  skip_image_validation: z.boolean().default(!config.rate_limits.enable_image_validation),
  unarchive: z.boolean().default(false),
  force_prune_missing_variants: z.boolean().default(config.defaults.force_prune_missing_variants),
  prune_confirm_token: z.string().optional(),
  column_mapping_json: z.record(z.string()).optional(),
  mapping_profile_id: z.string().optional(),
});

// POST /admin/products/import/jobs
// Multer memory storage for single file field named "file"
const upload = multer({ storage: multer.memoryStorage() }).single("file");

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Wrap multer parsing to support multipart form-data
  const parseMultipart = () =>
    new Promise<void>((resolve) => {
      upload(req as any, res as any, () => resolve());
    });

  try {
    await parseMultipart();
    // Validate admin scope
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Check idempotency key
    const idempotencyKey = req.headers["idempotency-key"] as string;
    if (!idempotencyKey) {
      return res.status(400).json({ error: "Idempotency-Key header required" });
    }

    // Parse and validate request body
    const validation = createJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const options = validation.data;

    // Check concurrent import limit
    const userId = req.user.id;
    const activeJobs = await getActiveJobsCount(req.scope, userId);

    if (activeJobs >= config.limits.max_concurrent_imports) {
      return res.status(429).json({
        error: `Maximum concurrent imports (${config.limits.max_concurrent_imports}) reached`,
        active_jobs: activeJobs,
        retry_after: 60,
      });
    }

    // Enforce pruning safety gates
    if (options.force_prune_missing_variants) {
      const pruneCheck = configValidator.isPruningAllowed(options);
      if (!pruneCheck.allowed) {
        return res.status(400).json({
          error: pruneCheck.reason,
          pruning_disabled: true,
        });
      }

      const confirmHeader = req.headers["x-confirm-prune"];
      const confirmToken = options.prune_confirm_token;

      if (confirmHeader !== "yes" || confirmToken !== "PRUNE_VARIANTS") {
        return res.status(400).json({
          error: "Destructive operation requires confirmation",
          required: {
            header: "X-Confirm-Prune: yes",
            body: 'prune_confirm_token: "PRUNE_VARIANTS"',
          },
        });
      }
    }

    // Generate trace ID and import session ID; batch job id returned from service
    const importId = `session_${crypto.randomBytes(16).toString("hex")}`;
    const traceId = (req.headers["x-trace-id"] as string) || `trace_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Handle file upload or source_job_id
    let fileUrl: string | undefined;

    if (options.source_job_id) {
      // Reuse file from previous job
      const sourceJob = await getJobById(req.scope, options.source_job_id);
      if (!sourceJob) {
        return res.status(404).json({ error: "Source job not found" });
      }
      fileUrl = sourceJob.context?.file_url;
    } else if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File;
      // Validate file size
      const limitCheck = configValidator.isWithinLimits(file.size, 0);
      if (!limitCheck.valid) {
        return res.status(400).json({ error: limitCheck.reason });
      }

      // Upload via File Module
      const fileModule: IFileModuleService = req.scope.resolve(Modules.FILE);
      const filenameSafe = file.originalname?.replace(/[^a-zA-Z0-9._-]/g, "_") || `import_${Date.now()}.dat`;
      const base64 = file.buffer.toString("base64");
      const created = await fileModule.createFiles([
        {
          filename: `imports/${userId}/${Date.now()}_${filenameSafe}`,
          mimeType: file.mimetype,
          content: base64,
        },
      ]);
      fileUrl = created[0]?.url;
    } else {
      return res.status(400).json({
        error: "Either file upload or source_job_id required"
      });
    }

    // Note: Artifact generation and mapping profile application
    // will be handled by the batch job processor

    // Create batch job context with enhanced metadata
    const batchJobService = req.scope.resolve("batchJobService");
    const job = await batchJobService.create({
      type: "product-import",
      context: {
        trace_id: traceId,
        import_id: importId,
        file_url: fileUrl,
        options: {
          ...options,
          column_mapping_json: options.column_mapping_json,
        },
        idempotency_key: idempotencyKey,
        user_id: req.user.id,
        created_at: new Date().toISOString(),
        config: {
          limits: config.limits,
          rate_limits: config.rate_limits,
        },
      },
      dry_run: options.mode === "dry_run",
    });

    // No need to mirror ID - the processor will use batchJob.id directly

    // Start job processing
    await batchJobService.confirm(job.id);

    res.json({
      job_id: job.id,
      trace_id: traceId,
      idempotency_key: idempotencyKey,
      status: "created",
      import_id: importId,
      mode: options.mode,
      configuration: {
        dry_run: options.mode === "dry_run",
        upsert_by: options.upsert,
        variant_strategy: options.variant_strategy,
        force_prune: options.force_prune_missing_variants,
        limits_applied: {
          max_rows: config.limits.max_rows,
          max_file_size_mb: config.limits.max_file_size_mb,
          rate_limit_rows_per_second: config.rate_limits.rows_per_second,
        },
      },
      message: `Import job created and ${options.mode === "dry_run" ? "validation started" : "execution started"}`,
      links: {
        status: `/admin/products/import/jobs/${job.id}`,
        cancel: `/admin/products/import/jobs/${job.id}/cancel`,
        artifacts: `/admin/products/import/jobs/${job.id}/artifacts`,
      },
    });
  } catch (error) {
    console.error("Product import job creation failed:", error);
    res.status(500).json({
      error: "Failed to create import job",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// GET /admin/products/import/jobs/:job_id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({ error: "job_id parameter required" });
    }

    // Get job from batch job service
    const batchJobService = req.scope.resolve("batchJobService");
    const job = await batchJobService.retrieve(job_id, {
      relations: ["result"],
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Calculate enhanced progress and stats
    const progress = calculateProgress(job);
    const stats = calculateEnhancedStats(job);
    const artifacts = getArtifactUrls(job);
    const phase = derivePhase(job);

    res.json({
      job_id: job.id,
      trace_id: job.context.trace_id || job.context.job_id,
      idempotency_key: job.context.idempotency_key,
      status: mapJobStatus(job.status),
      phase,
      progress: {
        percentage: progress,
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
      options: job.context.options,
      context: {
        import_id: job.context.import_id,
        user_id: job.context.user_id,
      },
      error: job.failed_reason ? {
        code: job.failed_reason.code || "UNKNOWN",
        message: job.failed_reason.message || job.failed_reason,
        details: job.failed_reason.details,
      } : undefined,
    });
  } catch (error) {
    console.error("Failed to retrieve job status:", error);
    res.status(500).json({
      error: "Failed to retrieve job status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Helper functions
async function getJobById(scope: any, jobId: string): Promise<any> {
  try {
    const batchJobService = scope.resolve("batchJobService");
    const job = await batchJobService.retrieve(jobId);
    return job;
  } catch (e) {
    return null;
  }
}

function calculateProgress(job: any): number {
  if (!job.result?.progress) return 0;

  const { processedRows, totalRows } = job.result.progress;
  if (!totalRows || totalRows === 0) return 0;

  return Math.round((processedRows / totalRows) * 100);
}

function calculateEnhancedStats(job: any): any {
  const startTime = new Date(job.created_at).getTime();
  const currentTime = Date.now();
  const elapsedMs = currentTime - startTime;
  const elapsedSeconds = elapsedMs / 1000;

  const processedRows = job.result?.rows_processed || 0;
  const totalRows = job.result?.rows_total || 0;
  const processingRate = processedRows > 0 && elapsedSeconds > 0
    ? Math.round((processedRows / elapsedSeconds) * 10) / 10
    : 0;

  const remainingRows = totalRows - processedRows;
  const estimatedTimeRemaining = processingRate > 0 && remainingRows > 0
    ? Math.ceil(remainingRows / processingRate)
    : null;

  return {
    rows_total: totalRows,
    rows_processed: processedRows,
    rows_valid: job.result?.rows_valid || 0,
    rows_invalid: job.result?.rows_invalid || 0,
    rows_skipped: job.result?.rows_skipped || 0,
    created: job.result?.created || 0,
    updated: job.result?.updated || 0,
    failed: job.result?.failed || 0,
    duration_ms: elapsedMs,
    processing_rate: processingRate,
    estimated_time_remaining: estimatedTimeRemaining,
  };
}

function getArtifactUrls(job: any): any {
  // Return direct File Module URLs stored by the processor
  const artifacts = job.result?.artifacts || {};

  return {
    validation_report_url: artifacts.validation_report_url,
    error_rows_url: artifacts.error_rows_url,
    result_summary_url: artifacts.result_summary_url,
    annotated_xlsx_url: artifacts.annotated_xlsx_url,
    prune_preview_url: artifacts.prune_preview_url,
  };
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
    const progress = calculateProgress(job);
    if (progress === 0) return "initializing";
    if (progress < 10) return "parsing";
    if (progress < 50) return "validating";
    if (progress < 90) return "importing";
    return "finalizing";
  }
  if (job.status === "completed") return "completed";
  if (job.status === "failed") return "failed";
  if (job.status === "canceled") return "canceled";
  return "unknown";
}

async function getActiveJobsCount(scope: any, userId: string): Promise<number> {
  try {
    const batchJobService = scope.resolve("batchJobService");
    const jobs = await batchJobService.listAndCount(
      {
        type: "product-import",
        status: ["created", "pre_processed", "confirmed", "processing"],
        context: { user_id: userId },
      },
      { take: 10 }
    );
    return jobs[1]; // count
  } catch (error) {
    console.error("Failed to count active jobs:", error);
    return 0;
  }
}
