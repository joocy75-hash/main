# ============================================
# Backend Dockerfile (Multi-stage, Node.js 22 Alpine)
# ============================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --production=false

# Stage 2: Build TypeScript + Generate Prisma Client
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npx tsc

# Stage 3: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Set ownership
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 8003

# Entrypoint: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
