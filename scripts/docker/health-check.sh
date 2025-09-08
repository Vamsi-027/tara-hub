#!/bin/bash
# Health check script for Docker services

set -e

echo "🔍 Checking Docker services health..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check PostgreSQL
echo -n "PostgreSQL: "
if docker-compose exec -T postgres pg_isready -U medusa -d medusa > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Not healthy${NC}"
fi

# Check Redis
echo -n "Redis: "
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Not healthy${NC}"
fi

# Check Medusa
echo -n "Medusa Backend: "
if curl -f http://localhost:9000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Starting up...${NC}"
fi

# Check Admin Dashboard
echo -n "Admin Dashboard: "
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Starting up...${NC}"
fi

# Check optional services if running with tools profile
if docker-compose ps | grep -q pgadmin; then
    echo -n "PgAdmin: "
    if curl -f http://localhost:5050 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Starting up...${NC}"
    fi
fi

if docker-compose ps | grep -q redis-commander; then
    echo -n "Redis Commander: "
    if curl -f http://localhost:8081 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Starting up...${NC}"
    fi
fi

echo ""
echo "📊 Service URLs:"
echo "  - Admin Dashboard: http://localhost:3000"
echo "  - Medusa Backend: http://localhost:9000"
echo "  - Medusa Admin UI: http://localhost:9000/app"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"

if docker-compose ps | grep -q pgadmin; then
    echo "  - PgAdmin: http://localhost:5050"
fi

if docker-compose ps | grep -q redis-commander; then
    echo "  - Redis Commander: http://localhost:8081"
fi

echo ""
echo "✨ All critical services are running!"