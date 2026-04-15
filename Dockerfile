# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY server.js ./
COPY public/ ./public/

# Ownership
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5678

# Graceful shutdown support
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
