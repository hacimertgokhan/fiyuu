# @fiyuu/runtime

Server runtime for the Fiyuu framework. Handles HTTP server, routing, rendering, middleware, WebSocket, and background services.

## Installation

```bash
npm install @fiyuu/runtime
```

## Features

- HTTP server with file-based routing
- SSR, CSR, and SSG rendering modes
- Dynamic route matching (`[id]`, `[...slug]`, `[[...optional]]`)
- Middleware pipeline
- WebSocket integration
- Background service management
- esbuild-based client bundling
- Live reload in development
- Developer tools (unified inspector)

## Architecture

```
server.ts          - Main orchestrator
server-router.ts   - Route matching engine
server-loader.ts   - Dynamic module loading & caching
server-renderer.ts - HTML document & status page rendering
server-middleware.ts - Middleware chain
server-websocket.ts - WebSocket setup
service.ts         - Background service lifecycle
bundler.ts         - esbuild client bundling
client-runtime.ts  - Client-side runtime script
```

## Route Matching

Routes are matched in order of specificity:

1. Exact matches first (O(1) lookup)
2. Dynamic segments (`/blog/[id]`)
3. Catch-all routes (`/docs/[...slug]`)
4. Optional catch-all (`/files/[[...path]]`)

## Rendering Modes

Configure per-route in `meta.ts`:

```typescript
export default defineMeta({
  intent: "User List",
  render: "ssr",      // Server-side rendering (default)
  // render: "csr",   // Client-side rendering
  // render: "ssg",   // Static site generation
  // revalidate: 300, // ISR: revalidate every 5 minutes
});
```

## License

MIT
