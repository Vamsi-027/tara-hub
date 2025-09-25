#!/bin/bash

echo "🚀 Starting Local Deployment..."

# Method 1: Docker Compose (Recommended)
if command -v docker &> /dev/null; then
    echo "✅ Docker detected. Using Docker deployment..."

    # Stop any existing containers
    docker-compose down 2>/dev/null || true

    # Build and start containers
    echo "📦 Building containers..."
    docker-compose up --build -d

    echo "⏳ Waiting for services to start..."
    sleep 10

    echo "✅ Local deployment running!"
    echo "   Admin Panel: http://localhost:9000/app"
    echo "   Store API: http://localhost:9000/store"
    echo "   Health: http://localhost:9000/health"
    echo ""
    echo "📊 View logs: docker-compose logs -f medusa"
    echo "🛑 Stop: docker-compose down"

    exit 0
fi

# Method 2: Direct Node.js (if Docker not available)
echo "⚠️ Docker not found. Trying direct Node.js..."

# Check if node_modules exists from GitHub
if [ ! -d "node_modules" ]; then
    echo "📦 Downloading pre-built node_modules..."

    # Try to get from a backup or cache
    if [ -f "/tmp/medusa-node-modules.tar.gz" ]; then
        echo "📦 Extracting cached node_modules..."
        tar -xzf /tmp/medusa-node-modules.tar.gz
    else
        echo "⚠️ No cached modules. Attempting npm install..."

        # Try with increased memory
        export NODE_OPTIONS="--max-old-space-size=8192"

        # Clean everything first
        rm -rf node_modules package-lock.json
        npm cache clean --force 2>/dev/null || true

        # Try npm install with various flags
        npm ci --production=false --legacy-peer-deps --no-optional || \
        npm install --legacy-peer-deps --no-optional || \
        npm install --force
    fi
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_db
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
STORE_CORS=http://localhost:3000,http://localhost:3006,http://localhost:3007,http://localhost:8000
ADMIN_CORS=http://localhost:3000,http://localhost:7001,http://localhost:9000
AUTH_CORS=http://localhost:3000,http://localhost:9000,http://localhost:8000
MEDUSA_BACKEND_URL=http://localhost:9000
EOF
fi

# Try to start directly
echo "🚀 Starting Medusa directly..."
npx medusa develop --host 0.0.0.0 || node .medusa/server/index.js