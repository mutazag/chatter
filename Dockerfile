# Stage 1: Build client and server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies
RUN npm ci

# Copy source
COPY client/ ./client/
COPY server/ ./server/

# Generate Prisma client and build both workspaces
RUN npx prisma generate --schema=server/prisma/schema.prisma
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Stage 2: Production image
FROM node:22-alpine

# Required for Prisma to detect OpenSSL version and load the correct engine binary
RUN apk add --no-cache openssl

WORKDIR /app

# Copy server build output
COPY --from=builder /app/server/dist ./dist

# Copy root package files (lock file lives at root in a monorepo)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
RUN npm ci --omit=dev --workspace=server

# Copy Prisma schema and generated client
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy React build as static assets served by Express
COPY --from=builder /app/client/dist ./public

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/index.js"]
