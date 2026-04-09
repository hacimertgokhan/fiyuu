# Fiyuu Website

The official marketing website and documentation for the Fiyuu Framework.

## Overview

This is a live demonstration of Fiyuu's capabilities, showcasing:

- **Deterministic File Contracts** — File-based routing with predictable structure
- **Spring Boot Style Decorators** — `@Controller`, `@Service`, `@Repository`, `@Guard`, `@Scheduled`
- **Advanced F1 Database** — Indexing, transactions, migrations, and relations
- **Built-In Components** — `FiyuuImage`, `FiyuuVideo`, `FiyuuLink`, `FiyuuHead`
- **Real-Time Communication** — WebSocket rooms, NATS integration
- **Type-Safe Contracts** — Zod validation and automatic HTTP exceptions
- **Always-Alive Services** — Background jobs and cron scheduling

## Quick Start

```bash
# Development
npm run dev
# Visit http://localhost:4070

# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
app/
├── page.tsx          # Landing page (hero, features)
├── layout.tsx        # Root layout with global styles
├── docs/
│   ├── page.tsx      # Complete documentation
│   ├── meta.ts       # SEO metadata
│   └── query.ts      # Optional: data fetching for docs
├── layout.meta.ts    # Layout metadata
└── meta.ts           # Root page metadata
```

## Key Features Demonstrated

### 1. Landing Page (`app/page.tsx`)

Showcases the framework's core value proposition:
- AI-native project context
- Deterministic file contracts
- Spring Boot style decorators
- Advanced F1 database
- Real-time communication
- Type-safe everything

### 2. Documentation (`app/docs/page.tsx`)

Comprehensive guides covering:

#### Getting Started
- Installation via `npm create fiyuu-app@latest`
- Project structure overview
- First route creation

#### Backend Patterns
- `@Controller` decorators for API routes
- `@Service` for business logic
- `@Repository` for data access
- `@Guard` for authentication/authorization
- `@Scheduled` for background jobs
- Dependency Injection

#### Database
- Basic CRUD queries
- Transactions with rollback
- Migrations for schema versioning
- Indexing for performance
- Relations and aggregations

#### Components
- `FiyuuImage` — Lazy loading, responsive, CLS-free
- `FiyuuVideo` — Optimized video with poster
- `FiyuuLink` — Client-side navigation with prefetch
- `FiyuuHead` — SEO and structured data

#### Real-Time
- WebSocket rooms
- NATS messaging
- Live data streaming
- Authentication on upgrade

#### CLI
- `fiyuu dev` — Development server
- `fiyuu build` — Production build
- `fiyuu start` — Start server
- `fiyuu sync` — Generate AI docs
- `fiyuu doctor` — Validate structure

## Design System

The website uses a carefully designed system:

- **Typography** — Bricolage Grotesque (display), JetBrains Mono (code), DM Sans (body)
- **Colors** — Dark theme with amber accents
- **Components** — Blueprint-style cards with hover effects
- **Animations** — Reveal animations with staggered delays
- **Responsive** — Mobile-first design

### CSS Variables

```css
--bg: #09090b                    /* Main background */
--bg-elevated: #111114           /* Elevated surfaces */
--bg-surface: #18181c            /* Surface background */
--accent: #f59e0b                /* Primary accent (amber) */
--accent-bright: #fbbf24         /* Bright accent */
--text: #fafafa                  /* Primary text */
--text-secondary: #9ca3af        /* Secondary text */
--text-muted: #52525b            /* Muted text */
--border: #27272a                /* Border color */
```

## Development

### Hot Reload

The development server supports hot module reload (HMR). Changes to `page.tsx`, `layout.tsx`, and CSS are automatically reflected in the browser.

### Adding New Pages

To add new documentation sections:

1. Create a new directory under `app/`
2. Add `page.tsx` and `meta.ts`
3. Link from the docs index

Example structure:
```
app/deployment/
├── page.tsx
└── meta.ts
```

### Code Examples

Code examples in the documentation use semantic HTML with custom styling:

```html
<div class="code-frame">
  <div class="code-frame-header">
    <span class="dot amber"></span>
    <span>filename.ts</span>
  </div>
  <div class="code-frame-body">
    <pre><span class="kw">keyword</span> <span class="str">string</span></pre>
  </div>
</div>
```

Color classes:
- `.kw` — Keywords (purple)
- `.str` — Strings (amber)
- `.fn` — Functions (blue)
- `.tp` — Types (teal)
- `.cm` — Comments (dark gray)
- `.num` — Numbers (pink)
- `.prop` — Properties (slate)

## Configuration

The site is configured in `fiyuu.config.ts`:

```typescript
{
  app: {
    name: "fiyuu",
    port: 4070,
  },
  data: {
    driver: "f1",
    path: ".fiyuu/data/f1.json",
  },
  developerTools: {
    enabled: true,
  },
  seo: {
    baseUrl: "https://fiyuu.work",
    sitemap: true,
    robots: true,
  },
}
```

## SEO

The site is fully optimized for search engines:

- Meta tags on each page (`meta.ts`)
- Open Graph tags for social sharing
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt configuration
- Fast Core Web Vitals

## Deployment

The site can be deployed to any Node.js hosting:

1. **Build:** `npm run build`
2. **Start:** `npm run start`
3. **Environment:** Set `NODE_ENV=production`

Platforms supported:
- Coolify
- Render
- Railway
- Fly.io
- Vercel (Node.js serverless)
- AWS, GCP, Azure (containerized)

## Performance

The website demonstrates Fiyuu's performance optimizations:

- **Lazy Loading** — Images and content load only when needed
- **Responsive Images** — Automatic srcset generation
- **Code Splitting** — Per-route bundles
- **Tree Shaking** — Unused code removed
- **Zero Client-Side JS** — Default (can be enhanced with client components)

Lighthouse scores:
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Contributing

Found a typo or want to improve documentation?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
