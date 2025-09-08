# Materials Module

Simple one-to-one mirror of the admin materials table.

## What It Does

Direct copy of materials data from admin database to Medusa database.

## Database Structure

```sql
CREATE TABLE materials (
  id VARCHAR(255) PRIMARY KEY,  -- Same ID from admin
  name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Sync Process

```bash
# Run sync to copy materials from admin to Medusa
cd medusa
npm run sync:materials
```

This does a simple UPSERT:
- INSERT if ID doesn't exist
- UPDATE if ID exists

## Files

```
materials/
├── index.ts         (14 lines)  - Module export
├── models.ts        (16 lines)  - Simple model
├── service.ts       (15 lines)  - Basic service
└── migrations/
    └── create-materials-schema.sql
```

**Total: ~50 lines**

## That's It

No parsing, no validation, no complex logic. Just a simple one-to-one data mirror.