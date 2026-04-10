import { Service } from "@fiyuu/core/decorators";
import { Scheduled } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Service()
export class ActivityService {
  async log(
    action: string,
    entityType: string,
    entityId: string,
    workspaceId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    return db.table("activity_log").insert({
      id: crypto.randomUUID(),
      action,
      entityType,
      entityId,
      workspaceId,
      userId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date().toISOString(),
    });
  }
  
  async getWorkspaceActivity(workspaceId: string, limit: number = 50) {
    return db.query(`
      SELECT 
        al.*,
        u.name as userName,
        u.avatar as userAvatar
      FROM activity_log al
      JOIN users u ON al.userId = u.id
      WHERE al.workspaceId = ?
      ORDER BY al.createdAt DESC
      LIMIT ?
    `, [workspaceId, limit]);
  }
  
  // Scheduled cleanup - runs daily at midnight
  @Scheduled("0 0 * * *")
  async cleanupOldActivity() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db.query(`
      DELETE FROM activity_log
      WHERE createdAt < ?
    `, [thirtyDaysAgo.toISOString()]);
    
    console.log(`[ActivityService] Cleaned up ${result.affectedRows} old activities`);
  }
}

@Service()
export class EmailDigestService {
  @Scheduled("0 9 * * 1")  // Every Monday at 9 AM
  async sendWeeklyDigest() {
    console.log("[EmailDigestService] Sending weekly digests...");
    
    // Get all users with weekly digest preference
    const users = await db.query(`
      SELECT DISTINCT u.id, u.email, u.name
      FROM users u
      JOIN workspace_members wm ON u.id = wm.userId
    `);
    
    for (const user of users) {
      const stats = await this.getWeeklyStats(user.id);
      console.log(`Would send digest to ${user.email}:`, stats);
      // TODO: Send actual email
    }
  }
  
  private async getWeeklyStats(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [tasksAssigned] = await db.query(`
      SELECT COUNT(*) as count FROM tasks
      WHERE assigneeId = ? AND createdAt > ?
    `, [userId, oneWeekAgo.toISOString()]);
    
    const [tasksCompleted] = await db.query(`
      SELECT COUNT(*) as count FROM tasks
      WHERE assigneeId = ? AND status = 'done' AND updatedAt > ?
    `, [userId, oneWeekAgo.toISOString()]);
    
    const [comments] = await db.query(`
      SELECT COUNT(*) as count FROM comments
      WHERE authorId = ? AND createdAt > ?
    `, [userId, oneWeekAgo.toISOString()]);
    
    return {
      tasksAssigned: tasksAssigned?.count || 0,
      tasksCompleted: tasksCompleted?.count || 0,
      comments: comments?.count || 0,
    };
  }
}
