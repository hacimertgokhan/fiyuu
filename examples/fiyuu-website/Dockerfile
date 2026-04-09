# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Override NODE_ENV for build
ENV NODE_ENV=development

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npx fiyuu build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/fiyuu.config.ts ./fiyuu.config.ts
COPY --from=builder /app/.fiyuu ./.fiyuu

# Production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4070

# Start the application
CMD ["npx", "fiyuu", "start"]
