/*
  Product Import Batch Job Processor

  Handles the actual processing of product import jobs:
  - Downloads and parses CSV/XLSX files
  - Performs validation in dry-run mode
  - Creates/updates products in execute mode
  - Generates artifacts and updates job status
*/

import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { MemoryManager } from "../modules/product_import/memory-manager";
import { StreamingParser } from "../modules/product_import/streaming-parser";
import { DataIntegrityValidator, ValidationContext, ValidationIssue } from "../modules/product_import/data-integrity";
import { ColumnMapper } from "../modules/product_import/column-mapper";
import { ArtifactGenerator, ErrorRow, ImportResult } from "../modules/product_import/artifact-generator";
import { productRowSchema, ProductRow } from "../modules/product_import/schemas";
import { rowToProductInput } from "../modules/product_import/mapping";
import { getObservability } from "../modules/product_import/observability";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { parse as csvParse } from "csv-parse";
import * as path from "path";
import * as fs from "fs/promises";

interface ImportJobContext {
  job_id: string;
  trace_id: string;
  import_id: string;
  file_url: string;
  options: {
    mode: "dry_run" | "execute";
    upsert?: string;
    variant_strategy?: string;
    column_mapping_json?: Record<string, string>;
    skip_image_validation?: boolean;
  };
  idempotency_key: string;
  user_id: string;
  config?: {
    limits: any;
    rate_limits: any;
  };
}

export default async function handler(
  batchJob: any,
  container: MedusaContainer
): Promise<void> {
  const data = batchJob.context as ImportJobContext;
  const batchJobService = container.resolve("batchJobService");
  const fileModule = container.resolve(Modules.FILE);
  const productModule = container.resolve(Modules.PRODUCT);
  const observability = getObservability();

  const jobId = batchJob.id; // Use the actual batch job ID
  const traceId = data.trace_id;
  const isDryRun = data.options.mode === "dry_run";

  console.log(`[ProductImport] Starting ${isDryRun ? "dry-run" : "execution"} for job ${jobId}`);
  observability.recordJobEvent("started", jobId);

  const startTime = Date.now();
  let processedRows = 0;
  let validRows = 0;
  let invalidRows = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  try {
    // Initialize components
    const memoryManager = new MemoryManager(data.config?.limits || {});
    const artifactGenerator = new ArtifactGenerator(jobId);
    await artifactGenerator.initialize();

    // Download file from URL
    const tempFilePath = `/tmp/import_${jobId}_${Date.now()}.csv`;
    console.log(`[ProductImport] Downloading file from ${data.file_url}`);

    // For V1, assume File Module URL or accessible URL
    const response = await fetch(data.file_url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(tempFilePath, buffer);

    // Detect file type (CSV only for V1)
    const isCSV = data.file_url.endsWith(".csv") || buffer.toString("utf8", 0, 100).includes(",");
    if (!isCSV) {
      throw new Error("Only CSV files are supported in V1. XLSX support coming soon.");
    }

    // Parse CSV and collect rows
    const rows: any[] = [];
    const headers: string[] = [];
    const validationIssues = new Map<number, ValidationIssue[]>();
    const errorRows: ErrorRow[] = [];
    const importResults: ImportResult[] = [];

    // Stream parse CSV
    const parser = csvParse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    const readStream = createReadStream(tempFilePath);
    let rowIndex = 0;

    // Apply column mapping
    const columnMapper = new ColumnMapper();
    let mappedHeaders: Record<string, string> = {};

    parser.on("readable", async function () {
      let record;
      while ((record = parser.read()) !== null) {
        // First row: detect mapping
        if (rowIndex === 0 && !Object.keys(mappedHeaders).length) {
          headers.push(...Object.keys(record));

          if (data.options.column_mapping_json) {
            // Use provided mapping
            mappedHeaders = data.options.column_mapping_json;
          } else {
            // V1: identity mapping to minimize surprises
            mappedHeaders = headers.reduce((acc, h) => {
              acc[h] = h;
              return acc;
            }, {} as Record<string, string>);
          }

          console.log(`[ProductImport] Column mapping:`, mappedHeaders);
        }

        // Apply mapping to record
        const mappedRecord: any = {};
        for (const [sourceCol, targetCol] of Object.entries(mappedHeaders)) {
          if (record[sourceCol] !== undefined) {
            mappedRecord[targetCol] = record[sourceCol];
          }
        }

        rows.push(mappedRecord);
        rowIndex++;
      }
    });

    await pipeline(readStream, parser);

    console.log(`[ProductImport] Parsed ${rows.length} rows`);

    // Initialize validation context
    const validationContext: ValidationContext = {
      existingProductHandles: new Set(),
      existingProductSkus: new Set(),
      existingCollections: new Set(),
      existingCategories: new Set(),
      existingSalesChannels: new Set(["default"]),
      existingMaterials: new Set(),
      configurableCurrencies: new Set(["usd", "eur"]),
      defaultSalesChannels: ["default"],
      inventoryLocations: new Set(["default"]),
    };

    // Load existing data for validation (if not dry-run)
    if (!isDryRun) {
      try {
        const products = await productModule.listProducts({}, { take: 1000 });
        products.forEach((p: any) => {
          if (p.handle) validationContext.existingProductHandles.add(p.handle);
          p.variants?.forEach((v: any) => {
            if (v.sku) validationContext.existingProductSkus.add(v.sku);
          });
        });
      } catch (error) {
        console.warn("[ProductImport] Could not load existing products for validation:", error);
      }
    }

    const validator = new DataIntegrityValidator(validationContext);

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      processedRows++;

      // Update progress periodically
      if (processedRows % 100 === 0) {
        await batchJobService.update(batchJob.id, {
          result: {
            progress: {
              processedRows,
              totalRows: rows.length,
            },
          },
        });
      }

      try {
        // Validate row with Zod schema
        const validation = productRowSchema.safeParse(row);

        if (!validation.success) {
          invalidRows++;
          const errors = validation.error.errors;

          errors.forEach(err => {
            errorRows.push({
              original_row_index: i + 2, // +2 for header and 1-indexed
              field: err.path.join("."),
              error: err.message,
              error_code: err.code,
              suggestion: "Check data format and required fields",
              original_value: row[err.path[0]],
            });
          });

          importResults.push({
            row_index: i + 2,
            status: "failed",
            error: `Validation failed: ${errors[0]?.message}`,
          });

          continue;
        }

        const productRow = validation.data as ProductRow;

        // Run business validation
        const issues = validator.validateRow(productRow, i + 2);
        if (issues.length > 0) {
          validationIssues.set(i + 2, issues);

          const hasError = issues.some(iss => iss.severity === "error" || iss.severity === "critical");
          if (hasError) {
            invalidRows++;

            const criticalIssue = issues.find(iss => iss.severity === "critical" || iss.severity === "error");
            errorRows.push({
              original_row_index: i + 2,
              field: criticalIssue?.field || "general",
              error: criticalIssue?.message || "Validation error",
              error_code: criticalIssue?.ruleId,
              suggestion: criticalIssue?.suggestion,
              original_value: criticalIssue?.field ? row[criticalIssue.field] : null,
            });

            importResults.push({
              row_index: i + 2,
              status: "failed",
              error: criticalIssue?.message,
            });

            continue;
          }
        }

        validRows++;

        // In execute mode, create the product
        if (!isDryRun) {
          try {
            const { product } = rowToProductInput(productRow, {
              variant_strategy: data.options.variant_strategy as any,
              default_sales_channel_handles: ["default"],
            });

            // For V1, use simple product creation
            const created = await createProductsWorkflow(container).run({
              input: {
                products: [product],
              },
            });

            if (created.result?.length > 0) {
              createdCount++;
              const createdProduct = created.result[0];

              importResults.push({
                row_index: i + 2,
                status: "created",
                product_id: createdProduct.id,
                product_handle: createdProduct.handle,
                variant_skus: createdProduct.variants?.map((v: any) => v.sku).filter(Boolean),
                message: "Product created successfully",
              });
            } else {
              throw new Error("Product creation returned no result");
            }
          } catch (error) {
            failedCount++;
            console.error(`[ProductImport] Failed to create product at row ${i + 2}:`, error);

            importResults.push({
              row_index: i + 2,
              status: "failed",
              error: error instanceof Error ? error.message : "Creation failed",
            });
          }
        } else {
          // Dry-run: just record as would-be created
          importResults.push({
            row_index: i + 2,
            status: "skipped",
            message: "Dry-run: would create product",
          });
        }
      } catch (error) {
        invalidRows++;
        console.error(`[ProductImport] Error processing row ${i + 2}:`, error);

        errorRows.push({
          original_row_index: i + 2,
          field: "general",
          error: error instanceof Error ? error.message : "Processing error",
          error_code: "PROCESSING_ERROR",
          original_value: JSON.stringify(row),
        });

        importResults.push({
          row_index: i + 2,
          status: "failed",
          error: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }

    // Generate artifacts
    console.log(`[ProductImport] Generating artifacts...`);

    const validationReportPath = await artifactGenerator.generateValidationReport(
      validationIssues,
      rows.length,
      {
        dry_run: isDryRun,
        upsert_by: data.options.upsert,
        variant_strategy: data.options.variant_strategy || "explicit",
        force_prune: false,
      }
    );

    const errorCsvPath = errorRows.length > 0
      ? await artifactGenerator.generateErrorRowsCsv(errorRows)
      : null;

    const resultCsvPath = await artifactGenerator.generateResultSummaryCsv(importResults);

    // Upload artifacts to File Module for direct URL access
    const artifactUrls: Record<string, string> = {};

    const uploadArtifact = async (filePath: string | null, key: string) => {
      if (!filePath) return;

      const content = await fs.readFile(filePath);
      const filename = path.basename(filePath);

      const uploaded = await fileModule.createFiles([{
        filename: `imports/${jobId}/artifacts/${filename}`,
        mimeType: filename.endsWith(".json") ? "application/json" : "text/csv",
        content: content.toString("base64"),
      }]);

      if (uploaded?.[0]?.url) {
        artifactUrls[key] = uploaded[0].url;
      }
    };

    await uploadArtifact(validationReportPath, "validation_report_url");
    await uploadArtifact(errorCsvPath, "error_rows_url");
    await uploadArtifact(resultCsvPath, "result_summary_url");

    // Calculate final stats
    const duration = Date.now() - startTime;
    const processingRate = processedRows > 0 ? (processedRows / (duration / 1000)) : 0;

    // Update final job result
    await batchJobService.update(batchJob.id, {
      result: {
        progress: {
          processedRows,
          totalRows: rows.length,
        },
        rows_total: rows.length,
        rows_processed: processedRows,
        rows_valid: validRows,
        rows_invalid: invalidRows,
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        duration_ms: duration,
        processing_rate: Math.round(processingRate * 10) / 10,
        artifacts: artifactUrls,
        import_id: data.import_id,
        trace_id: traceId,
      },
    });

    // Record observability metrics
    observability.recordJobDuration(duration);
    observability.recordRowProcessing(validRows, invalidRows, 0);
    observability.recordProcessingRate(processingRate);
    observability.recordJobEvent("completed", jobId);

    // Cleanup temp file
    await fs.unlink(tempFilePath).catch(() => {});

    console.log(`[ProductImport] Completed job ${jobId}:`, {
      total: rows.length,
      valid: validRows,
      invalid: invalidRows,
      created: createdCount,
      failed: failedCount,
      duration: `${duration}ms`,
      rate: `${processingRate.toFixed(1)} rows/sec`,
    });

  } catch (error) {
    console.error(`[ProductImport] Job ${jobId} failed:`, error);

    observability.recordJobEvent("failed", jobId);
    observability.recordError("parsing", 1);

    await batchJobService.setFailed(batchJob.id, error instanceof Error ? error.message : "Unknown error");

    throw error;
  }
}
