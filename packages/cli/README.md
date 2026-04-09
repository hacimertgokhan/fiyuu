# @fiyuu/cli

Command-line interface for the Fiyuu framework.

## Installation

```bash
npm install -g @fiyuu/cli
# or use via npx
npx @fiyuu/cli dev
```

## Commands

| Command | Description |
|---------|-------------|
| `fiyuu dev` | Start development server with live reload |
| `fiyuu build` | Production build |
| `fiyuu start` | Run production server |
| `fiyuu sync` | Generate project graph and AI docs |
| `fiyuu doctor` | Validate project structure |
| `fiyuu doctor --fix` | Auto-fix common issues |
| `fiyuu graph stats` | Show route statistics |
| `fiyuu graph export` | Export route graph as JSON |
| `fiyuu generate page <name>` | Scaffold a new page |
| `fiyuu generate action <name>` | Scaffold a new action |
| `fiyuu deploy` | Deploy via SSH |

## Quick Start

```bash
# Create a new project
npx create-fiyuu-app my-app
cd my-app

# Start development
npm run dev

# Build for production
npm run build
npm start
```

## Configuration

Create `fiyuu.config.ts` in your project root:

```typescript
import type { FiyuuConfig } from "@fiyuu/core";

const config: FiyuuConfig = {
  app: { name: "My App", port: 4050 },
  data: { driver: "f1" },
  websocket: { enabled: true },
};

export default config;
```

## License

MIT
