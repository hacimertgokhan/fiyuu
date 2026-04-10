import { defineConfig } from "@fiyuu/core";

export default defineConfig({
  app: {
    name: "Fiyuu Work Backend",
    port: 4050,
    host: "0.0.0.0",
  },
  
  // Database configuration
  database: {
    path: "./data/app.db",
    wal: true,
  },
  
  // WebSocket configuration
  websocket: {
    enabled: true,
    port: 4051,
    heartbeat: {
      enabled: true,
      interval: 30000,
      timeout: 60000,
    },
  },
  
  // SEO defaults
  seo: {
    baseUrl: "http://localhost:4050",
    sitemap: true,
    robots: true,
  },
  
  // Feature flags
  features: {
    auth: true,
    websocket: true,
    realtime: true,
    services: true,
  },
  
  // Logging
  logging: {
    level: "info",
    requests: true,
  },
});
