# Klaro AI API Server Dockerfile
# Multi-stage build for optimized production image on GCP Cloud Run

# ── Build stage ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for layer caching
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# ── Production stage ──
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling (Cloud Run sends SIGTERM)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source from builder
COPY --from=builder /app/index.js ./
COPY --from=builder /app/app.js ./
COPY --from=builder /app/routes/ ./routes/
COPY --from=builder /app/lib/ ./lib/
COPY --from=builder /app/middleware/ ./middleware/

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Cloud Run uses PORT env var (default 8080), our app reads process.env.PORT
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:' + (process.env.PORT || 8080) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init for graceful shutdown (Cloud Run SIGTERM handling)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
