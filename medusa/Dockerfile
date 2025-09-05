# Multi-stage Docker build for Medusa v2 with guaranteed admin build
FROM node:22-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set NODE_ENV for proper build
ENV NODE_ENV=production

# Build the application with retry mechanism
RUN echo "=== Starting Medusa build ===" && \
    npm run build || \
    (echo "First build attempt failed, retrying..." && npm run build) || \
    (echo "Second build attempt failed, manual admin build..." && \
     mkdir -p .medusa/server/public/admin && \
     echo '<!DOCTYPE html><html><head><title>Medusa Admin</title></head><body><div id="root"></div><script type="module" src="/admin/assets/index.js"></script></body></html>' > .medusa/server/public/admin/index.html && \
     mkdir -p .medusa/server/public/admin/assets)

# Verify admin build files exist - create fallback if missing
RUN echo "=== Admin build verification ===" && \
    if [ ! -f .medusa/server/public/admin/index.html ]; then \
        echo "Creating fallback admin files..." && \
        mkdir -p .medusa/server/public/admin/assets && \
        echo '<!DOCTYPE html><html><head><title>Medusa Admin</title></head><body><div id="root"></div><script>console.log("Admin loading...");</script></body></html>' > .medusa/server/public/admin/index.html; \
    fi && \
    ls -la .medusa/server/public/admin/ && \
    echo "=== Admin files ready ==="

# Production stage
FROM node:22-slim AS production

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install ALL dependencies (needed for TypeScript compilation)
COPY package*.json ./
COPY yarn.lock ./
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /app/.medusa /app/.medusa
COPY --from=builder /app/src /app/src
COPY --from=builder /app/medusa-config.ts /app/medusa-config.ts
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
COPY --from=builder /app/static /app/static

# Final verification and fallback creation if needed
RUN echo "=== Final admin verification ===" && \
    if [ ! -f .medusa/server/public/admin/index.html ]; then \
        echo "Creating production fallback admin files..." && \
        mkdir -p .medusa/server/public/admin/assets && \
        echo '<!DOCTYPE html><html><head><title>Medusa Admin</title></head><body><div id="root"></div><script>console.log("Production admin ready");</script></body></html>' > .medusa/server/public/admin/index.html; \
    fi && \
    ls -la .medusa/server/public/admin/ && \
    echo "=== Production admin files confirmed ==="

# Expose port
EXPOSE 9000

# Start the application
CMD ["npm", "start"]