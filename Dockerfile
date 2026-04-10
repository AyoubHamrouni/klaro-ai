# Klaro AI Full-Stack Dockerfile
# Automatically detected by GCP deployments from the root directory.

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app
# Copy root package.json for frontend
COPY package*.json ./
RUN npm install
# Copy frontend source code
COPY index.html vite.config.ts tailwind.config.ts postcss.config.js components.json tsconfig*.json ./
COPY src/ ./src/
COPY public/ ./public/
# Build the Vite application (outputs to /app/dist)
ENV VITE_API_URL=""
RUN npm run build

# ── Stage 2: Build Backend ──
FROM node:20-alpine AS backend-builder
WORKDIR /app
# Copy server package files
COPY server/package*.json ./
RUN npm install
# Copy backend source code
COPY server/ .

# ── Stage 3: Production Release ──
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling (Cloud Run sends SIGTERM)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install production deps only for backend
COPY server/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy backend application source
COPY --from=backend-builder /app/index.js ./
COPY --from=backend-builder /app/app.js ./
COPY --from=backend-builder /app/routes/ ./routes/
COPY --from=backend-builder /app/lib/ ./lib/
COPY --from=backend-builder /app/middleware/ ./middleware/

# Copy the built frontend into a directory accessible by the backend
COPY --from=frontend-builder /app/dist ./dist

# Set permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Configure execution environment
ENV PORT=8080
ENV FRONTEND_ORIGIN=http://localhost:8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:' + (process.env.PORT || 8080) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
