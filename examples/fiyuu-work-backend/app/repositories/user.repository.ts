import { Repository } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Repository("users")
export class UserRepository {
  async findByEmail(email: string) {
    return db.table("users").findOne({ email });
  }
  
  async findWithWorkspaces(userId: string) {
    const user = await db.table("users").findOne({ id: userId });
    if (!user) return null;
    
    const workspaces = await db.query(`
      SELECT w.*, wm.role
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspaceId
      WHERE wm.userId = ?
      ORDER BY w.createdAt DESC
    `, [userId]);
    
    return { ...user, workspaces };
  }
  
  async search(query: string, limit: number = 20) {
    return db.query(`
      SELECT id, name, email, avatar
      FROM users
      WHERE name LIKE ? OR email LIKE ?
      LIMIT ?
    `, [`%${query}%`, `%${query}%`, limit]);
  }
}
