# Production Dockerfile for AURA ATELIER Backend
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies required for potential native builds
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Final Runtime Image
FROM node:20-alpine

# Add curl for container health check
RUN apk add --no-cache curl

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy installed production dependencies from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code
COPY . .

# Ensure uploads directory exists and permissions are assigned to node user
RUN mkdir -p uploads && chown -R node:node /usr/src/app

# Use non-root node user for container security
USER node

EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
