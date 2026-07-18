FROM node:20-alpine

# Install build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy api package files
COPY api/package*.json ./

# Install all deps (including native build)
RUN npm ci

# Copy api source
COPY api/ .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Start
CMD ["node", "src/server.js"]
