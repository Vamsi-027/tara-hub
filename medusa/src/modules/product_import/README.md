Product Import Module – Schemas and API Types

Overview
- Defines Zod schemas for CSV/XLSX rows and options used by the batch product import job.
- Provides mapping utilities to convert validated rows into product create/upsert inputs.
- Declares API request/response typings for job creation, status, and execution endpoints.

Notes
- This module is schema- and type-only; it does not register routes or jobs.
- Add dependencies when wiring runtime code:
  - zod
  - csv-parse (CSV streaming)
  - xlsx (optional XLSX parsing)

Key Files
- `schemas.ts` – Zod schemas and helpers for validation/coercion.
- `mapping.ts` – `rowToProductInput` mapper and support utilities.
- `api-types.ts` – Admin API request/response typings and enums.

