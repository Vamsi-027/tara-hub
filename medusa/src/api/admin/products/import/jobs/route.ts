/*
  Product Import Batch Job API Endpoints

  Single-step creation and execution with comprehensive safety gates
*/

import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { z } from "zod";
import * as crypto from "crypto";

// Request validation schemas
const createJobSchema = z.object({
  mode: z.enum(["dry_run", "execute"]).default("dry_run"),
  source_job_id: z.string().optional(),
  upsert: z.enum(["off", "handle", "sku", "external_id"]).default("off"),
  variant_strategy: z.enum(["explicit", "default_type"]).default("explicit"),
  image_strategy: z.enum(["merge", "replace"]).default("merge"),
  skip_image_validation: z.boolean().default(true),
  unarchive: z.boolean().default(false),
  force_prune_missing_variants: z.boolean().default(false),
  prune_confirm_token: z.string().optional(),
  column_mapping_json: z.record(z.string()).optional(),
  mapping_profile_id: z.string().optional(),
});

// POST /admin/products/import/jobs
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
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

    // Enforce pruning safety gates
    if (options.force_prune_missing_variants) {
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

    // Generate job ID and import session ID
    const jobId = `import_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const importId = `session_${crypto.randomBytes(16).toString("hex")}`;

    // Handle file upload or source_job_id
    let fileUrl: string | undefined;

    if (options.source_job_id) {
      // Reuse file from previous job
      const sourceJob = await getJobById(options.source_job_id);
      if (!sourceJob) {
        return res.status(404).json({ error: "Source job not found" });
      }
      fileUrl = sourceJob.file_url;
    } else if (req.file) {
      // Process uploaded file
      const fileService = req.scope.resolve("fileService");
      const uploadResult = await fileService.upload({
        file: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
      });
      fileUrl = uploadResult.url;
    } else {
      return res.status(400).json({
        error: "Either file upload or source_job_id required"
      });
    }

    // Create batch job context
    const batchJobService = req.scope.resolve("batchJobService");
    const job = await batchJobService.create({
      type: "product-import",
      context: {
        job_id: jobId,
        import_id: importId,
        file_url: fileUrl,
        options,
        idempotency_key: idempotencyKey,
        user_id: req.user.id,
        created_at: new Date().toISOString(),
      },
      dry_run: options.mode === "dry_run",
    });

    // Start job processing
    await batchJobService.confirm(job.id);

    res.json({
      job_id: jobId,
      status: "created",
      import_id: importId,
      mode: options.mode,
      message: `Import job created and ${options.mode === "dry_run" ? "validation started" : "execution started"}`,
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

    // Calculate progress and stats
    const progress = calculateProgress(job);
    const stats = calculateStats(job);
    const artifacts = getArtifactUrls(job);

    res.json({
      job_id: job.context.job_id,
      status: mapJobStatus(job.status),
      progress,
      stats,
      artifacts,
      context: {
        import_id: job.context.import_id,
        options: job.context.options,
        created_at: job.created_at,
        updated_at: job.updated_at,
        completed_at: job.completed_at,
      },
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
async function getJobById(jobId: string): Promise<any> {
  // Implement job retrieval logic
  return null;
}

function calculateProgress(job: any): number {
  if (!job.result?.progress) return 0;

  const { processedRows, totalRows } = job.result.progress;
  if (!totalRows || totalRows === 0) return 0;

  return Math.round((processedRows / totalRows) * 100);
}

function calculateStats(job: any): any {
  return {
    rows_total: job.result?.rows_total || 0,
    rows_valid: job.result?.rows_valid || 0,
    rows_invalid: job.result?.rows_invalid || 0,
    created: job.result?.created || 0,
    updated: job.result?.updated || 0,
    skipped: job.result?.skipped || 0,
    failed: job.result?.failed || 0,
    duration_ms: job.result?.duration_ms || 0,
    processing_rate: job.result?.processing_rate || 0,
    estimated_time_remaining: job.result?.estimated_time_remaining || 0,
  };
}

function getArtifactUrls(job: any): any {
  const baseUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
  const artifacts = job.result?.artifacts || {};

  return {
    validation_report_url: artifacts.validation_report
      ? `${baseUrl}/admin/products/import/artifacts/${artifacts.validation_report}`
      : undefined,
    error_rows_url: artifacts.error_rows
      ? `${baseUrl}/admin/products/import/artifacts/${artifacts.error_rows}`
      : undefined,
    result_rows_url: artifacts.result_rows
      ? `${baseUrl}/admin/products/import/artifacts/${artifacts.result_rows}`
      : undefined,
    annotated_xlsx_url: artifacts.annotated_xlsx
      ? `${baseUrl}/admin/products/import/artifacts/${artifacts.annotated_xlsx}`
      : undefined,
    prune_preview_url: artifacts.prune_preview
      ? `${baseUrl}/admin/products/import/artifacts/${artifacts.prune_preview}`
      : undefined,
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