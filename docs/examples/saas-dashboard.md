# Example: SaaS Dashboard

Multi-tenant SaaS with workspaces, teams, and billing.

## Structure

```
app/api/
├── workspaces/
│   ├── route.ts           # CRUD workspaces
│   └── [id]/
│       ├── members/route.ts    # Member management
│       └── invite/route.ts     # Invitations
├── projects/
│   └── route.ts           # Workspace projects
└── billing/
    └── route.ts           # Subscriptions
```

## Workspaces

```typescript
// app/api/workspaces/route.ts
export async function POST(request: Request) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  const { name } = await request.json();
  const slug = slugify(name);
  
  // Check unique slug
  const existing = await db.table("workspaces").findOne({ slug });
  if (existing) {
    throw new ConflictException("Workspace name taken");
  }
  
  const workspace = await db.transaction(async (tx) => {
    const ws = await tx.table("workspaces").insert({
      id: crypto.randomUUID(),
      name,
      slug,
      ownerId: userId,
      createdAt: new Date().toISOString(),
    });
    
    // Add creator as admin
    await tx.table("workspace_members").insert({
      id: crypto.randomUUID(),
      workspaceId: ws.id,
      userId,
      role: "admin",
      joinedAt: new Date().toISOString(),
    });
    
    return ws;
  });
  
  return Response.json(workspace, { status: 201 });
}

// GET /api/workspaces - list user's workspaces
export async function GET(request: Request) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  const workspaces = await db.query(`
    SELECT w.*, wm.role
    FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspaceId
    WHERE wm.userId = ?
  `, [userId]);
  
  return Response.json({ workspaces });
}
```

## Members

```typescript
// app/api/workspaces/[id]/members/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  // Check admin permission
  const membership = await db.table("workspace_members").findOne({
    workspaceId: params.id,
    userId,
  });
  
  if (!membership || membership.role !== "admin") {
    throw new ForbiddenException("Admin required");
  }
  
  const { email, role } = await request.json();
  
  // Find user by email
  const user = await db.table("users").findOne({ email });
  
  if (!user) {
    // Send invitation email
    await sendInvitation(email, params.id);
    return Response.json({ invited: true });
  }
  
  // Add member
  await db.table("workspace_members").insert({
    id: crypto.randomUUID(),
    workspaceId: params.id,
    userId: user.id,
    role,
    joinedAt: new Date().toISOString(),
  });
  
  return Response.json({ success: true });
}
```

## Multi-tenant Queries

```typescript
// Middleware to check workspace access
async function requireWorkspaceAccess(request: Request, workspaceId: string) {
  const userId = (request as any).user.id;
  
  const member = await db.table("workspace_members").findOne({
    workspaceId,
    userId,
  });
  
  if (!member) {
    throw new ForbiddenException("Access denied");
  }
  
  return member;
}

// Use in routes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await new AuthGuard().canActivate(request);
  await requireWorkspaceAccess(request, params.id);
  
  const projects = await db.table("projects").find({
    workspaceId: params.id,
  });
  
  return Response.json({ projects });
}
```

## Features

- Multi-workspace support
- Role-based access (admin, member, viewer)
- Email invitations
- Project isolation by workspace
- Billing per workspace
