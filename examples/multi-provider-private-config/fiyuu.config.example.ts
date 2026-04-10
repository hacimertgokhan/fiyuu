import { defineConfig } from "@fiyuu/core";

/**
 * Fiyuu Configuration Example
 * 
 * This example demonstrates:
 * 1. Multiple provider setup
 * 2. Private assets configuration
 * 3. Error handling with skeletons and error boundaries
 */

export default defineConfig({
  app: {
    name: "my-app",
    runtime: "node",
    port: 4050,
  },

  // ── Provider Configuration ───────────────────────────────────────────────────
  providers: {
    // Directory containing providers (default: app/providers)
    directory: "app/providers",
    
    // Auto-discover all providers from directory
    autoDiscover: true,
    
    // Explicit provider order (overrides file-based ordering)
    order: [
      "theme-provider",      // First: Theme context
      "auth-provider",       // Second: Auth context
      "data-provider",       // Third: Data context
    ],
    
    // Global providers applied to all routes
    global: [
      "theme-provider",
      "error-boundary",
    ],
    
    // Layout providers (wrap layout.tsx components)
    layout: [
      "auth-provider",
    ],
    
    // Page providers (wrap page.tsx components)
    page: [
      "analytics-provider",
    ],
  },

  // ── Private Assets Configuration ────────────────────────────────────────────
  private: {
    // Directory for private assets (default: private)
    directory: "private",
    
    // Maximum file size (default: 100MB)
    maxFileSize: 50 * 1024 * 1024, // 50MB
    
    // Allowed MIME types (undefined = allow all)
    allowedMimeTypes: [
      "application/json",
      "text/csv",
      "text/plain",
      "application/pdf",
    ],
    
    // Enable server-side caching
    enableCache: true,
  },

  // ── Error Handling Configuration ────────────────────────────────────────────
  errors: {
    // Show detailed error information in UI
    showDetails: process.env.NODE_ENV === "development",
    
    // Enable error boundaries
    enableBoundaries: true,
    
    // Enable skeleton loading states
    enableSkeletons: true,
    
    // Default skeleton variant
    defaultSkeleton: "card",
    
    // Custom error handler
    onError: (error) => {
      console.error(`[Fiyuu Error] ${error.code}:`, error.message);
      
      // Send to external error tracking service
      if (process.env.SENTRY_DSN) {
        // Sentry.captureException(error);
      }
    },
    
    // Whether to expose error details in responses
    expose: process.env.NODE_ENV === "development",
  },

  // ── Other Configurations ────────────────────────────────────────────────────
  data: {
    driver: "f1",
    path: ".fiyuu/data",
    autosave: true,
  },

  seo: {
    baseUrl: "https://example.com",
    sitemap: true,
    robots: true,
  },
});
