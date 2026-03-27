# my-app

Generated with create-fiyuu-app.

## Commands

- npm run dev
- npm run build
- npm run start
- npx fiyuu feat list
- npx fiyuu feat socket on|off

## Starter Routes

- / -> Fiyuu one-page home
- /live -> websocket-powered live counter example
- /requests -> F1-backed global request list example
- /auth -> F1-backed auth starter example
- /api/health -> app router backend endpoint
- server/f1 -> lightweight F1 data layer scaffold
- .fiyuu/data/f1.json -> persistent lightweight database file
- server/socket.ts -> realtime server scaffold
- server/crypto.ts and lib/client-crypto.ts -> request protection helpers
- skills/ -> AI prompts for product and support workflows
- built-in light/dark theme toggle with localStorage persistence

## Notes

- Folder-based routing lives directly under app/
- This starter ships with only the root page by default
- Root and nested layouts are supported with app/layout.tsx and layout.meta.ts
- Custom fallback views can be edited at app/not-found.tsx and app/error.tsx
- Backend route handlers live under app/api/**/route.ts
- Middleware is optional and can be added later under app/middleware.ts
- Optional features can be toggled later with fiyuu feat ...
- Runtime environment lives in .fiyuu/env and .fiyuu/SECRET
- AI-readable markdown docs live in .fiyuu/PROJECT.md, .fiyuu/PATHS.md, .fiyuu/STATES.md, and .fiyuu/FEATURES.md
- Client-visible transport obfuscation reduces readability, but absolute secrecy still requires server-only keys and HTTPS
- UI layer is Gea-first (@geajs/core) with compile-time JSX output
