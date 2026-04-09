# create-fiyuu-app

Scaffold a new Fiyuu project with a single command.

## Usage

```bash
npx create-fiyuu-app my-app
cd my-app
npm install
npm run dev
```

## Options

The CLI prompts you to select features:

- **Sockets** - WebSocket real-time communication
- **Database** - F1 DB embedded database
- **Encryption** - Request encryption
- **Skills** - AI skills integration
- **Theming** - Dark/light mode support
- **Auth hints** - Authentication scaffolding

## Project Structure

```
my-app/
  app/
    page.tsx        # Home page
    layout.tsx      # Root layout
    meta.ts         # Route metadata
    query.ts        # Data fetching
    action.ts       # Server mutations
    schema.ts       # Zod schemas
    middleware.ts   # Request middleware
    api/
      health.ts     # API endpoint
  fiyuu.config.ts   # Framework configuration
  package.json
```

## License

MIT
