# Installation

Get Fiyuu up and running on your machine in minutes.

## Requirements

- **Node.js**: 18.x or higher (20.x recommended)
- **npm**: 8.x or higher (or pnpm/yarn)
- **OS**: macOS, Linux, or Windows (WSL recommended)

## Quick Install

Create a new Fiyuu project with a single command:

```bash
npm create fiyuu-app@latest my-app
```

You'll be prompted to:
1. Choose a project name
2. Select features (database, realtime, auth, etc.)
3. Select skills (SEO, analytics, etc.)

Then navigate and install:

```bash
cd my-app
npm install
npm run dev
```

Your app is live at `http://localhost:4050`.

## Manual Setup

If you prefer to set up manually:

### 1. Create Project Directory

```bash
mkdir my-app
cd my-app
npm init -y
```

### 2. Install Dependencies

```bash
npm install @fiyuu/cli @fiyuu/core @fiyuu/runtime @fiyuu/db @fiyuu/realtime
npm install -D typescript @types/node
```

### 3. Create Configuration

**fiyuu.config.ts**:
```typescript
import { defineConfig } from "@fiyuu/core";

export default defineConfig({
  app: {
    port: 4050,
    host: "0.0.0.0",
  },
  seo: {
    baseUrl: "http://localhost:4050",
    sitemap: true,
    robots: true,
  },
});
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "jsxImportSource": "@geajs/core",
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["app/**/*", "*.ts"],
  "exclude": ["node_modules", ".fiyuu", "dist"]
}
```

### 4. Create Basic Structure

```bash
mkdir -p app/api/health
```

**app/page.tsx**:
```typescript
import { Component } from "@geajs/core";
import { html, type PageProps } from "@fiyuu/core/client";

export default class HomePage extends Component<PageProps> {
  template() {
    return html`<h1>Hello Fiyuu!</h1>`;
  }
}
```

**app/meta.ts**:
```typescript
import { defineMeta } from "@fiyuu/core/client";

export default defineMeta({
  intent: "Home page",
  seo: {
    title: "My Fiyuu App",
    description: "Built with Fiyuu framework",
  },
});
```

**app/api/health/route.ts**:
```typescript
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

### 5. Start Development

```bash
npx fiyuu dev
```

## Using pnpm or Yarn

### pnpm
```bash
pnpm create fiyuu-app@latest my-app
cd my-app
pnpm install
pnpm dev
```

### Yarn
```bash
yarn create fiyuu-app@latest my-app
cd my-app
yarn install
yarn dev
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4050
lsof -i :4050

# Kill the process or use different port
npm run dev -- --port 3000
```

### Node Version Issues

```bash
# Check Node version
node --version  # Should be 18.x or higher

# Use nvm to switch versions
nvm install 20
nvm use 20
```

### Module Not Found Errors

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install

# For TypeScript module resolution issues
npx tsc --noEmit
```

### Permission Errors (Linux/macOS)

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Windows-Specific Issues

**Path too long error:**
```powershell
# Enable long paths in Windows
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

**Script execution policy:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## IDE Setup

### VS Code

Recommended extensions:
- **TypeScript Importer** - Auto-imports
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - If using Tailwind

**settings.json**:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### WebStorm

1. Enable TypeScript support
2. Configure ESLint in Preferences > Languages & Frameworks > JavaScript > Code Quality Tools
3. Set Prettier as default formatter

## Next Steps

- Read about [Project Structure](./project-structure.md)
- Build your [First Application](./first-app.md)
- Learn about [File Contracts](../core-concepts/file-contracts.md)
