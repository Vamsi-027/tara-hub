Product Import – Lean Test Plan (V1)

Goals
- Validate parser/mapping correctness and memory-safe streaming for CSV/XLSX.
- Confirm API contracts for job creation/status and artifact shapes.
- Verify safety gates (idempotency, pruning confirmations) and key behaviors (upsert, variant strategy).

Test Matrix
1) CSV Parsing & Mapping (Vitest)
- Case: BOM + odd spacing headers → mapping profile remaps to canonical fields before Zod.
- Case: Mixed booleans/decimals → correct coercion; invalid types flagged with row index and field.
- Case: Multi-currency price fields → cents conversion; currency set validation; exchange-rate check disabled.
- Case: Variant strategy explicit → rows missing variant data error; default_type → creates Swatch/Fabric mapping shape.
- Case: Duplicate detection → in-file duplicates (handle/SKU) identified with clear messages.

2) XLSX Streaming (Vitest)
- Case: 10k-row XLSX → stream in bounded memory; ensure all rows processed (no async eachRow bug).
- Case: Column mapping applies before validation; annotated_xlsx optional generation behind size guard.

3) Security Validation (Vitest)
- Case: Cells starting with =,+,-,@ → sanitized + flagged CSV injection warning; value trimmed in parsed object.
- Case: Oversized file → rejected with clear error; scan time limit respected.

4) API Contract (Jest or integration)
- POST /admin/products/import/jobs (dry_run)
  - With file upload and Idempotency-Key → returns job_id.
  - Status eventually exposes validation artifacts; includes idempotency_key and trace_id.
- POST /admin/products/import/jobs (execute via source_job_id)
  - With upsert=handle → repeat import does not create duplicate variants.
  - With image_strategy=replace → images set equals provided; with merge → union of old+new (deduped).
- Pruning safety
  - force_prune_missing_variants=1 without header/token → 400/denied.
  - With header+token → allowed; dry-run includes prune_preview; execute removes exactly those variants.
- Idempotency
  - Re-sending same request with same Idempotency-Key does not double-apply.

5) Result Artifacts (Integration)
- validation_report.json has counts, duplicates, errors with {row, field, error}; includes prune_preview when requested.
- error_rows.csv columns: original_row_index, field, error, …original columns.
- result_rows.csv columns: row_index, status, product_id, handle, variant_skus, message.

6) Performance (Light)
- CSV 10k rows in batches (e.g., 100) completes under memory threshold; adaptive batch size responds to pressure.

Test Data & Templates
- Use templates in templates/ (simple.csv, multi-variant.csv, configurable-fabric.csv) and convert to XLSX for streaming tests.

Out of Scope (V1)
- Background webhooks/notifications; advanced inventory/location splits; full search reindex assertions.

