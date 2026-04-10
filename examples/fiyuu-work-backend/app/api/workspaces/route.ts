import { AuthGuard } from "../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../guards/workspace.guard.js";
import { WorkspaceService } from "../../services/workspace.service.js";
import { WorkspaceRepository } from "../../repositories/workspace.repository.js";
import { ActivityService } from "../../services/activity.service.js";
import { BadRequestException, NotFoundException } from "@fiyuu/core";

// Services
const workspaceRepo = new WorkspaceRepository();
const workspaceService = new WorkspaceService(workspaceRepo);
const activityService = new ActivityService();

// GET /api/workspaces - List user's workspaces
export async function GET(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  
  const workspaces = await workspaceRepo.findWithWorkspaces(userId);
  
  return Response.json({ workspaces: workspaces?.workspaces || [] });
}

// POST /api/workspaces - Create workspace
export async function POST(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const body = await request.json();
  
  if (!body.name) {
    throw new BadRequestException("Name is required");
  }
  
  const workspace = await workspaceService.create(
    body.name,
    body.description,
    userId
  );
  
  // Log activity
  await activityService.log(
    "workspace_created",
    "workspace",
    workspace.id,
    workspace.id,
    userId
  );
  
  return Response.json({ workspace }, { status: 201 });
}
