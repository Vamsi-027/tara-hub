Admin Import – Usage Guide (V1)

Overview
- Supports CSV and XLSX uploads via a single-step batch job API.
- Two modes: dry-run (validate only) and execute (create/update).
- Optional reuse of a previously uploaded file via source_job_id (common flow: dry-run → execute).

Endpoints
- POST `/admin/products/import/jobs`
  - Multipart form:
    - `file` (CSV/XLSX) OR `source_job_id` (string)
    - `mode` = `dry_run` | `execute`
    - Options:
      - `upsert` = `off` | `handle` | `sku` | `external_id` (default: off)
      - `variant_strategy` = `explicit` | `default_type` (default: explicit)
      - `image_strategy` = `merge` | `replace` (default: merge)
      - `skip_image_validation` = `0|1` (default: 1)
      - `unarchive` = `0|1` (default: 0)
      - `force_prune_missing_variants` = `0|1` (default: 0) — destructive (see below)
      - `column_mapping_json` (JSON string) OR `mapping_profile_id` (string)
  - Headers:
    - `Idempotency-Key` (required)
    - For pruning only: `X-Confirm-Prune: yes` and body `prune_confirm_token="PRUNE_VARIANTS"`

- GET `/admin/products/import/jobs/:job_id`
  - Returns status, progress, summary counts, and artifact URLs.

Typical Flow
1) Dry-run with file upload (validate only)
   - POST `/admin/products/import/jobs` with `mode=dry_run` and `file`.
   - Review `validation_report.json`, `error_rows.csv`, and optional `annotated_xlsx`.
2) Execute using the same file
   - POST `/admin/products/import/jobs` with `mode=execute` and `source_job_id` from step 1.
   - Monitor with GET status. Review `result_rows.csv` on completion.

Safety Defaults
- `upsert=off`, `variant_strategy=explicit`, `skip_image_validation=1`, `unarchive=0`, `force_prune_missing_variants=0`.
- Pruning requires BOTH header `X-Confirm-Prune: yes` and body token `PRUNE_VARIANTS`.

Status & Artifacts (high level)
- Status includes: `job_id`, `status`, `progress`, `stats`, `artifacts`, `trace_id`, and echoes `Idempotency-Key`.
- Validation artifacts:
  - `validation_report.json`: summary + counts + optional prune preview
  - `error_rows.csv`: columns: `original_row_index, field, error, ...original columns`
  - Optional `annotated_xlsx_url`: original sheet with added `errors` column
- Execution artifacts:
  - `result_rows.csv`: columns: `row_index, status(created|updated|skipped|failed), product_id, handle, variant_skus, message`

CSV/XLSX Columns (essentials)
- Identity: `title` (required), `handle?`, `external_id?`, `status?`
- Pricing: `currency_code?` + `retail_price?` OR multi-currency `price_usd?`, `price_eur?`, ...
- Options: `option_1_title?`, `option_2_title?`, ...
- Variants: `sku?`, `option_1_value?`, `option_2_value?`, ...
- Media: `thumbnail_url?`, `image_urls?`
- Taxonomy: `tags?`, `collection_handles?`, `category_handles?`, `sales_channel_handles?`
- Inventory: `manage_inventory?`, `allow_backorder?`, `inventory_quantity?`
- Fabric-configurable: `config_type?`, `category_filter?`, `collection_filter?`, `min_selections?`, `max_selections?`, `set_price?`, `base_price?`
- Metadata: `metadata_json?` or `meta:foo=bar;baz=qux`

Notes
- Use `variant_strategy=default_type` only when you want automatic `Type: Swatch/Fabric` variants.
- Exchange-rate validation is disabled by default; enable via config if desired.
- Inventory writes require `DEFAULT_INVENTORY_LOCATION_ID`; otherwise quantities are skipped with a warning.

