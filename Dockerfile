# Multi-stage Docker build for Roadworthy Inspection App
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application using custom production build
RUN node build-production.js

# Production image
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 roadworthy

# Copy built application
COPY --from=builder --chown=roadworthy:nodejs /app/dist ./dist
COPY --from=builder --chown=roadworthy:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=roadworthy:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p uploads Completed && chown -R roadworthy:nodejs uploads Completed

# Create SQLite database directory
RUN mkdir -p data && chown -R roadworthy:nodejs data

# Switch to non-root user
USER roadworthy

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=file:./data/database.sqlite

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 5000, path: '/api/settings', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "dist/index.js"]