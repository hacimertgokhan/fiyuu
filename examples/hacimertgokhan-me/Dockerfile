# Single stage build - simpler approach
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./

# Show what's in package.json
RUN cat package.json && echo "--- Installing deps ---"

# Install dependencies
RUN npm install

# Verify fiyuu is installed
RUN ls -la node_modules/.bin/ | grep fiyuu || echo "fiyuu not found in .bin"
RUN ls -la node_modules/@fiyuu/ 2>/dev/null || echo "@fiyuu folder not found"

# Copy source
COPY . .

# Build
RUN npx fiyuu build

# Expose port
EXPOSE 4060

# Start
CMD ["npx", "fiyuu", "start"]
