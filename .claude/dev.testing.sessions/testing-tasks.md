Product Import – Detailed Testing Tasks (V1)

Scope
- End-to-end validation of the batch product import (CSV/XLSX) across dry-run and execute modes.
- Confirms API contract, artifacts, safety gates, mapping, upsert, variant strategy, pruning, and core performance.
- No runtime code changes in this file; executes iteratively per milestone.

Conventions
- [ ] indicates a task to perform; mark when complete.
- Record evidence (artifact URLs, logs, screenshots) in the test session notes.

1) Environment & Fixtures
- [ ] Configure env: DEFAULT_INVENTORY_LOCATION_ID (if inventory enabled), default sales channel(s), allowed currencies.
- [ ] Seed minimal references: at least one sales channel, 1–2 collections, 1–2 categories.
- [ ] Prepare credentials with Admin scope for API calls.
- [ ] Place sample files from templates/: simple.csv, multi-variant.csv, configurable-fabric.csv.
- [ ] Generate large synthetic datasets: 10k CSV, 10k XLSX (same schema as multi-variant.csv).

2) API Contract – Create Job (Dry-Run)
- [ ] POST /admin/products/import/jobs with file=simple.csv, mode=dry_run, Idempotency-Key set.
- Acceptance:
  - [ ] 200 with { job_id }.
  - [ ] GET status returns: status=validating→validated; echoes idempotency_key; includes trace_id.
  - [ ] artifacts.validation_report_url and artifacts.error_rows_url present; annotated_xlsx_url null.

3) API Contract – Create Job (Execute via source_job_id)
- [ ] POST /admin/products/import/jobs with mode=execute, source_job_id=<from dry-run>, upsert=off.
- Acceptance:
  - [ ] Status transitions to processing→completed.
  - [ ] artifacts.result_rows_url present; validation artifacts remain accessible.
  - [ ] result_rows.csv has columns: row_index,status,product_id,handle,variant_skus,message.

4) Column Mapping Before Validation
- [ ] CSV: rename headers (e.g., Name, product_handle, price_usd) and provide column_mapping_json.
- [ ] CSV: supply a mapping_profile_id (pre-created) and no explicit mapping JSON.
- Acceptance:
  - [ ] Zod validation uses mapped fields; errors list canonical field names.
  - [ ] When profile is used, detection does not fall back to heuristics.

5) XLSX Streaming & Deterministic Iteration
- [ ] Upload multi-variant.xlsx (converted) mode=dry_run.
- Acceptance:
  - [ ] All rows processed; no partial completion (guards against async eachRow issues).
  - [ ] Peak memory steady within threshold (< X MB depending on env); status.metrics.memory_usage_mb populated.

6) Security Validation
- [ ] CSV with cells starting with =,+,-,@ in several columns.
- [ ] Oversized file beyond configured limit.
- Acceptance:
  - [ ] Injection cells sanitized and reported as warnings/errors in error_rows.csv with original_row_index and field.
  - [ ] Oversized file rejected with clear error; no server instability.

7) Duplicate Detection & Conflicts
- [ ] CSV with duplicate handle and duplicate SKU within the same file.
- [ ] Dry-run only.
- Acceptance:
  - [ ] validation_report.json.duplicates lists handles and skus; errors list exact row/field.

8) Variant Strategy
- [ ] explicit (default): rows missing variant data should error.
- [ ] default_type: same rows succeed and generate `Type: Swatch/Fabric` variants.
- Acceptance:
  - [ ] explicit → error_rows.csv shows missing variant fields as errors.
  - [ ] default_type → result shows created variants with expected SKUs.

9) Upsert Modes
- [ ] Execute import to create baseline products.
- [ ] Re-run with upsert=handle and modified description/images.
- [ ] Re-run with upsert=sku and modified variant prices.
- [ ] Optional: upsert=external_id with external_id present.
- Acceptance:
  - [ ] No duplicate variants created.
  - [ ] Images updated per image_strategy (merge vs replace) with dedupe.
  - [ ] Field update policy (description, status, metadata) applied as specified.

10) Pruning Safety (Destructive Gate)
- [ ] Try force_prune_missing_variants=1 without header/token → expect denial.
- [ ] Try with header X-Confirm-Prune: yes and body prune_confirm_token="PRUNE_VARIANTS" → allowed.
- [ ] Dry-run first; verify prune_preview lists variants to be removed.
- [ ] Execute; verify removed set matches preview exactly.

11) Image Strategy
- [ ] Baseline product with images [A,B].
- [ ] Re-import with images [B,C].
- Acceptance:
  - [ ] merge → final [A,B,C] (order preserved where possible); replace → final [B,C].
  - [ ] Dedupe by normalized URL; no duplicates.

12) Inventory Behavior
- [ ] Provide manage_inventory=true and inventory_quantity on variants.
- Acceptance:
  - [ ] If DEFAULT_INVENTORY_LOCATION_ID set: stock written to default location.
  - [ ] If not set: quantities skipped with warning recorded in artifacts.

13) Taxonomy & Associations
- [ ] collections/categories by handle; sales_channel_handles with `;` separated.
- Acceptance:
  - [ ] Valid handles resolve; invalid reported as warnings in validation.
  - [ ] Products associated with provided tags/collections/categories/channels.

14) Multi-Currency & Currency Gates
- [ ] Provide price_usd and price_eur; set allowed currencies accordingly.
- [ ] Provide an invalid currency code in one row.
- Acceptance:
  - [ ] Valid prices converted to cents; invalid currency flagged; exchange-rate check disabled by default.

15) Error Artifacts Shape
- [ ] Inspect error_rows.csv.
- Acceptance:
  - [ ] Columns: original_row_index, field, error, …original columns mirrored; values aligned to original input.

16) Result Artifacts Shape
- [ ] Inspect result_rows.csv after execute.
- Acceptance:
  - [ ] Columns: row_index, status, product_id, handle, variant_skus (semicolon-separated), message.

17) Idempotency
- [ ] Repeat the same POST with identical payload and Idempotency-Key.
- Acceptance:
  - [ ] No duplicate side effects; job status correlates to existing run; products unchanged.

18) Status & Metrics
- [ ] Poll status during dry-run and execute.
- Acceptance:
  - [ ] Fields present: status, progress, phase, metrics.processing_rate, metrics.estimated_time_remaining, stats (rows_total, processedRows, validRows, invalidRows, created, updated, skipped, failed), artifacts URLs, trace_id, idempotency_key.

19) Backpressure & Adaptive Batching (Light)
- [ ] Use large CSV (~10k rows) and observe batch size adjustments.
- Acceptance:
  - [ ] Batch size downshifts under pressure and recovers; no OOM; steady progress.

20) Recovery – Simulated Failures (Light)
- [ ] Inject intermittent DB/network errors (e.g., via feature flag/mock).
- Acceptance:
  - [ ] Rows retried with backoff; checkpoint created; DLQ populated for permanent failures; artifacts reference checkpoint/DLQ URLs.

21) Retention & Cleanup
- [ ] Confirm artifact retention policy (TTL) and job context references.
- Acceptance:
  - [ ] Artifacts accessible during TTL; older artifacts pruned by scheduled job.

22) Admin UX (If applicable in this iteration)
- [ ] Dry-run upload, preview artifacts; execute via source_job_id without re-upload.
- [ ] Pruning confirm UI requires checkbox + token entry; shows prune_preview diff before enabling run.
- Acceptance:
  - [ ] Clear progress, counts, ETA, artifact links; retry failed-only action (if implemented) uses DLQ/checkpoints.

23) Documentation Cross-Check
- [ ] Validate admin-import-usage.md and import-status-and-artifacts.md reflect actual behavior.
- Acceptance:
  - [ ] No discrepancies; update docs where mismatches found.

24) Regression Guard (Spot)
- [ ] Re-run simple.csv dry-run and execute after all changes.
- Acceptance:
  - [ ] Behavior unchanged and stable; artifacts consistent.

