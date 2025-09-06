# Production-ready Dockerfile for Medusa v2 on Railway
# Based on working solution from commit 011b08c
# Fresh build: 2025-09-06-05:20 (cache buster)

FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S medusa -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (Medusa v2 needs dev deps for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Critical: Build with proper environment sequence for Medusa v2
# Build in development mode to ensure admin UI is included
ENV NODE_ENV=development
ENV DISABLE_MEDUSA_ADMIN=false

# CRITICAL: Set the correct Medusa v2 admin backend URL environment variable
# Based on official docs: MEDUSA_ADMIN_BACKEND_URL is used for production admin builds
ENV MEDUSA_ADMIN_BACKEND_URL=https://medusa-production-e02c.up.railway.app
ENV MEDUSA_BACKEND_URL=https://medusa-production-e02c.up.railway.app

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
RUN echo "MEDUSA_ADMIN_BACKEND_URL=https://medusa-production-e02c.up.railway.app" >> .env
RUN echo "MEDUSA_BACKEND_URL=https://medusa-production-e02c.up.railway.app" >> .env

# NUCLEAR APPROACH: Force complete rebuild with cache deletion
RUN rm -rf .medusa node_modules/.cache @medusajs/admin* || true
RUN rm -rf node_modules/@medusajs/admin/dist || true

# Re-install to ensure clean state
RUN npm ci --force

# Build with explicit deployment flag and verbose logging
RUN MEDUSA_ADMIN_BACKEND_URL=https://medusa-production-e02c.up.railway.app npx medusa build --verbose

# Double-check: build admin separately with deployment flag
RUN MEDUSA_ADMIN_BACKEND_URL=https://medusa-production-e02c.up.railway.app npx medusa build --admin-only --deployment --verbose

# Copy runtime override script to admin build directory
RUN mkdir -p .medusa/server/public/admin/
RUN cp src/admin/runtime-override.js .medusa/server/public/admin/ || true

# Debug: Verify admin build configuration and check for localhost references
RUN echo "🔍 Verifying admin build configuration..."
RUN echo "🔍 Final environment check:"
RUN grep -E "(MEDUSA_BACKEND_URL|RAILWAY)" .env || echo "No backend URL in .env"
RUN find .medusa/server/public/admin -name "*.js" -exec grep -l "localhost:9000" {} \; && echo "❌ Found localhost references!" || echo "✅ No localhost:9000 references found in admin build"

# Create the public symlink (critical fix for admin build issue)
RUN ln -sf .medusa/server/public/ public

# Verify admin build was successful - fail if not found
RUN ls -la .medusa/server/public/admin/index.html && echo "✅ Admin build successful!" || (echo "❌ Admin build failed!" && exit 1)

# Set back to production for runtime
ENV NODE_ENV=production

# Set proper ownership
RUN chown -R medusa:nodejs /app

# Switch to non-root user
USER medusa

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 9000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 9000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command with database migration
CMD ["sh", "-c", "npm run predeploy && npm start"]