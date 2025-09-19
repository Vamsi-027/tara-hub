# Database Backup and Restore Scripts

## Overview
These scripts provide safe database backup and restore functionality for the Medusa backend, essential for the checkout removal refactor.

## Prerequisites
- PostgreSQL client tools (`pg_dump`, `psql`)
- `gzip` for compression
- Database credentials in `.env` file

## Installation (if needed)
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows (use WSL or install PostgreSQL)
```

## Usage

### Creating a Backup
```bash
cd medusa/scripts/db-backup
chmod +x backup_db.sh

# Create a backup with custom name
./backup_db.sh pre_checkout_removal

# Create a backup with auto-generated timestamp
./backup_db.sh
```

### Restoring from Backup
```bash
cd medusa/scripts/db-backup
chmod +x restore_db.sh

# Restore a specific backup
./restore_db.sh pre_checkout_removal

# List available backups
./restore_db.sh
```

## Backup Strategy for Checkout Removal

### Before Starting
1. Create initial backup:
   ```bash
   ./backup_db.sh initial_pre_checkout_removal
   ```

2. Document current state:
   - Number of orders
   - Number of carts
   - Payment records

### After Each Major Step
Create incremental backups:
```bash
./backup_db.sh after_feature_flag_added
./backup_db.sh after_cart_removal
./backup_db.sh after_payment_removal
```

### Rollback Procedure
If issues arise:
```bash
# 1. Stop Medusa server
# 2. Restore the appropriate backup
./restore_db.sh initial_pre_checkout_removal

# 3. Set feature flag to true
echo "ENABLE_LEGACY_CHECKOUT=true" >> ../../.env

# 4. Restart Medusa server
cd ../.. && npm run dev
```

## Backup Files Location
All backups are stored in `medusa/scripts/db-backup/backups/` with:
- `.sql.gz` - Compressed SQL dump
- `_metadata.json` - Backup metadata including timestamp and purpose

## Safety Features
- Automatic compression to save space
- Metadata tracking for each backup
- Safety backup before any restore operation
- Single transaction restore with error stopping
- Automatic migration run after restore

## Important Notes
1. Always test restore procedure in development first
2. Keep at least 3 recent backups
3. Document the purpose of each backup
4. Verify backup integrity after creation
5. Consider backing up to external storage for production

## Troubleshooting

### pg_dump not found
Install PostgreSQL client tools (see Installation section)

### Connection refused
- Check DATABASE_URL in .env
- Ensure database is accessible
- Check firewall/security group settings

### Permission denied
Make scripts executable:
```bash
chmod +x backup_db.sh restore_db.sh
```

### Large database
For large databases, consider:
- Using `--exclude-table` for log tables
- Backing up during low-traffic periods
- Using parallel dump with `-j` flag