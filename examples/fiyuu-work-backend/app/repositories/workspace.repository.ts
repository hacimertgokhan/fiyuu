import { Repository } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Repository("workspaces")
export class WorkspaceRepository {
  async findBySlug(slug: string) {
    return db.table("workspaces").findOne({ slug });
  }
  
  async findWithMembers(workspaceId: string) {
    const workspace = await db.table("workspaces").findOne({ id: workspaceId });
    if (!workspace) return null;
    
    const members = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar, wm.role, wm.joinedAt
      FROM users u
      JOIN workspace_members wm ON u.id = wm.userId
      WHERE wm.workspaceId = ?
    `, [workspaceId]);
    
    const projects = await db.table("projects").find(
      { workspaceId },
      { sort: { createdAt: "desc" } }
    );
    
    return { ...workspace, members, projects };
  }
  
  async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    const member = await db.table("workspace_members").findOne({
      workspaceId,
      userId,
    });
    return member?.role || null;
  }
  
  async addMember(workspaceId: string, userId: string, role: string = "member") {
    return db.table("workspace_members").insert({
      id: crypto.randomUUID(),
      workspaceId,
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });
  }
  
  async removeMember(workspaceId: string, userId: string) {
    return db.table("workspace_members").delete({ workspaceId, userId });
  }
  
  async updateMemberRole(workspaceId: string, userId: string, role: string) {
    return db.table("workspace_members").update(
      { workspaceId, userId },
      { role }
    );
  }
}
