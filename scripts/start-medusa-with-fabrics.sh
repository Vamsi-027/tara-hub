#!/bin/bash

# Script to start Medusa backend with fabric data

echo "🚀 Starting Medusa Backend with Fabric Integration..."

# Navigate to Medusa backend directory
cd backend/medusa/medusa-backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Medusa dependencies..."
  npm install
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx medusa db:migrate

# Build the project
echo "🔨 Building Medusa backend..."
npm run build

# Seed fabric data
echo "🌱 Seeding fabric data..."
npx ts-node src/scripts/seed-fabrics.ts || echo "Seed script not ready yet, skipping..."

# Start Medusa server
echo "✨ Starting Medusa server on port 9000..."
npm run dev