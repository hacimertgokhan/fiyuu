FROM node:22-alpine

WORKDIR /app

# Override NODE_ENV for npm install
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Copy and install
COPY package*.json ./
RUN npm install --include=dev

# Debug: Check if fiyuu is installed
RUN ls -la node_modules/.bin/ | grep fiyuu || echo "fiyuu not in .bin"
RUN cat package.json | grep -A5 dependencies

# Copy source
COPY . .

# Build with npx
RUN npx --yes fiyuu build

# Runtime env
ENV NODE_ENV=production
EXPOSE 4070
CMD ["npx", "fiyuu", "start"]
