import { AuthGuard } from "../../guards/auth.guard.js";
import { NotificationService } from "../../services/notification.service.js";

const notificationService = new NotificationService();

// GET /api/notifications - Get user notifications
export async function GET(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const { searchParams } = new URL(request.url);
  
  const unreadOnly = searchParams.get("unread") === "true";
  
  if (unreadOnly) {
    const notifications = await notificationService.getUnread(userId);
    const count = await notificationService.getUnreadCount(userId);
    return Response.json({ notifications, count });
  }
  
  const notifications = await notificationService.getAll(userId);
  return Response.json({ notifications });
}

// POST /api/notifications/:id/read - Mark as read
export async function POST(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const body = await request.json();
  
  if (body.action === "markAllRead") {
    await notificationService.markAllAsRead(userId);
    return Response.json({ success: true });
  }
  
  if (body.notificationId) {
    await notificationService.markAsRead(body.notificationId, userId);
    return Response.json({ success: true });
  }
  
  return Response.json({ error: "Invalid action" }, { status: 400 });
}
