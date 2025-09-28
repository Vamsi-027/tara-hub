# Sandbox Environment Setup Guide

## Quick Start for Restricted Environments

If you're experiencing network connectivity issues (EAI_AGAIN errors) or CLI config directory permission problems, this guide provides complete workarounds.

### Prerequisites
- Docker installed and running
- Node.js >=18.0.0
- npm >=10.0.0

### 1. Automated Setup (Recommended)

Run the automated sandbox setup:

```bash
# From the medusa directory
npm run sandbox:setup
```

This will:
- ✅ Diagnose your environment
- 🐘 Set up local PostgreSQL in Docker
- 📁 Create local Medusa config directory
- 🧪 Generate offline test suite
- 📦 Add sandbox commands to package.json

### 2. Manual Step-by-Step Setup

If the automated setup fails, follow these manual steps:

#### Step 1: Start Local PostgreSQL
```bash
# Start PostgreSQL container (port 5433 to avoid conflicts)
npm run sandbox:postgres:start

# Verify it's running
npm run sandbox:postgres:logs
```

#### Step 2: Use Sandbox Environment
```bash
# Run Medusa CLI with sandbox config
./medusa-sandbox.sh regions:list

# Or use the npm script version
npm run sandbox:medusa regions:list
```

#### Step 3: Run Tests
```bash
# Run offline tests (no database required)
npm run sandbox:test:offline

# Run tests with local database
npm run sandbox:test:local
```

### 3. Available Sandbox Commands

After setup, these commands are available:

```bash
# Database Management (requires Docker)
npm run sandbox:postgres:start    # Start local PostgreSQL
npm run sandbox:postgres:stop     # Stop PostgreSQL container
npm run sandbox:postgres:logs     # View PostgreSQL logs

# Testing (works without Docker)
npm run sandbox:verify            # Comprehensive verification (NO DOCKER NEEDED)
npm run sandbox:test:offline:fixed # Run offline validation tests (NO DOCKER NEEDED)
npm run sandbox:test:local        # Run E2E tests with local DB (requires Docker)

# Medusa CLI (requires Docker for database)
npm run sandbox:medusa <command>  # Run any Medusa CLI command
./medusa-sandbox.sh <command>     # Direct script usage

# Environment Management
npm run sandbox:setup             # Re-run full setup
```

### 3.1 Docker-Free Verification (For Restricted Environments)

If Docker is blocked in your environment, you can still verify everything works:

```bash
# Run comprehensive verification (analyzes code, config, files)
npm run sandbox:verify

# Run offline tests (pure JavaScript validation)
npm run sandbox:test:offline:fixed
```

These commands work without Docker and provide extensive verification of the multi-material implementation.

### 4. Environment Files Created

The setup creates these files:

- `.env.sandbox` - Local environment configuration
- `docker-compose.test.yml` - PostgreSQL container setup
- `medusa-sandbox.sh` - Helper script for Medusa CLI
- `.medusa-config/` - Local config directory

### 5. Database Connection Details

Local PostgreSQL connection:
- **Host**: localhost
- **Port**: 5433
- **Database**: medusa_test
- **Username**: medusa
- **Password**: medusa
- **URL**: `postgresql://medusa:medusa@localhost:5433/medusa_test`

### 6. Testing Multi-Material Functionality

Once the environment is set up:

```bash
# Apply the multi-material migration
DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test" \
  npx tsx scripts/migrate-to-multi-material.ts

# Run the enhanced E2E tests
DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test" \
  npm run test:e2e:materials

# Validate the migration
DATABASE_URL_TEST="postgresql://medusa:medusa@localhost:5433/medusa_test" \
  npx tsx scripts/validate-migration.ts
```

### 7. Troubleshooting

#### Docker Issues
```bash
# Check Docker is running
docker --version

# Restart Docker service if needed
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on Windows/Mac
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x medusa-sandbox.sh
chmod +x scripts/*.ts

# Check file permissions
ls -la .medusa-config/
```

#### Network Connectivity
```bash
# Test local PostgreSQL connection
npx tsx -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://medusa:medusa@localhost:5433/medusa_test'
});
pool.query('SELECT 1').then(() => console.log('✅ Connected')).catch(console.error);
"
```

### 8. Production Deployment

When ready for production:

1. Update environment variables to use production Neon database
2. Run migrations on production database:
   ```bash
   DATABASE_URL="your-production-url" npx tsx scripts/migrate-to-multi-material.ts
   ```
3. Deploy using your normal deployment process

### 9. Cleaning Up

To remove sandbox environment:

```bash
# Stop and remove containers
npm run sandbox:postgres:stop
docker-compose -f docker-compose.test.yml down -v

# Remove generated files
rm -f docker-compose.test.yml .env.sandbox medusa-sandbox.sh
rm -rf .medusa-config/
```

## Support

If you encounter issues:

1. Check the sandbox setup logs: `npm run sandbox:setup`
2. Verify Docker is running: `docker ps`
3. Test database connectivity manually (see troubleshooting section)
4. Review the generated `.env.sandbox` file for correct configuration

The sandbox environment provides complete isolation from production while maintaining full functionality for development and testing.