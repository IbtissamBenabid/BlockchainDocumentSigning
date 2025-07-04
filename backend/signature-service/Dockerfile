# Use Debian-based image for better native dependency support
FROM node:18-bullseye-slim

# Install system dependencies for canvas and native modules
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg62-turbo-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    python3 \
    make \
    g++ \
    pkg-config \
    musl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for libjpeg.so.8 to point to the available version
RUN find /usr/lib -name "libjpeg.so*" -type f | head -1 | xargs -I {} ln -sf {} /usr/lib/x86_64-linux-gnu/libjpeg.so.8

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with better caching
RUN npm install --only=production --no-audit --no-fund

# Copy source code
COPY . .

# Create non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Create directories for signatures and keys with proper ownership
RUN mkdir -p signatures keys && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
