# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN ./node_modules/.bin/fiyuu build

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
