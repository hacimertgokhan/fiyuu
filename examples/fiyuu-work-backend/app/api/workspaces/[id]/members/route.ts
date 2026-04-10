import { AuthGuard } from "../../../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../../../guards/workspace.guard.js";
import { WorkspaceService } from "../../../../services/workspace.service.js";
import { WorkspaceRepository } from "../../../../repositories/workspace.repository.js";

const workspaceRepo = new WorkspaceRepository();
const workspaceService = new WorkspaceService(workspaceRepo);

// POST /api/workspaces/:id/members - Invite member
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard(["admin"]);
  await wsGuard.canActivate(request);
  
  const body = await request.json();
  
  if (!body.email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }
  
  const result = await workspaceService.inviteMember(
    params.id,
    body.email,
    body.role || "member",
    (request as any).user.id
  );
  
  return Response.json(result);
}

// PATCH /api/workspaces/:id/members/:userId - Update member role
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard(["admin"]);
  await wsGuard.canActivate(request);
  
  const body = await request.json();
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  
  if (!userId || !body.role) {
    return Response.json({ error: "userId and role required" }, { status: 400 });
  }
  
  await workspaceService.updateMemberRole(params.id, userId, body.role);
  
  return Response.json({ success: true });
}

// DELETE /api/workspaces/:id/members - Remove member
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard(["admin"]);
  await wsGuard.canActivate(request);
  
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }
  
  await workspaceService.removeMember(params.id, userId);
  
  return Response.json({ success: true });
}
