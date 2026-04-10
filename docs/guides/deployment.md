# Deployment Guide

Deploy Fiyuu apps to Docker, VPS, or cloud platforms.

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose ports
EXPOSE 4050 4051

# Start
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4050:4050"
      - "4051:4051"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped

  # Optional: Reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

### Build & Run

```bash
# Build image
docker build -t my-fiyuu-app .

# Run container
docker run -p 4050:4050 -e JWT_SECRET=secret my-fiyuu-app

# Or with docker-compose
docker-compose up -d
```

## VPS Deployment (Ubuntu)

### 1. Prepare Server

```bash
# Update
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### 2. Deploy Application

```bash
# Clone repo
git clone https://github.com/user/repo.git
cd repo

# Install & build
npm ci
npm run build

# Start with PM2
pm2 start npm --name "fiyuu-app" -- start
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/fiyuu
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:4050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:4051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fiyuu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

```bash
# .env
NODE_ENV=production
PORT=4050
JWT_SECRET=your-secret-key
DATABASE_PATH=./data/app.db
UPLOAD_DIR=./uploads
```

## Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  // Check database
  await db.query("SELECT 1");
  
  // Check memory
  const memory = process.memoryUsage();
  
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
      total: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
    },
  });
}
```

## Monitoring

```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs

# Restart
pm2 restart fiyuu-app
```

## Best Practices

1. **Use PM2** - Process management
2. **Enable SSL** - Always use HTTPS
3. **Set NODE_ENV** - Production mode
4. **Use environment variables** - No secrets in code
5. **Regular backups** - Database and uploads
6. **Monitoring** - Health checks and logs
