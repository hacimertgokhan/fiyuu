# Publishing Fiyuu to npm

Complete guide for publishing Fiyuu packages to the npm registry.

## Prerequisites

1. **npm Account** — Create at [npmjs.com](https://npmjs.com) if you don't have one
2. **Verified Email** — Your npm account email must be verified
3. **Two-Factor Authentication (2FA)** — Recommended for security
4. **Local Setup** — `npm login` configured locally

## Step 1: Verify Login

```bash
npm whoami
# Should output your npm username
```

If not logged in:

```bash
npm login
# Enter your npm credentials when prompted
```

## Step 2: Update Version Numbers

All packages follow semantic versioning and should be updated together.

### Update Root `package.json`

```json
{
  "version": "0.4.0"  // Increment from 0.3.0
}
```

### Update All Package Versions

Update the `version` field in each package:

- `packages/core/package.json`
- `packages/runtime/package.json`
- `packages/cli/package.json`
- `packages/db/package.json`
- `packages/realtime/package.json`
- `packages/create-fiyuu-app/package.json`

### Version Strategy

- **Patch** (0.3.1) — Bug fixes, no API changes
- **Minor** (0.4.0) — New features, backward compatible
- **Major** (1.0.0) — Breaking changes

Current: **0.3.0** → Next: **0.4.0** (new features like decorators)

## Step 3: Build All Packages

The build script handles TypeScript compilation and generates `.js` files from `.ts` sources.

```bash
npm run build:packages
```

This:
1. Compiles TypeScript using `tsconfig.packages.json`
2. Generates `.d.ts` type definitions
3. Creates source maps
4. Outputs to `dist/packages/` directory

Verify the build succeeded with no errors.

## Step 4: Update CHANGELOG

Create entries for each package in `CHANGELOG.md`:

```markdown
## [0.4.0] - 2026-04-09

### Added (Core)
- Spring Boot style decorators (@Controller, @Service, @Repository)
- @Guard and @Scheduled decorators
- Dependency Injection container with singleton scopes
- DTO validation with decorators

### Added (DB)
- IndexManager for hash-based indexes
- Transaction support with snapshot rollback
- Migration runner for schema versioning

### Added (Components)
- FiyuuImage with lazy loading and responsive srcset
- FiyuuVideo with automatic poster
- FiyuuLink with client-side navigation
- FiyuuHead for SEO management

### Fixed
- Package exports now point to compiled .js files
- CLI bin script now runs compiled code
- create-fiyuu-app uses individual @fiyuu/* packages

### Changed
- Improved error pages and CLI messages
- Enhanced WebSocket room management
```

## Step 5: Test Locally

### Test Package Installation

Install from local build:

```bash
# In a test directory
npm install /path/to/fiyuu/packages/core
npm install /path/to/fiyuu/packages/cli
```

Verify imports work:

```javascript
// Node.js REPL
const core = require('@fiyuu/core');
console.log(core); // Should show decorators and components
```

### Test CLI

```bash
npm install -g /path/to/fiyuu/packages/cli
fiyuu --help
fiyuu --version
```

### Test create-fiyuu-app

```bash
npm install /path/to/fiyuu/packages/create-fiyuu-app
npx create-fiyuu-app test-project
cd test-project
npm install
npm run dev
```

## Step 6: Git Commit & Tag

```bash
# Stage all changes
git add .

# Commit with semantic message
git commit -m "chore(release): bump version to 0.4.0

- Add Spring Boot style decorators
- Add F1 DB improvements (indexing, transactions, migrations)
- Add integrated components (Image, Video, Link, Head)
- Add WebSocket room management and NATS integration
- Improve error handling and CLI messages
- Update documentation and examples"

# Tag the release
git tag -a v0.4.0 -m "Release version 0.4.0"

# Push to remote
git push origin main
git push origin v0.4.0
```

## Step 7: Publish Packages

### Publish Core Package

```bash
cd packages/core
npm publish
# Publishes to @fiyuu/core on npm
```

### Publish Other Packages

Repeat for each package in dependency order:

```bash
cd packages/db
npm publish

cd packages/realtime
npm publish

cd packages/runtime
npm publish

cd packages/cli
npm publish

cd packages/create-fiyuu-app
npm publish
```

### Monitor Publishing

After publishing, verify on npm:

```bash
npm view @fiyuu/core versions
npm view @fiyuu/cli version
```

## Step 8: Create GitHub Release

```bash
gh release create v0.4.0 \
  --title "Fiyuu v0.4.0" \
  --notes "Spring Boot Decorators, F1 DB Improvements, Integrated Components"
```

Or create via GitHub web UI:

1. Go to [Releases](https://github.com/hacimertgokhan/fiyuu/releases)
2. Click "Draft a new release"
3. Select tag `v0.4.0`
4. Add release notes
5. Publish

## Step 9: Update Examples

Update all example projects to use new versions:

```bash
# examples/fiyuu-website/package.json
{
  "dependencies": {
    "@fiyuu/cli": "^0.4.0",
    "@fiyuu/core": "^0.4.0",
    "@fiyuu/runtime": "^0.4.0",
    "@fiyuu/db": "^0.4.0",
    "@fiyuu/realtime": "^0.4.0"
  }
}
```

Or use workspace protocol during development:

```json
{
  "dependencies": {
    "@fiyuu/cli": "workspace:*"
  }
}
```

## Step 10: Update Documentation

Update version badges and references:

- `README.md` — Update version badge
- `fiyuu-website/app/layout.tsx` — Update version in navbar
- All `package.json` files — Check they're consistent

## Troubleshooting

### "You must be logged in to publish"

```bash
npm logout
npm login
# Re-enter credentials
```

### "Package already published"

You're trying to publish a version that already exists. Increment the version number.

```bash
# In each package/*/package.json
"version": "0.4.1"  # instead of 0.4.0
```

### "2FA required"

If 2FA is enabled on your account:

```bash
npm login --auth-type legacy
# Or use app-specific password from npm settings
```

### "publishConfig not found"

Verify each `package.json` has:

```json
{
  "publishConfig": {
    "access": "public"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## After Publishing

### Verify Installation

```bash
npm create fiyuu-app@latest test-app
cd test-app
npm install  # Should pull from npm registry
npm run dev
```

### Update Package READMEs

Ensure each package's README.md on npm is clear:

- Installation instructions
- Basic usage examples
- API reference
- Link to main docs

### Announce Release

1. **GitHub Discussions** — Announce in discussions
2. **Social Media** — Tweet about the release
3. **Community** — Post in relevant forums/communities

## Version Checklist

Before publishing v0.4.0 from v0.3.0:

- [ ] All `package.json` files updated to v0.4.0
- [ ] `npm run build:packages` runs without errors
- [ ] Compiled `.js` files exist in `packages/*/dist/`
- [ ] Type definitions (`.d.ts`) generated
- [ ] `CHANGELOG.md` updated with new features
- [ ] `README.md` version badge updated
- [ ] All examples updated to use v0.4.0
- [ ] Local tests pass (`npm test`)
- [ ] Git tag created (`git tag v0.4.0`)
- [ ] GitHub release created
- [ ] All 6 packages published successfully
- [ ] `npm view @fiyuu/core@0.4.0` returns correct info
- [ ] `npm create fiyuu-app@latest` works with new version

## Continuous Integration

Automate publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build:packages
      - run: |
          for dir in packages/*/; do
            cd "$dir"
            npm publish
            cd -
          done
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## References

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
