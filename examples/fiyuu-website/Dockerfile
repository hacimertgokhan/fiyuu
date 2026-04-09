FROM node:22-alpine

WORKDIR /app

# Force NODE_ENV to development for install/build
ENV NODE_ENV=development

# Copy and install (install ALL dependencies including dev)
COPY package*.json ./
RUN npm install

# Verify fiyuu is installed
RUN ls -la node_modules/.bin/ | grep fiyuu || (echo "ERROR: fiyuu not found" && exit 1)
RUN ls -la node_modules/@fiyuu/ 2>/dev/null || (echo "ERROR: @fiyuu packages not found" && exit 1)

# Copy source
COPY . .

# Build
RUN ./node_modules/.bin/fiyuu build

# Runtime env (only set at runtime, not build)
ENV NODE_ENV=production
EXPOSE 4070
CMD ["./node_modules/.bin/fiyuu", "start"]
