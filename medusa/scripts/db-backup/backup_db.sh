#!/bin/bash

# Database Backup Script for Medusa
# Usage: ./backup_db.sh [backup_name]
# Example: ./backup_db.sh pre_checkout_removal

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Medusa Database Backup Script ===${NC}"

# Load environment variables
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not found in .env${NC}"
    exit 1
fi

# Set backup name
BACKUP_NAME=${1:-"backup_$(date +%Y%m%d_%H%M%S)"}
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backup: ${BACKUP_NAME}${NC}"

# Parse DATABASE_URL for pg_dump
# Format: postgresql://username:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    # Remove query parameters if present
    DB_NAME=${DB_NAME%%\?*}

    # Create backup
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --verbose \
        > "$BACKUP_FILE"

    # Compress the backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"

    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo -e "  Location: ${BACKUP_FILE}"
    echo -e "  Size: ${BACKUP_SIZE}"

    # Create metadata file
    cat > "${BACKUP_DIR}/${BACKUP_NAME}_metadata.json" <<EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database": "${DB_NAME}",
  "host": "${DB_HOST}",
  "file": "${BACKUP_FILE}",
  "size": "${BACKUP_SIZE}",
  "medusa_version": "2.10.0",
  "purpose": "Pre-checkout removal backup"
}
EOF

    echo -e "${GREEN}✓ Metadata saved${NC}"

else
    echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
    echo "Expected format: postgresql://username:password@host:port/database"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo ""
echo "To restore this backup, run:"
echo "  ./restore_db.sh ${BACKUP_NAME}"