/*
  API typings for Product Import batch job endpoints
*/

export type UpsertMode = "off" | "handle" | "sku" | "external_id";
export type ImageStrategy = "merge" | "replace";

export interface CreateImportJobOptions {
  mode?: "dry_run" | "execute";
  upsert?: UpsertMode;
  image_strategy?: ImageStrategy;
  prune_missing_variants?: 0 | 1;
  skip_image_validation?: 0 | 1;
  unarchive?: 0 | 1;
}

export interface CreateImportJobRequest extends CreateImportJobOptions {
  // Multipart form:
  // - file: File
}

export interface CreateImportJobResponse {
  job_id: string;
}

export type ImportJobStatus =
  | "created"
  | "validating"
  | "validated"
  | "failed_validation"
  | "processing"
  | "completed"
  | "failed";

export interface ImportJobStats {
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  duration_ms?: number;
}

export interface ImportJobArtifacts {
  validation_report_url?: string; // JSON summary
  error_rows_url?: string; // CSV of invalid rows with error column
  result_rows_url?: string; // CSV of per-row outcomes
}

export interface GetImportJobStatusResponse {
  job_id: string;
  status: ImportJobStatus;
  progress?: number; // 0..100
  stats?: ImportJobStats;
  artifacts?: ImportJobArtifacts;
  context?: Record<string, any>; // includes file_url, options snapshot, import_id
}

export interface RunImportJobResponse extends GetImportJobStatusResponse {}

export type RowOutcomeStatus = "created" | "updated" | "skipped" | "failed";

export interface RowOutcomeEntry {
  row_index: number; // 1-based CSV row index including header offset
  status: RowOutcomeStatus;
  product_id?: string;
  handle?: string;
  variant_skus?: string[];
  message?: string;
}

