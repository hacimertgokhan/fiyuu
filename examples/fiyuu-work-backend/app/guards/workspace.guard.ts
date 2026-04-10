import { Guard, CanActivate } from "@fiyuu/core/decorators";
import { ForbiddenException, UnauthorizedException } from "@fiyuu/core";
import { db } from "@fiyuu/db";

interface WorkspaceAccess {
  role: string;
  workspaceId: string;
}

@Guard()
export class WorkspaceGuard implements CanActivate {
  constructor(private allowedRoles: string[] = ["admin", "member", "viewer"]) {}
  
  async canActivate(request: Request): Promise<boolean> {
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }
    
    // Extract workspace ID from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/workspaces\/([^\/]+)/);
    const workspaceId = match?.[1];
    
    if (!workspaceId) {
      throw new ForbiddenException("Workspace ID not found");
    }
    
    // Check membership
    const membership = await db.table("workspace_members").findOne({
      workspaceId,
      userId: user.id,
    });
    
    if (!membership) {
      throw new ForbiddenException("Access denied to workspace");
    }
    
    if (!this.allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(`Required role: ${this.allowedRoles.join(", ")}`);
    }
    
    // Attach workspace access to request
    (request as any).workspace = {
      id: workspaceId,
      role: membership.role,
    };
    
    return true;
  }
}

// Predefined guards
export const WorkspaceAdminGuard = new WorkspaceGuard(["admin"]);
export const WorkspaceMemberGuard = new WorkspaceGuard(["admin", "member"]);
export const WorkspaceViewerGuard = new WorkspaceGuard(["admin", "member", "viewer"]);
