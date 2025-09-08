#!/bin/bash
# Start development environment with Docker

set -e

echo "🚀 Starting Tara Hub development environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.docker template..."
    cp .env.docker .env
    echo "⚠️  Please update .env with your actual credentials"
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start core services
echo "🔧 Starting core services (PostgreSQL, Redis, Medusa, Admin)..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Start Medusa
echo "🏗️ Starting Medusa backend..."
docker-compose up -d medusa

# Wait for Medusa to be ready
echo "⏳ Waiting for Medusa to be ready..."
sleep 30

# Run Medusa migrations
echo "🔄 Running Medusa database migrations..."
docker-compose exec medusa npx medusa db:migrate || true

# Start Admin dashboard
echo "🎨 Starting Admin dashboard..."
docker-compose up -d admin

# Optional: Start management tools
read -p "Do you want to start PgAdmin and Redis Commander? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛠️ Starting management tools..."
    docker-compose --profile tools up -d
fi

# Run health check
echo ""
sleep 5
./scripts/docker/health-check.sh

echo ""
echo "📚 Docker Commands:"
echo "  docker-compose logs -f medusa    # View Medusa logs"
echo "  docker-compose logs -f admin     # View Admin logs"
echo "  docker-compose ps                # List running services"
echo "  docker-compose down              # Stop all services"
echo "  docker-compose restart medusa    # Restart Medusa"
echo ""
echo "🎉 Development environment is ready!"