import { Service } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";
import { ConflictException, NotFoundException } from "@fiyuu/core";
import type { WorkspaceRepository } from "../repositories/workspace.repository.js";

@Service()
export class WorkspaceService {
  constructor(private workspaceRepo: WorkspaceRepository) {}
  
  async create(name: string, description: string | undefined, ownerId: string) {
    const slug = this.slugify(name);
    
    // Check unique slug
    const existing = await this.workspaceRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException("Workspace name already taken");
    }
    
    // Create workspace with owner as member in transaction
    return db.transaction(async (tx) => {
      const workspace = await tx.table("workspaces").insert({
        id: crypto.randomUUID(),
        name,
        slug,
        description,
        ownerId,
        plan: "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      // Add owner as admin
      await tx.table("workspace_members").insert({
        id: crypto.randomUUID(),
        workspaceId: workspace.id,
        userId: ownerId,
        role: "admin",
        joinedAt: new Date().toISOString(),
      });
      
      return workspace;
    });
  }
  
  async getById(workspaceId: string) {
    const workspace = await this.workspaceRepo.findWithMembers(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }
    return workspace;
  }
  
  async update(workspaceId: string, data: { name?: string; description?: string }) {
    const updateData: any = { ...data, updatedAt: new Date().toISOString() };
    
    if (data.name) {
      updateData.slug = this.slugify(data.name);
    }
    
    await db.table("workspaces").update({ id: workspaceId }, updateData);
    return this.getById(workspaceId);
  }
  
  async inviteMember(workspaceId: string, email: string, role: string, invitedBy: string) {
    // Find user by email
    const user = await db.table("users").findOne({ email });
    
    if (!user) {
      // TODO: Send invitation email
      return { invited: false, message: "User not found, invitation email would be sent" };
    }
    
    // Check if already member
    const existing = await db.table("workspace_members").findOne({
      workspaceId,
      userId: user.id,
    });
    
    if (existing) {
      throw new ConflictException("User is already a member");
    }
    
    // Add member
    await this.workspaceRepo.addMember(workspaceId, user.id, role);
    
    return { invited: true, userId: user.id };
  }
  
  async removeMember(workspaceId: string, userId: string) {
    await this.workspaceRepo.removeMember(workspaceId, userId);
    return { success: true };
  }
  
  async updateMemberRole(workspaceId: string, userId: string, role: string) {
    await this.workspaceRepo.updateMemberRole(workspaceId, userId, role);
    return { success: true };
  }
  
  async delete(workspaceId: string) {
    await db.table("workspaces").delete({ id: workspaceId });
    return { success: true };
  }
  
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      + "-"
      + Date.now().toString(36).slice(-4);
  }
}
