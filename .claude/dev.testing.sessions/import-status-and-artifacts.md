Import Job Status & Artifact Contracts

POST /admin/products/import/jobs (single-step create+run)
- Request
  - Multipart form with `file` (CSV/XLSX) OR `source_job_id`
  - Fields: `mode`, `upsert`, `variant_strategy`, `image_strategy`, `skip_image_validation`, `unarchive`, `force_prune_missing_variants`, `column_mapping_json|mapping_profile_id`
  - Headers: `Idempotency-Key` (required); pruning also needs `X-Confirm-Prune: yes` + token in body
- Response
  - `{ job_id: string }`

GET /admin/products/import/jobs/:job_id (status)
- Response (example)
{
  "job_id": "job_abc123",
  "status": "validating",            // created|validating|validated|processing|completed|failed|failed_validation
  "progress": 42,                    // 0..100
  "trace_id": "trace_xxx",
  "idempotency_key": "idem_yyy",
  "phase": "parsing",               // parsing|validating|buffering|processing|completed|failed
  "metrics": {
    "processing_rate": 350.5,        // rows/sec
    "estimated_time_remaining": 120000,
    "memory_usage_mb": 210.3
  },
  "stats": {
    "rows_total": 10000,
    "processedRows": 4200,
    "validRows": 3800,
    "invalidRows": 400,
    "created": 0,
    "updated": 0,
    "skipped": 0,
    "failed": 0
  },
  "artifacts": {
    "validation_report_url": "https://files/.../validation_report.json",
    "error_rows_url": "https://files/.../error_rows.csv",
    "result_rows_url": null,
    "annotated_xlsx_url": null
  },
  "context": {
    "file_url": "s3://bucket/path/file.xlsx",
    "import_id": "imp_zzz",
    "options": {
      "mode": "dry_run",
      "upsert": "off",
      "variant_strategy": "explicit",
      "image_strategy": "merge",
      "skip_image_validation": 1,
      "unarchive": 0,
      "force_prune_missing_variants": 0
    },
    "prune_preview": {
      "products": [
        { "handle": "fabric-a", "variants_to_remove": ["A-YARD", "A-SWATCH"] }
      ]
    }
  }
}

Artifacts
- validation_report.json (example)
{
  "rows_total": 250,
  "valid_rows": 230,
  "invalid_rows": 20,
  "duplicates": { "handles": ["dup-handle"], "skus": ["SKU-1"] },
  "warnings": ["Row 9 missing image_urls"],
  "errors": [
    { "row": 12, "field": "currency_code", "error": "Invalid currency" }
  ],
  "prune_preview": {
    "products": [
      { "handle": "chair-1", "variants_to_remove": ["CHAIR-RED-L"] }
    ]
  }
}

- error_rows.csv (columns)
  - original_row_index, field, error, ...original columns mirrored

- result_rows.csv (columns)
  - row_index, status(created|updated|skipped|failed), product_id, handle, variant_skus (semicolon-separated), message

Notes
- Annotated XLSX is optional and only generated for suitable input sizes.
- All URLs are signed/time-limited where applicable.
- Status payload echoes `Idempotency-Key` and includes a `trace_id` for log correlation.

