import { Service } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";
import { realtime } from "@fiyuu/realtime";

interface CreateNotificationData {
  type: "task_assigned" | "task_completed" | "comment_added" | "mention";
  title: string;
  message?: string;
  userId: string;
  workspaceId?: string;
  taskId?: string;
}

@Service()
export class NotificationService {
  async create(data: CreateNotificationData) {
    const notification = await db.table("notifications").insert({
      id: crypto.randomUUID(),
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    // Send real-time notification
    const channel = realtime.channel("notifications");
    channel.to(`user:${data.userId}`).emit("notification", notification);
    
    return notification;
  }
  
  async getUnread(userId: string) {
    return db.table("notifications").find(
      { userId, read: false },
      { sort: { createdAt: "desc" } }
    );
  }
  
  async getAll(userId: string, limit: number = 50) {
    return db.query(`
      SELECT * FROM notifications
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `, [userId, limit]);
  }
  
  async markAsRead(notificationId: string, userId: string) {
    await db.query(`
      UPDATE notifications SET read = 1
      WHERE id = ? AND userId = ?
    `, [notificationId, userId]);
    
    return { success: true };
  }
  
  async markAllAsRead(userId: string) {
    await db.query(`
      UPDATE notifications SET read = 1
      WHERE userId = ? AND read = 0
    `, [userId]);
    
    return { success: true };
  }
  
  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE userId = ? AND read = 0
    `, [userId]);
    
    return result?.count || 0;
  }
}
