# Use the official Node.js 22 image
FROM node:22-slim

# Set working directory
WORKDIR /app/medusa

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY medusa/package*.json ./
COPY medusa/yarn.lock ./

# Install dependencies
RUN npm ci

# Copy source code
COPY medusa/ ./

# CACHE BUSTER - Add current timestamp to force rebuild
RUN echo "Build timestamp: $(date)" > /tmp/build-time.txt

# Build the application (this includes admin UI)
RUN NODE_ENV=production npx medusa build

# Verify admin build exists
RUN echo "=== ADMIN BUILD VERIFICATION ===" && \
    echo "Working directory: $(pwd)" && \
    echo "Looking for admin files:" && \
    find . -name "*.html" -type f 2>/dev/null | head -10 || echo "No HTML files found" && \
    echo "Admin directory contents:" && \
    ls -la .medusa/server/public/admin/ 2>/dev/null || echo "Admin directory not found" && \
    echo "=== END VERIFICATION ==="

# Expose port 9000
EXPOSE 9000

# Set host to accept connections from any IP
ENV HOST=0.0.0.0

# Start the application
CMD ["npm", "start"]