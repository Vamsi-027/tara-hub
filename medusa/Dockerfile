# Optimized Production Dockerfile for Medusa v2 on Railway
# Multi-stage build to reduce final image size

FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache dumb-init python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for build
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Critical: Build with proper environment sequence for Medusa v2
# Build in development mode to ensure admin UI is included
ENV NODE_ENV=development
ENV DISABLE_MEDUSA_ADMIN=false

# CRITICAL: Set the correct Medusa v2 admin backend URL environment variable
# Based on official docs: MEDUSA_ADMIN_BACKEND_URL is used for production admin builds
ENV MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
ENV MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app

# Railway environment variables for build context
ENV RAILWAY_PUBLIC_DOMAIN=medusa-production-e02c.up.railway.app
ENV RAILWAY_PROJECT_ID=7d4ddac3-5123-4445-98cf-714ad52a324a

# Debug: Print the correct environment variables
RUN echo "🔍 Building admin UI with official Medusa v2 configuration:"
RUN echo "🔍 MEDUSA_ADMIN_BACKEND_URL: $MEDUSA_ADMIN_BACKEND_URL"
RUN echo "🔍 MEDUSA_BACKEND_URL: $MEDUSA_BACKEND_URL"
RUN echo "🔍 RAILWAY_PUBLIC_DOMAIN: $RAILWAY_PUBLIC_DOMAIN"
RUN echo "🔍 NODE_ENV: $NODE_ENV"
RUN echo "🔍 DISABLE_MEDUSA_ADMIN: $DISABLE_MEDUSA_ADMIN"

# Override .env file with correct production values
RUN echo "MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app" >> .env
RUN echo "MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app" >> .env

# Clean caches and reinstall with dev deps for build
RUN rm -rf .medusa node_modules/.cache ~/.npm/_cacache || true
RUN npm install --include=dev --no-cache

# Build with ALL possible environment variables set
RUN MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    REACT_APP_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    VITE_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    __BACKEND_URL__=https://medusa-backend-production-3655.up.railway.app \
    npx medusa build --verbose

# Double-check: build admin separately with ALL env vars
RUN MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    REACT_APP_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    VITE_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app \
    __BACKEND_URL__=https://medusa-backend-production-3655.up.railway.app \
    npx medusa build --admin-only --verbose

# Copy runtime override script to admin build directory
RUN mkdir -p .medusa/server/public/admin/
RUN cp src/admin/runtime-override.js .medusa/server/public/admin/ || true

# Debug: Verify admin build configuration and check for localhost references
RUN echo "🔍 Verifying admin build configuration..."
RUN echo "🔍 Final environment check:"
RUN grep -E "(MEDUSA_BACKEND_URL|RAILWAY)" .env || echo "No backend URL in .env"
RUN find .medusa/server/public/admin -name "*.js" -exec grep -l "localhost:9000" {} \; && echo "❌ Found localhost references!" || echo "✅ No localhost:9000 references found in admin build"

# FORCE REPLACEMENT: If localhost references still exist, replace them directly in the built files
RUN echo "🔧 Force replacing any remaining localhost references in built files..."
RUN find .medusa/server/public/admin -name "*.js" -exec sed -i 's|http://localhost:9000|https://medusa-backend-production-3655.up.railway.app|g' {} \; || true
RUN find .medusa/server/public/admin -name "*.js" -exec sed -i 's|https://localhost:9000|https://medusa-backend-production-3655.up.railway.app|g' {} \; || true
RUN find .medusa/server/public/admin -name "*.js" -exec sed -i 's|localhost:9000|medusa-backend-production-3655.up.railway.app|g' {} \; || true

# Final verification after replacement
RUN find .medusa/server/public/admin -name "*.js" -exec grep -l "localhost:9000" {} \; && echo "⚠️  Still found localhost references after replacement!" || echo "✅ All localhost references eliminated!"

# Create the public symlink (critical fix for admin build issue)
RUN ln -sf .medusa/server/public/ public

# Verify admin build was successful - fail if not found
RUN ls -la .medusa/server/public/admin/index.html && echo "✅ Admin build successful!" || (echo "❌ Admin build failed!" && exit 1)

# Production stage - smaller final image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S medusa -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (Medusa needs dev deps for TypeScript at runtime)
RUN npm ci && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=medusa:nodejs /app/.medusa /app/.medusa
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.ts /app/medusa-config.ts
COPY --from=builder --chown=medusa:nodejs /app/tsconfig.json /app/tsconfig.json
COPY --from=builder --chown=medusa:nodejs /app/src /app/src
COPY --from=builder --chown=medusa:nodejs /app/.env /app/.env

# Copy public directory directly instead of symlink (Railway compatibility)
COPY --from=builder --chown=medusa:nodejs /app/.medusa/server/public /app/public

# Set production environment
ENV NODE_ENV=production

# Switch to non-root user
USER medusa

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 9000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 9000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command with database migration and explicit host binding
CMD ["sh", "-c", "npm run predeploy && NODE_ENV=production npx medusa start --host 0.0.0.0 --port 9000"]