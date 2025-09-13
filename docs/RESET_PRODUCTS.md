# Resetting Medusa Product Data

This document explains how to safely clear all product data from the Medusa database.

## Overview

The `clear-medusa-products.js` script provides a safe way to remove all product-related data from your Medusa database while preserving system data like regions, currencies, and tax rates.

## Prerequisites

- Node.js installed
- Access to the Medusa database (via `DATABASE_URL` env variable)
- `.env.local` file configured with database credentials

## Usage

### Available Commands

```bash
# Interactive mode - will prompt for confirmation
npm run clear:products

# Dry run - preview what would be deleted without making changes
npm run clear:products:dry

# Force mode - skip confirmation (useful for CI/CD)
npm run clear:products:force

# With export - save deleted IDs for rollback reference
npm run clear:products -- --export

# Verbose mode - show detailed debug information
npm run clear:products -- --verbose
```

### Command Options

- `--dry-run`: Preview deletion without making changes
- `--force`: Skip confirmation prompt
- `--export`: Export deleted IDs to JSON file
- `--verbose` or `-v`: Show detailed debug information

## What Gets Deleted

The script removes data from the following tables in order:

1. **Inventory Tables**
   - `inventory_level`
   - `inventory_item`

2. **Pricing Tables**
   - `price_rule`
   - `price`
   - `price_list`

3. **Product Variant Tables**
   - `product_option_value`
   - `product_variant`
   - `product_option`

4. **Product Association Tables**
   - `product_to_tag` (junction table)
   - `product_tag`
   - `product_type`
   - `product_collection`
   - `product_to_category` (junction table)
   - `product_category`

5. **Main Product Table**
   - `product`

## Safety Features

### Transaction Support
All deletions are wrapped in a database transaction. If any error occurs, all changes are rolled back.

### Confirmation Prompt
By default, the script asks for confirmation before deleting data:
```
⚠️  This will permanently delete all product data. Are you sure? (yes/no):
```

### Export Backup
Use the `--export` flag to save all deleted IDs:
```bash
npm run clear:products -- --export
```

This creates a backup file like `product-backup-2024-01-15T10-30-00-000Z.json` containing:
- Timestamp of deletion
- Statistics (tables cleared, records deleted)
- All deleted IDs organized by table

### Dry Run Mode
Always test with dry run first:
```bash
npm run clear:products:dry
```

Output example:
```
Analyzing product data...
  • inventory_level: 70 records
  • inventory_item: 60 records
  • price: 118 records
  • product_variant: 60 records
  • product: 26 records

Total records to be deleted: 438

🔍 DRY RUN MODE - No data will be deleted
```

## Error Handling

The script handles various error scenarios:

1. **Missing DATABASE_URL**: Will exit with clear error message
2. **Connection failures**: Automatic rollback
3. **Foreign key violations**: Tries TRUNCATE CASCADE first, falls back to DELETE
4. **Missing tables**: Skips gracefully

## CI/CD Integration

For automated workflows, use force mode:

```yaml
# GitHub Actions example
- name: Reset Medusa products
  run: npm run clear:products:force
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Recovery

If you need to reference deleted data:

1. Look for the backup file created with `--export`
2. The file contains all deleted IDs organized by table
3. Use these IDs to restore data from backups if needed

## Troubleshooting

### Error: DATABASE_URL environment variable is not set
**Solution**: Ensure `.env.local` exists with:
```env
DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require
```

### Error: permission denied for table
**Solution**: Ensure database user has TRUNCATE or DELETE permissions

### Error: violates foreign key constraint
**Solution**: The script handles this automatically by using proper deletion order

## Best Practices

1. **Always dry run first**: `npm run clear:products:dry`
2. **Export before deletion**: `npm run clear:products -- --export`
3. **Verify backup**: Check the export file was created
4. **Test in staging**: Run on staging environment before production
5. **Document reason**: Keep a log of why products were cleared

## Related Commands

- `npm run sync:materials`: Sync fabrics to materials table
- `npm run db:seed`: Seed sample data
- `npm run dev:medusa`: Start Medusa backend

## Support

For issues or questions:
- Check the script output for detailed error messages
- Use `--verbose` flag for debug information
- Review Medusa logs at `.medusa/server/logs/`