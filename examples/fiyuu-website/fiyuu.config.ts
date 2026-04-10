import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: {
    name: "fiyuu",
    port: 4070,
  },
  
  // Provider Configuration - Fiyuu v0.5.0
  providers: {
    directory: "app/providers",
    autoDiscover: true,
    global: [
      "theme-provider",    // Global theme context
      "error-boundary",    // Global error handling
    ],
    layout: [],
    page: [
      "analytics-provider", // Page-level analytics
    ],
  },
  
  // Private Assets Configuration - Fiyuu v0.5.0
  private: {
    directory: "private",
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      "application/json",
      "text/csv",
      "text/plain",
      "application/pdf",
    ],
    enableCache: true,
  },
  
  // Error Handling Configuration - Fiyuu v0.5.0
  errors: {
    showDetails: process.env.NODE_ENV === "development",
    enableBoundaries: true,
    enableSkeletons: true,
    defaultSkeleton: "card",
    onError: (error) => {
      console.error(`[Fiyuu Website Error] ${error.code}:`, error.message);
    },
    expose: process.env.NODE_ENV === "development",
  },
  
  data: {
    driver: "f1",
    path: ".fiyuu/data/f1.json",
  },
  
  middleware: {
    enabled: false,
  },
  
  developerTools: {
    enabled: true,
  },
  
  auth: {
    enabled: false,
  },
  
  seo: {
    baseUrl: "https://fiyuu.work",
    sitemap: true,
    robots: true,
  },
};

export default config;
