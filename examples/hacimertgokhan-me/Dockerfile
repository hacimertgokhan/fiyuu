# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies) for build
RUN npm install

# Copy source code
COPY . .

# Build with verbose output
RUN ./node_modules/.bin/fiyuu build || (echo "Build failed! Checking node_modules..." && ls -la node_modules/.bin/ && exit 1)

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/fiyuu.config.ts ./fiyuu.config.ts
COPY --from=builder /app/.fiyuu ./.fiyuu

# Expose port
EXPOSE 4060

# Start the application
CMD ["./node_modules/.bin/fiyuu", "start"]
