#!/bin/bash

# Database Restore Script for Medusa
# Usage: ./restore_db.sh backup_name
# Example: ./restore_db.sh pre_checkout_removal

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Medusa Database Restore Script ===${NC}"

# Check if backup name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide backup name${NC}"
    echo "Usage: ./restore_db.sh backup_name"
    echo ""
    echo "Available backups:"
    ls -la ./backups/*.gz 2>/dev/null | awk '{print "  - " $9}' | sed 's/.*\///' | sed 's/.sql.gz//'
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_FILE="./backups/${BACKUP_NAME}.sql.gz"

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    echo ""
    echo "Available backups:"
    ls -la ./backups/*.gz 2>/dev/null | awk '{print "  - " $9}' | sed 's/.*\///' | sed 's/.sql.gz//'
    exit 1
fi

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

echo -e "${YELLOW}⚠️  WARNING: This will restore the database from backup${NC}"
echo -e "${YELLOW}   Backup: ${BACKUP_NAME}${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Create a safety backup first
echo -e "${YELLOW}Creating safety backup before restore...${NC}"
./backup_db.sh "safety_before_restore_$(date +%Y%m%d_%H%M%S)"

# Parse DATABASE_URL
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    # Remove query parameters if present
    DB_NAME=${DB_NAME%%\?*}

    echo -e "${YELLOW}Restoring database from backup...${NC}"

    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --single-transaction \
        -v ON_ERROR_STOP=1

    echo -e "${GREEN}✓ Database restored successfully${NC}"

    # Run migrations to ensure schema is up to date
    echo -e "${YELLOW}Running migrations...${NC}"
    cd ../.. && npx medusa db:migrate

    echo -e "${GREEN}✓ Migrations completed${NC}"

else
    echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Restore Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Restart the Medusa server"
echo "2. Test that everything is working correctly"
echo "3. If there are issues, you can restore the safety backup"