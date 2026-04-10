import { Repository } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Repository("tasks")
export class TaskRepository {
  async findWithDetails(taskId: string) {
    const [task] = await db.query(`
      SELECT 
        t.*,
        creator.name as creatorName,
        assignee.name as assigneeName,
        assignee.avatar as assigneeAvatar,
        p.name as projectName
      FROM tasks t
      JOIN users creator ON t.createdBy = creator.id
      LEFT JOIN users assignee ON t.assigneeId = assignee.id
      JOIN projects p ON t.projectId = p.id
      WHERE t.id = ?
    `, [taskId]);
    
    if (!task) return null;
    
    // Get comments
    const comments = await db.query(`
      SELECT c.*, u.name as authorName, u.avatar as authorAvatar
      FROM comments c
      JOIN users u ON c.authorId = u.id
      WHERE c.taskId = ?
      ORDER BY c.createdAt ASC
    `, [taskId]);
    
    return { ...task, comments };
  }
  
  async findByWorkspace(workspaceId: string, filters: any = {}) {
    let sql = `
      SELECT 
        t.*,
        assignee.name as assigneeName,
        assignee.avatar as assigneeAvatar,
        p.name as projectName
      FROM tasks t
      LEFT JOIN users assignee ON t.assigneeId = assignee.id
      JOIN projects p ON t.projectId = p.id
      WHERE t.workspaceId = ?
    `;
    const params: any[] = [workspaceId];
    
    if (filters.status) {
      sql += " AND t.status = ?";
      params.push(filters.status);
    }
    
    if (filters.assigneeId) {
      sql += " AND t.assigneeId = ?";
      params.push(filters.assigneeId);
    }
    
    if (filters.projectId) {
      sql += " AND t.projectId = ?";
      params.push(filters.projectId);
    }
    
    sql += " ORDER BY t.createdAt DESC";
    
    return db.query(sql, params);
  }
  
  async getTaskStats(workspaceId: string) {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks
      WHERE workspaceId = ?
    `, [workspaceId]);
    
    return stats;
  }
}
