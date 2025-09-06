# Production-ready Dockerfile for Medusa v2 on Railway
# Based on latest Medusa v2 documentation and community solutions

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
# Ensure admin UI is enabled and install all dependencies needed for build
ENV NODE_ENV=development
ENV DISABLE_MEDUSA_ADMIN=false

# Install dev dependencies explicitly (required for Medusa v2 admin build)
RUN npm install --include=dev

# Build Medusa backend first
RUN npx medusa build || (echo "❌ Medusa backend build failed" && exit 1)

# Verify build structure exists
RUN ls -la .medusa/server/ && ls -la .medusa/server/public/ || (echo "❌ Build directory missing" && exit 1)

# Build admin UI separately to ensure it's included
RUN npx medusa build --admin-only || (echo "❌ Admin build failed" && exit 1)

# Copy admin build to the correct server location
RUN mkdir -p .medusa/server/public/admin && \
    if [ -d ".medusa/admin" ]; then \
      echo "📁 Copying admin build to server public directory..."; \
      cp -r .medusa/admin/* .medusa/server/public/admin/ && \
      echo "✅ Admin files copied successfully"; \
    else \
      echo "❌ Admin directory not found"; \
      exit 1; \
    fi

# Create the public symlink (critical fix for admin build issue)
RUN ln -sf .medusa/server/public/ public

# Final verification - fail deployment if admin UI is missing
RUN ls -la .medusa/server/public/admin/index.html && echo "✅ Admin build successful!" || (echo "❌ Admin build failed - index.html missing!" && exit 1)

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