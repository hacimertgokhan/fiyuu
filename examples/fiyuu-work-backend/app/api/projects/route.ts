import { AuthGuard } from "../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../guards/workspace.guard.js";
import { db } from "@fiyuu/db";
import { BadRequestException } from "@fiyuu/core";

// GET /api/projects?workspaceId=xxx - List projects
export async function GET(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  
  if (!workspaceId) {
    throw new BadRequestException("workspaceId required");
  }
  
  // Verify access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  const projects = await db.table("projects").find(
    { workspaceId },
    { sort: { createdAt: "desc" } }
  );
  
  return Response.json({ projects });
}

// POST /api/projects - Create project
export async function POST(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const body = await request.json();
  
  if (!body.workspaceId || !body.name) {
    throw new BadRequestException("workspaceId and name required");
  }
  
  // Verify access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${body.workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  const project = await db.table("projects").insert({
    id: crypto.randomUUID(),
    name: body.name,
    description: body.description,
    status: "active",
    workspaceId: body.workspaceId,
    createdBy: (request as any).user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  return Response.json({ project }, { status: 201 });
}
