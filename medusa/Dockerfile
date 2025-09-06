# Official Railway-compatible Dockerfile for Medusa v2
# Based on official docs: https://docs.medusajs.com/resources/deployment/medusa-application/railway

FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache dumb-init python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build Medusa application (this creates .medusa/server with admin UI)
ENV NODE_ENV=development
ENV DISABLE_MEDUSA_ADMIN=false
RUN npx medusa build

# Verify build completed successfully
RUN ls -la .medusa/server && \
    test -f .medusa/server/package.json || (echo "❌ Server build failed" && exit 1)

# Install production dependencies in the server directory
WORKDIR /app/.medusa/server
RUN npm ci --omit=dev

# Production runtime image
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S medusa -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=medusa:nodejs /app/.medusa/server /app

WORKDIR /app

# Switch to non-root user
USER medusa

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 9000) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 9000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start with migration and server startup
CMD ["sh", "-c", "npm run predeploy && npm start"]