# Fiyuu Work Backend

A full-featured Task Management SaaS backend demonstrating all Fiyuu framework capabilities.

## Features Demonstrated

- ✅ **Authentication**: JWT-based auth with bcrypt password hashing
- ✅ **Authorization**: Role-based access control (@Guard decorators)
- ✅ **Multi-tenancy**: Workspace-based isolation
- ✅ **CRUD Operations**: Full REST API with validation
- ✅ **F1 Database**: Transactions, indexes, migrations
- ✅ **Real-time**: WebSocket channels with presence
- ✅ **Background Services**: @Scheduled cron jobs
- ✅ **File Uploads**: Multipart handling
- ✅ **DTO Validation**: Type-safe input validation
- ✅ **Dependency Injection**: @Service, @Repository pattern

## Quick Start

```bash
# Install dependencies
npm install

# Run database migrations
npm run sync

# Start development server
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth` - Register/Login
- `GET /api/auth/me` - Current user
- `PATCH /api/auth/me` - Update profile

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace
- `PATCH /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Members
- `POST /api/workspaces/:id/members` - Invite member
- `PATCH /api/workspaces/:id/members` - Update role
- `DELETE /api/workspaces/:id/members` - Remove member

### Projects
- `GET /api/projects?workspaceId=xxx` - List projects
- `POST /api/projects` - Create project

### Tasks
- `GET /api/tasks?workspaceId=xxx` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `POST /api/tasks/:id/comments` - Add comment

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Mark as read

### Uploads
- `POST /api/uploads` - Upload file

## WebSocket

Connect to `ws://localhost:4051/notifications?token=JWT`

Events:
- `join-workspace` - Join workspace room
- `typing` - Typing indicator
- `task-update` - Real-time task updates
- `notification` - New notification

## Project Structure

```
app/
├── api/
│   ├── auth/route.ts           # Auth endpoints
│   ├── workspaces/             # Workspace CRUD
│   ├── projects/route.ts       # Project endpoints
│   ├── tasks/                  # Task endpoints
│   ├── notifications/route.ts  # Notification endpoints
│   └── uploads/route.ts        # File upload
├── services/                   # Business logic (@Service)
├── repositories/               # Data access (@Repository)
├── guards/                     # Auth guards (@Guard)
├── dto/                        # Validation DTOs
├── websocket/                  # WebSocket handlers
└── database/migrations/        # DB schema
```

## Environment Variables

```env
JWT_SECRET=your-secret-key
PORT=4050
NODE_ENV=development
```

## Testing

```bash
# Register
curl -X POST http://localhost:4050/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"register","name":"John","email":"john@test.com","password":"password"}'

# Create workspace
curl -X POST http://localhost:4050/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"My Workspace"}'
```

## Architecture

- **Controllers**: Handle HTTP requests (@Controller)
- **Services**: Business logic (@Service)
- **Repositories**: Data access (@Repository)
- **Guards**: Authorization (@Guard)
- **DTOs**: Input validation

## License

MIT
