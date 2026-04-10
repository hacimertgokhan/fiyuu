# Fiyuu Multi-Provider & Private Assets Guide

This guide demonstrates the new features in Fiyuu:
1. **Multiple Provider/Layout Architecture**
2. **Public/Private Folder Separation**
3. **Error Handling with Skeletons & Error Boundaries**

---

## 📁 Project Structure

```
my-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── providers/              # Provider components
│   │   ├── theme-provider.ts   # Global theme provider
│   │   ├── auth-provider.ts    # Authentication provider
│   │   └── analytics-provider.ts
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout
│   │   └── page.tsx
│   └── api/
│       └── data.ts
├── public/                     # Public assets (served to client)
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── private/                    # Private assets (server-only)
│   ├── config/
│   │   └── secrets.json        # API keys, secrets
│   ├── data/
│   │   └── users.csv           # Sensitive data
│   └── templates/
│       └── invoice-template.pdf
├── fiyuu.config.ts
└── package.json
```

---

## 🔐 Private Assets

The `private/` directory contains files that are **server-side only**. They are never exposed to the client via HTTP.

### Configuration

```typescript
// fiyuu.config.ts
export default defineConfig({
  private: {
    directory: "private",
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ["application/json", "text/csv"],
    enableCache: true,
  },
});
```

### Server-Side Access

Access private files only from server-side code:

```typescript
// app/dashboard/query.ts
import { readPrivateAsset, readPrivateJson, readPrivateCsv } from "@fiyuu/core";

export async function execute() {
  // Read as string
  const config = await readPrivateAsset("config/secrets.json");
  
  // Read and parse JSON
  const secrets = await readPrivateJson("config/secrets.json");
  
  // Read CSV as array of objects
  const users = await readPrivateCsv("data/users.csv");
  
  return { users, apiKey: secrets.apiKey };
}
```

### ❌ Client Cannot Access

Any request to `/private/*` is blocked:

```
GET /private/config/secrets.json
→ 403 Forbidden

Access denied: Private assets cannot be accessed via HTTP.
Private assets are server-side only.
```

---

## 🏗️ Multi-Provider Architecture

Providers wrap your layouts and pages with context. They are loaded automatically from `app/providers/`.

### Provider Types

| Target | Description |
|--------|-------------|
| `global` | Applied to all routes (outermost) |
| `layout` | Applied around layout.tsx components |
| `page` | Applied around page.tsx components (innermost) |

### Creating a Provider

```typescript
// app/providers/theme-provider.ts

/**
 * @intent Global theme context provider
 * @target global
 * @priority 10
 */
export default function ThemeProvider({ children, route }) {
  return `
    <div data-theme="dark" class="theme-wrapper">
      ${children}
    </div>
    <script>
      // Theme initialization
      (function() {
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
  `;
}
```

### Provider Metadata (JSDoc)

```typescript
/**
 * @intent Description of what this provider does
 * @target global | layout | page
 * @priority 0-100 (lower = earlier in chain)
 */
```

### Configuration

```typescript
// fiyuu.config.ts
export default defineConfig({
  providers: {
    directory: "app/providers",
    autoDiscover: true,
    order: ["theme-provider", "auth-provider", "data-provider"],
    global: ["theme-provider"],
    layout: ["auth-provider"],
    page: ["analytics-provider"],
  },
});
```

### Execution Order

For a route `/dashboard/settings`:

```
1. Global Providers (outermost)
   └── ThemeProvider
       └── ErrorBoundary
           └── Layout Providers
               └── AuthProvider
                   └── Layout (app/dashboard/layout.tsx)
                       └── Page Providers
                           └── AnalyticsProvider
                               └── Page (app/dashboard/settings/page.tsx) (innermost)
```

---

## 🦴 Skeleton Loading States

Show loading placeholders while data loads.

### Built-in Skeleton Variants

```typescript
import { defaultSkeleton } from "@fiyuu/core";

// Usage in component
const loadingState = defaultSkeleton("card");   // Card placeholder
const loadingState = defaultSkeleton("text");   // Text line
const loadingState = defaultSkeleton("image");  // Image placeholder
const loadingState = defaultSkeleton("avatar"); // Avatar circle
const loadingState = defaultSkeleton("button"); // Button placeholder
```

### Configuration

```typescript
// fiyuu.config.ts
export default defineConfig({
  errors: {
    enableSkeletons: true,
    defaultSkeleton: "card",
  },
});
```

### Using Skeletons in Pages

```typescript
// app/dashboard/page.tsx
import { wrapWithSkeleton, ifAnyError } from "@fiyuu/core";

export default class DashboardPage {
  template({ data }) {
    // Wrap content with skeleton
    return wrapWithSkeleton(
      this.renderContent(data),
      {
        id: "dashboard",
        skeleton: `<div class="skeleton-card">Loading...</div>`,
        minDisplayMs: 300, // Minimum display time
      }
    );
  }
  
  renderContent(data) {
    return `<div>${data.title}</div>`;
  }
}
```

---

## 🛡️ Error Boundaries

Catch and handle errors gracefully without breaking the entire page.

### Configuration

```typescript
// fiyuu.config.ts
export default defineConfig({
  errors: {
    enableBoundaries: true,
    showDetails: process.env.NODE_ENV === "development",
    onError: (error) => {
      console.error(`[${error.code}] ${error.message}`);
    },
  },
});
```

### Using Error Boundaries

```typescript
// app/dashboard/page.tsx
import { wrapWithErrorBoundary, tryRender } from "@fiyuu/core";

export default class DashboardPage {
  template() {
    // Wrap with error boundary
    return wrapWithErrorBoundary(
      this.renderWidget(),
      {
        id: "dashboard-widget",
        source: "DashboardWidget",
        fallback: (error, retry) => `
          <div class="error-fallback">
            <p>Failed to load widget</p>
            <button onclick="${retry}">Retry</button>
          </div>
        `,
      }
    );
  }
  
  renderWidget() {
    // If this throws, error boundary catches it
    return `<div>Widget Content</div>`;
  }
}
```

### Using `ifAnyError` Helper

```typescript
import { ifAnyError } from "@fiyuu/core";

export async function execute() {
  const { result, error, hasError } = await ifAnyErrorAsync(
    async () => {
      const data = await fetchExternalAPI();
      return transformData(data);
    },
    {
      fallback: { users: [], empty: true },
      onError: (err) => console.error("API failed:", err),
      source: "dashboard-query",
    }
  );
  
  if (hasError) {
    // Return fallback data
    return result;
  }
  
  return result;
}
```

### Using `tryRender` Helper

```typescript
import { tryRender, defaultSkeleton } from "@fiyuu/core";

export default class DashboardPage {
  template() {
    return tryRender(
      () => this.renderContent(),
      {
        // Show skeleton while loading
        skeleton: defaultSkeleton("card"),
        // Wrap with error boundary
        errorBoundary: true,
        // Fallback if render fails
        fallback: `<div>Unable to load content</div>`,
        source: "DashboardPage",
      }
    );
  }
}
```

---

## 🔄 Error Retry Mechanism

Error boundaries support retry:

```typescript
wrapWithErrorBoundary(
  content,
  {
    id: "my-component",
    source: "MyComponent",
    fallback: (error, retry) => `
      <div>
        <p>Error: ${error.message}</p>
        <button onclick="this.dispatchEvent(new CustomEvent('fiyuu:retry', {bubbles:true}))">
          Try Again
        </button>
      </div>
    `,
  }
);
```

---

## 📊 Predefined Error Codes

```typescript
import { ErrorCodes } from "@fiyuu/core";

// Query errors
ErrorCodes.QUERY_NOT_FOUND
ErrorCodes.QUERY_EXECUTION_FAILED
ErrorCodes.QUERY_TIMEOUT

// Action errors
ErrorCodes.ACTION_NOT_FOUND
ErrorCodes.ACTION_EXECUTION_FAILED
ErrorCodes.ACTION_UNAUTHORIZED

// Component errors
ErrorCodes.COMPONENT_RENDER_FAILED
ErrorCodes.COMPONENT_NOT_FOUND

// Asset errors
ErrorCodes.ASSET_NOT_FOUND
ErrorCodes.ASSET_ACCESS_DENIED
```

---

## 🎯 Best Practices

### 1. Keep Private Assets Organized

```
private/
├── config/          # Configuration files
├── data/            # Data exports
├── templates/       # PDF, email templates
├── keys/            # Private keys (be careful!)
└── backups/         # Database backups
```

### 2. Provider Naming

```
app/providers/
├── global/          # Global providers
│   ├── theme-provider.ts
│   └── error-boundary.ts
├── layout/          # Layout-specific
│   └── auth-provider.ts
└── page/            # Page-specific
    └── analytics-provider.ts
```

### 3. Error Handling Strategy

```typescript
// Always provide fallbacks for critical data
const { result, hasError } = ifAnyError(
  () => loadCriticalData(),
  {
    fallback: { empty: true }, // Never break the UI
    onError: (err) => logToMonitoring(err),
  }
);
```

### 4. Skeleton Usage

- Use skeletons for **initial load** only
- Keep skeleton display time **at least 200ms** to avoid flickering
- Match skeleton shape to actual content shape

---

## 🚀 Summary

| Feature | File Location | Config Path |
|---------|---------------|-------------|
| Providers | `app/providers/*.ts` | `config.providers.*` |
| Private Assets | `private/` | `config.private.*` |
| Error Handling | - | `config.errors.*` |
| Skeletons | - | `config.errors.*` |

These features work together to create robust, maintainable Fiyuu applications with clear separation of concerns between server and client code.
