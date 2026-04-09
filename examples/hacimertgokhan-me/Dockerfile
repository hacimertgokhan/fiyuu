FROM node:22-alpine

WORKDIR /app

# Override NODE_ENV for npm install
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Copy and install
COPY package*.json ./
RUN npm install --include=dev

# Copy source and build
COPY . .
RUN ./node_modules/.bin/fiyuu build

# Runtime env
ENV NODE_ENV=production
EXPOSE 4060
CMD ["./node_modules/.bin/fiyuu", "start"]
