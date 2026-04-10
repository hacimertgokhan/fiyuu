import { AuthGuard } from "../../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../../guards/workspace.guard.js";
import { TaskService } from "../../../services/task.service.js";
import { TaskRepository } from "../../../repositories/task.repository.js";
import { NotificationService } from "../../../services/notification.service.js";
import { ActivityService } from "../../../services/activity.service.js";
import { db } from "@fiyuu/db";

const taskRepo = new TaskRepository();
const notificationService = new NotificationService();
const activityService = new ActivityService();
const taskService = new TaskService(taskRepo, notificationService);

// GET /api/tasks/:id - Get task details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const task = await taskService.getById(params.id);
  
  // Verify workspace access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${task.workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  return Response.json({ task });
}

// PATCH /api/tasks/:id - Update task
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const task = await taskService.getById(params.id);
  
  // Verify workspace access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${task.workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  const body = await request.json();
  
  const updated = await taskService.update(
    params.id,
    {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assigneeId: body.assigneeId,
      dueDate: body.dueDate,
    },
    task.workspaceId
  );
  
  return Response.json({ task: updated });
}

// DELETE /api/tasks/:id - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const task = await taskService.getById(params.id);
  
  // Verify workspace access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${task.workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  await taskService.delete(params.id);
  
  return Response.json({ success: true });
}
