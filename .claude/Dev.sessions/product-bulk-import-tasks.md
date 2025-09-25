# Product Bulk Import – Task Breakdown (Batch Job Architecture)

## Milestones
- M1: Single-step job + CSV validate-only (Phase 1) with artifacts
- M2: Execute mode (Phase 2), upsert, fabric-config integration, pruning gates
- M3: XLSX streaming, Admin UI progress/artifacts, column mapping
- M4: Performance tuning, retry-failed-only, templates/docs polish

## Track A – Medusa Backend (Admin API & Batch Jobs)
1) Register product-import batch job [M1]
- Define batch job type `product-import`; implement handlers for `validate` and `execute` phases.
- Persist file to file service; save `file_url` in job context.

2) Routes & auth [M1]
- `POST /admin/products/import/jobs` (single-step create+run)
  - Multipart: `file` or `source_job_id`; options: `mode`, `upsert`, `variant_strategy`, `image_strategy`, `skip_image_validation`, `unarchive`, `force_prune_missing_variants`, `column_mapping_json|mapping_profile_id`
  - Destructive gating: header `X-Confirm-Prune: yes` + body `prune_confirm_token="PRUNE_VARIANTS"` required when pruning
- `GET /admin/products/import/jobs/:job_id` (status, stats, artifacts)
- Enforce admin scope; size/type checks; allow `Content-Encoding: gzip`.

3) CSV parsing + normalization [M1]
- `csv-parse` streaming (`columns:true`, `trim:true`, `skip_empty_lines:true`, BOM-aware, UTF‑8 only).
- Normalize rows; support comma-separated `image_urls` and semicolon-separated `sales_channel_handles`.
- Column mapping: honor provided `column_mapping_json` or `mapping_profile_id`; fall back to header synonyms.

4) Zod validation & conflict detection [M1]
- Schemas for product core, options/variants, prices (decimal→cents), taxonomy, channels, inventory flags.
- Validate against configured currencies and allowed `status` values.
- Detect intra-file duplicates (handle/SKU) and DB conflicts; produce error CSV artifact.

5) Artifacts & job context [M1]
- Generate `validation_report.json`, `error_rows.csv` (with `original_row_index` and `field`), and optional `annotated_xlsx.xlsx`.
- Include `prune_preview` in validation when pruning requested.
- Stash staged rows snapshot (compressed JSONL) for execution.

6) Execution workflow (batched) [M2]
- Map staged rows to `createProductsWorkflow` inputs; batch 50–100; wrap in transaction per batch.
- Upsert modes: `off|handle|sku|external_id`; images `merge|replace`; `force_prune_missing_variants` (gated) and `unarchive` flags.
- Dedupe images by normalized URL; merge metadata; update taxonomy/associations.

7) Fabric-configurable integration [M2]
- Invoke `fabricProductModuleService` for `config_type` rows; add compensations on failure.
- Store per-row results and `result_rows.csv` artifact with created/updated/skipped/failed.

8) XLSX streaming [M3]
- Add `exceljs` streaming parsing; reuse validation/mapping pipeline. Document CSV as preferred for very large files.

9) Observability, idempotency, limits [M3]
- Structured logs with `trace_id`, `import_id`; metrics per batch.
- Require `Idempotency-Key` on run; one concurrent import per admin.
- Configurable file size/row caps; cleanup temp files.

## Track B – Admin UI (Next.js)
10) Job flow wiring [M3]
- Upload to `POST /admin/products/import/jobs` with `mode=dry_run` → receive `job_id` and artifacts.
- “Run import” creates a new job with `mode=execute` + `source_job_id` to reuse the file; no second upload.

11) Execute & progress [M3]
- Execute via new job creation (`mode=execute`, `source_job_id`). Poll status; show counts, ETA, and artifact links.
- Add “Retry failed only” action (new job with filter of failed rows, or server-side option if supported).
- When pruning is requested, require double confirmation UI (checkbox + typed token) and show `prune_preview` diff.

12) Column mapping UI [M3]
- Allow remapping headers to expected fields; persist mapping per user; support exporting/importing mapping profiles.

## Track C – Validation & Mapping Utilities
13) Zod schemas [M1]
- `productRowSchema` with coercion and enums; multi-currency validation; options/variants linking.

14) Mappers [M1]
- `rowToProductInput(row, defaults)`; `ensureHandle(title, provided?)`; `collectImages(thumbnail_url?, image_urls?)`.
- Helpers to resolve channels, collections, categories, tags by handle/name.

15) Upsert helpers [M2]
- `findProductByHandle|ExternalId|VariantSku`; variant merge/update by SKU; image strategy rules; prune missing variants.

## Track D – Configurable Fabric Product Glue
16) Service calls [M2]
- After product create/update, call fabric config service by `config_type`; store config IDs for compensation.

## Track E – Testing
17) Unit tests [M1]
- Parser: CSV edge cases, BOM handling; boolean/decimal coercion; multi-currency gates.
- Validation: requireds, enums, duplicates, ambiguous variant detection, URL syntax.

18) Integration tests [M2]
- End-to-end: validate then execute 10-row CSV; assert products/variants/prices created.
- Upsert by handle/external_id/SKU; no duplicate variants; image strategy behaviors; prune flag guarded.
- Fabric-config compensations on induced failure.

19) XLSX tests [M3]
- Mirror CSV cases on .xlsx (exceljs streaming); verify identical outcomes.

20) Performance tests [M4]
- 10k–25k rows streaming; batch sizes vs DB pool; memory usage and duration within targets.

## Track F – Documentation & Templates
21) CSV templates [M1]
- Provide two templates: simple products and multi-variant; include configurable-fabric examples.
- Document columns, defaults, mapping rules, synonyms, and limits.
- Make default-type variants opt-in; clearly explain `variant_strategy` behaviors and tradeoffs.

22) Admin docs [M3]
- Explain job flow, artifacts, upsert modes, image strategies, retry failed-only, and XLSX scale guidance.

## Dependencies & Config
- Dependencies: `csv-parse`, `exceljs`, `zod`.
- Config defaults: default sales channel ID(s), batch size, default inventory location, allowed currencies, limits.
- Safety: disable `force_prune_missing_variants` by default through env/config; require confirmations to enable per-request.

## Acceptance Checklist
- [ ] Validation-only job produces accurate summary and `error_rows.csv` without writes
- [ ] Execute mode creates/updates products with correct variants/prices/images
- [ ] Upsert by handle, external_id, and SKU works idempotently
- [ ] Configurable product rows create fabric config records transactionally
- [ ] XLSX import yields identical results to CSV for moderate sizes
- [ ] Admin UI shows progress, artifacts, and supports retrying failed-only rows
