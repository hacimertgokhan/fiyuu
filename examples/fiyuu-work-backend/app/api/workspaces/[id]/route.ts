import { AuthGuard } from "../../../guards/auth.guard.js";
import { WorkspaceGuard, WorkspaceAdminGuard } from "../../../guards/workspace.guard.js";
import { WorkspaceService } from "../../../services/workspace.service.js";
import { WorkspaceRepository } from "../../../repositories/workspace.repository.js";

const workspaceRepo = new WorkspaceRepository();
const workspaceService = new WorkspaceService(workspaceRepo);

// GET /api/workspaces/:id - Get workspace details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard();
  await wsGuard.canActivate(request);
  
  const workspace = await workspaceService.getById(params.id);
  
  return Response.json({ workspace });
}

// PATCH /api/workspaces/:id - Update workspace
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard(["admin"]);
  await wsGuard.canActivate(request);
  
  const body = await request.json();
  
  const workspace = await workspaceService.update(params.id, {
    name: body.name,
    description: body.description,
  });
  
  return Response.json({ workspace });
}

// DELETE /api/workspaces/:id - Delete workspace
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const wsGuard = new WorkspaceGuard(["admin"]);
  await wsGuard.canActivate(request);
  
  await workspaceService.delete(params.id);
  
  return Response.json({ success: true });
}
