# Docker Development Environment Setup

## Overview
This guide covers the Docker-based development environment for the Tara Hub Raw Materials implementation.

## Prerequisites
- Docker Desktop 4.0+ installed
- Docker Compose 2.0+ installed
- 8GB RAM minimum (16GB recommended)
- 20GB free disk space

## Quick Start

### 1. Initial Setup
```bash
# Clone the repository if not already done
git clone https://github.com/your-org/tara-hub.git
cd tara-hub

# Copy environment template
cp .env.docker .env

# Edit .env with your credentials
# Required: RESEND_API_KEY for email functionality
nano .env
```

### 2. Start Development Environment
```bash
# Make scripts executable
chmod +x scripts/docker/*.sh

# Start all services
./scripts/docker/start-dev.sh

# Or manually with docker-compose
docker-compose up -d
```

### 3. Verify Services
```bash
# Run health check
./scripts/docker/health-check.sh

# Check logs
docker-compose logs -f medusa    # Medusa backend logs
docker-compose logs -f admin     # Admin dashboard logs
docker-compose logs postgres      # Database logs
docker-compose logs redis         # Cache logs
```

## Service Architecture

### Core Services
| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| PostgreSQL | 5432 | Primary database | `pg_isready` |
| Redis | 6379 | Cache & message queue | `redis-cli ping` |
| Medusa | 9000 | Backend API | `/health` endpoint |
| Admin | 3000 | Admin dashboard | `/api/health` endpoint |

### Optional Tools (--profile tools)
| Service | Port | Description |
|---------|------|-------------|
| PgAdmin | 5050 | Database management UI |
| Redis Commander | 8081 | Redis management UI |

## Docker Commands

### Service Management
```bash
# Start all services
docker-compose up -d

# Start with tools
docker-compose --profile tools up -d

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart medusa

# View service status
docker-compose ps
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U medusa -d medusa

# Run migrations
docker-compose exec medusa npx medusa db:migrate

# Create database backup
docker-compose exec postgres pg_dump -U medusa medusa > backup.sql

# Restore database
docker-compose exec -T postgres psql -U medusa medusa < backup.sql
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis commands
docker-compose exec redis redis-cli monitor

# Flush cache (development only)
docker-compose exec redis redis-cli FLUSHALL
```

### Debugging
```bash
# View real-time logs
docker-compose logs -f [service-name]

# Access container shell
docker-compose exec medusa sh
docker-compose exec admin sh

# Check resource usage
docker stats

# Inspect network
docker network inspect tara-hub_tara-network
```

## Development Workflow

### 1. Making Code Changes
- **Medusa Backend**: Changes in `/medusa` auto-reload via nodemon
- **Admin Dashboard**: Changes in `/app` trigger Next.js hot reload
- **Database Schema**: Run migrations after model changes

### 2. Testing with Docker
```bash
# Run Medusa tests
docker-compose exec medusa npm test

# Run Admin tests
docker-compose exec admin npm test

# Run specific test file
docker-compose exec medusa npm test -- path/to/test.spec.ts
```

### 3. Adding Dependencies
```bash
# Add to Medusa
docker-compose exec medusa npm install package-name
docker-compose restart medusa

# Add to Admin
docker-compose exec admin npm install package-name
docker-compose restart admin
```

## Environment Variables

### Required Variables
```env
# Database
POSTGRES_USER=medusa
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=medusa

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret

# Email (for notifications)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=admin@yourdomain.com
```

### Optional Variables
```env
# Storage (for file uploads)
S3_ENDPOINT=https://...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Payment
STRIPE_API_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Admin Tools
PGADMIN_EMAIL=admin@yourdomain.com
PGADMIN_PASSWORD=admin_password
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs for specific service
docker-compose logs [service-name]

# Rebuild service
docker-compose build --no-cache [service-name]
docker-compose up -d [service-name]
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check connection from Medusa
docker-compose exec medusa nc -zv postgres 5432

# Reset database (CAUTION: deletes data)
docker-compose down -v
docker-compose up -d postgres
```

### Port Conflicts
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
# Example: "3001:3000" to use port 3001 externally
```

### Performance Issues
```bash
# Increase Docker resources
# Docker Desktop > Settings > Resources
# Recommended: 4 CPUs, 8GB RAM

# Clean up unused resources
docker system prune -a
docker volume prune
```

## Health Monitoring

### Automated Health Checks
Each service has configured health checks that Docker uses to determine service status:

- **PostgreSQL**: Checks database connectivity
- **Redis**: Verifies Redis is responding
- **Medusa**: HTTP health endpoint check
- **Admin**: API health endpoint check

### Manual Health Verification
```bash
# PostgreSQL
curl http://localhost:5432 || echo "PostgreSQL is running"

# Redis
redis-cli -h localhost ping

# Medusa Backend
curl http://localhost:9000/health

# Admin Dashboard
curl http://localhost:3000/api/health
```

## Data Persistence

### Volumes
Docker volumes ensure data persists across container restarts:

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files
- `medusa_uploads`: Uploaded files
- `medusa_node_modules`: Cached dependencies
- `pgadmin_data`: PgAdmin configuration

### Backup Strategy
```bash
# Backup all data
./scripts/docker/backup.sh

# Backup specific volume
docker run --rm -v tara-hub_postgres_data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup.tar.gz /data
```

## Security Considerations

### Development vs Production
- **Development**: Uses default passwords, all ports exposed
- **Production**: Use secrets management, restrict port exposure

### Best Practices
1. Never commit `.env` files with real credentials
2. Use strong passwords even in development
3. Regularly update Docker images
4. Monitor container logs for security issues

## Integration with IDEs

### VS Code
```json
// .vscode/settings.json
{
  "docker.dockerComposePath": "docker-compose.yml",
  "remote.containers.defaultExtensions": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### Database Clients
- **PostgreSQL**: Connect to `localhost:5432` with credentials from `.env`
- **Redis**: Connect to `localhost:6379` (no auth in development)

## Next Steps
1. Start services: `docker-compose up -d`
2. Verify health: `./scripts/docker/health-check.sh`
3. Access Admin UI: http://localhost:3000
4. Access Medusa Admin: http://localhost:9000/app
5. Begin Session 2: Medusa Module Structure