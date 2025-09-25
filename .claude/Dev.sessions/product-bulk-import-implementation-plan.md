# Product Bulk Import – Implementation Plan (Batch Job Architecture)

## 1) Objectives
- Provide Excel/CSV-based bulk import for real Medusa products (not the custom `fabrics` table) using Medusa’s Batch Job pattern.
- Support both simple and fabric-configurable products with robust, two-phase validation and transactional execution.
- Deliver resilient, asynchronous processing with progress, artifacts (error/result files), idempotency, and per-row reporting.

## 2) Scope
- In-scope
  - Admin batch job to accept CSV/XLSX, validate, and execute product creation/upsert via workflows.
  - Mapping from spreadsheet fields to products, options/variants, multi-currency prices, media, metadata, taxonomy, and sales channels.
  - Optional creation of fabric-configurable settings (`configurable_fabric`, `configurable_swatch_set`).
  - Upsert semantics (by handle, external_id, or SKU) and dry-run validation phase.
  - Batch execution with compensations and detailed artifacts.
- Out of scope
  - Import into `fabrics` custom table.
  - Uploading binary assets; only URL-based images supported.
  - Advanced inventory operations beyond basic quantity updates to default location.

## 3) High-Level Design
- Single-step creation: UI calls one endpoint that both creates and runs the job in `mode` (`dry_run` or `execute`).
- Phase 1 (validate): stream-parse rows, normalize/validate, detect conflicts, and produce artifacts (summary + error CSV/annotated XLSX). No writes.
- Phase 2 (execute): batched workflow upserts products/variants; fabric-config when flagged; emits per-row outcomes and results artifact.
- Optional two-step UX: If a second confirmation is desired (e.g., for destructive operations), first run `dry_run`, then create a new `execute` job referencing the first via `source_job_id` to reuse the uploaded file.
- Status endpoint provides progress and artifact links. Idempotency through `Idempotency-Key` and an `import_id` stored in product metadata.

## 4) Data Mapping
- Product core
  - Required: `title`, `status` (`published|draft`), at least one price, and pricing `currency_code` (or multi-currency fields).
  - Optional: `handle`, `description`, `thumbnail_url`, `image_urls` (comma-separated), `metadata` (JSON or key/value), `sales_channel_handles`.
- Options and variants
  - Product options: `option_1_title`, `option_2_title`, ...
  - Variant identity: `sku` (strongly recommended), `option_1_value`, `option_2_value`, ...
  - Default variants are opt-in via `variant_strategy=default_type` (or per-row `variant_strategy`); otherwise `variant_strategy=explicit` (default) requires explicit variant data.
- Pricing
  - Single currency: `retail_price` (decimal) + `currency_code`.
  - Multi-currency: `price_usd`, `price_eur`, ... validated against configured currencies; decimals converted to cents.
  - Optional `swatch_price` aligned to the same currency mapping.
- Taxonomy & associations
  - `tags` (comma-separated), `collection_handles`, `category_handles`, `sales_channel_handles` (semicolon-separated for multi).
- Inventory & flags
  - `manage_inventory`, `allow_backorder`, `inventory_quantity` (default location), `is_discountable`, `is_giftcard`.
  - Dimensions/weight: `weight`, `length`, `width`, `height` with store default units.
- Fabric-configurable
  - `config_type` in (`configurable_fabric`, `configurable_swatch_set`).
  - Fields: `category_filter`, `collection_filter`, `min_selections`, `max_selections`, `set_price`, `base_price`.
- Identity precedence
  - `handle` > `external_id` > `base_sku` for product matching; variants matched primarily by `sku`.

### 4.1 Example CSV Columns
- Identity: `title`, `handle?`, `external_id?`, `status` (published|draft)
- Pricing: `retail_price?`, `currency_code?`, or `price_usd?`, `price_eur?`, ...; `swatch_price?`
- Options: `option_1_title?`, `option_2_title?`, ...
- Variants: `sku?`, `option_1_value?`, `option_2_value?`, ..., `variant_price_usd?`/`variant_price?`
- Media: `thumbnail_url?`, `image_urls?`
- Taxonomy: `tags?`, `collection_handles?`, `category_handles?`
- Channels: `sales_channel_handles?`
- Inventory & flags: `manage_inventory?`, `allow_backorder?`, `inventory_quantity?`, `is_discountable?`, `is_giftcard?`, `weight?`, `length?`, `width?`, `height?`
- Fabric-configurable: `config_type?`, `category_filter?`, `collection_filter?`, `min_selections?`, `max_selections?`, `set_price?`, `base_price?`
- Metadata: `metadata_json?` or `meta:foo=bar;baz=qux`

## 5) API Design (Batch Jobs)
- `POST /admin/products/import/jobs`
  - Single-step creation + run.
  - Multipart with `file` (or `source_job_id` to reuse a previous file) and options:
    - `mode=dry_run|execute`
    - `upsert=off|handle|sku|external_id`
    - `variant_strategy=explicit|default_type` (default `explicit`)
    - `image_strategy=merge|replace` (default `merge`)
    - `skip_image_validation=0|1` (default `1`)
    - `unarchive=0|1` (default `0`)
    - `force_prune_missing_variants=0|1` (default `0`) — destructive, gated
    - `column_mapping_json?` (JSON string) or `mapping_profile_id?` to remap headers/synonyms
  - Destructive gating for pruning (only honored when present):
    - Header `X-Confirm-Prune: yes` AND body `prune_confirm_token="PRUNE_VARIANTS"` must be provided.
    - Strongly recommended workflow: perform `dry_run` first and then submit `execute` with `source_job_id` and confirmations.
  - Headers: `Idempotency-Key` required.
  - Response: `{ job_id }`.
- `GET /admin/products/import/jobs/:job_id`
  - Returns status, progress, stats, and artifact URLs: `{ status, progress, stats, artifacts: { validation_report_url, error_rows_url, result_rows_url, annotated_xlsx_url } }`.

## 6) Parsing & Validation
- Parsing
  - CSV: `csv-parse` streaming with `columns:true`, `trim:true`, `skip_empty_lines:true`, UTF‑8 + BOM handling.
  - XLSX: use `exceljs` streaming reader to avoid loading entire sheets; for very large imports, CSV remains the most scalable.
  - Normalize to a common row shape.
- Validation (Zod)
  - Coerce decimals to integer cents; normalize booleans; enforce allowed `status` and configured currencies.
  - Validate product options and variant option references; require `sku` for reliable upsert or ensure unique option combos.
  - Resolve and validate channels, collections, categories, tags by handle/name.
  - Image URL syntax validation; optional HEAD checks when `skip_image_validation=0` (rate-limited).
  - Detect duplicates within file (by handle/SKU) and conflicts with DB; produce an error CSV and a `prune_preview` when pruning is requested.

## 7) Execution Workflow (Batched, Transactional)
- Build batched inputs (50–100) for `createProductsWorkflow` and companion steps; wrap each batch in a transaction.
- Upsert semantics
  - Product match by `handle|external_id|base_sku` per selected mode; variants match by `sku`, otherwise by full option combo.
  - Field updates: description, status, metadata (merge), tags/collections/categories, images per `image_strategy` with URL dedupe.
  - Optional `force_prune_missing_variants=1` removes variants not present in this import; disabled by default and gated by explicit confirmations.
  - Optional `unarchive=1` revives archived products before update.
- Pricing & inventory
  - Apply multi/single-currency prices; validate against available currencies.
  - If inventory module is enabled and `inventory_quantity` provided, upsert default location stock; otherwise leave untouched.
- Fabric-configurable
  - On rows with `config_type`, call `fabricProductModuleService` to create config. Add compensations to delete config on product rollback.
- Post-processing
  - Optional search reindex for changed product IDs.

## 8) Artifacts, Reporting, and Idempotency
- Per-row result with `status=created|updated|skipped|failed`, `product_id`, `handle`, `variant_skus`, `message`.
- Error CSV contains `original_row_index`, optional `field`, and `error` for quick fixes in the original file.
- Optional `annotated_xlsx_url`: an XLSX copy of the input with an `errors` column and conditional formatting (when input was XLSX or mapping produced one).
- When pruning is requested, include `prune_preview` listing affected products/variants in validation artifacts.
- Store artifacts in file service and expose URLs in job status: `validation_report_url`, `error_rows_url`, `result_rows_url`, `annotated_xlsx_url`.
- Assign `import_id` to product `metadata.import.session_id` and include in logs. Require `Idempotency-Key` for safe retries.

## 9) Performance & Scalability
- Stream parsing; memory-bounded staging (JSONL + compression).
- Batch sizes tunable (50/100/250) considering DB pool size; one running import per admin user.
- Support `Content-Encoding: gzip` and file size up to 20MB for CSV (configurable). Row cap configurable (e.g., 25k).

## 10) Security & Limits
- Admin authentication and scope required; rate-limit and throttle per-user imports.
- Server-side file type/size checks; sanitize text fields; limit metadata size.
- Clean up temp files promptly; never process on edge runtimes.

## 11) Observability
- Structured logs with `trace_id`, `import_id`, batch index, timings, counts.
- Metrics: `rows_total`, `rows_valid`, `rows_invalid`, `created`, `updated`, `skipped`, `failed`, duration.

## 12) Dev Setup & Config
- Dependencies: `csv-parse`, `exceljs` (streaming XLSX), `zod`.
- Config: default sales channel ID(s), batch size, default inventory location, allowed currencies, default `image_strategy`, limits.

## 13) Rollout Plan
1. Implement batch job creation and validation mode (Phase 1) with CSV and artifacts.
2. Implement execution mode (Phase 2) using batched workflows with upsert and image strategies.
3. Wire fabric-configurable product support with compensations.
4. Add XLSX support and document scale guidance.
5. Update Admin UI for job flow: upload, preview, run, progress, artifacts.
6. Add comprehensive tests and provide CSV templates.

## 14) Risks & Mitigations
- Timeouts/large files → batch jobs with streaming and artifacts.
- Duplicate SKU/handle → strict validation + upsert modes + error CSV.
- Partial failures → per-row results with compensations; continue batches.
- Server crashes → idempotent jobs, resume/retry with `retry_failed=1`.

## 15) Acceptance Criteria
- Creating a job with a 100-row CSV completes with accurate `created/updated` counts and exposes result artifacts.
- Validation-only jobs produce error CSV without writes.
- Upsert by handle, external_id, and SKU works without duplicating variants.
- Configurable product rows create corresponding fabric config records transactionally.
- Admin UI shows progress, allows retry of failed-only rows, and links to artifacts.
