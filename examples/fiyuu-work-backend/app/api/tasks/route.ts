import { AuthGuard } from "../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../guards/workspace.guard.js";
import { TaskService } from "../../services/task.service.js";
import { TaskRepository } from "../../repositories/task.repository.js";
import { NotificationService } from "../../services/notification.service.js";
import { ActivityService } from "../../services/activity.service.js";
import { BadRequestException } from "@fiyuu/core";

const taskRepo = new TaskRepository();
const notificationService = new NotificationService();
const activityService = new ActivityService();
const taskService = new TaskService(taskRepo, notificationService);

// GET /api/tasks?workspaceId=xxx - List tasks
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
  
  const filters = {
    status: searchParams.get("status") || undefined,
    assigneeId: searchParams.get("assigneeId") || undefined,
    projectId: searchParams.get("projectId") || undefined,
  };
  
  const tasks = await taskService.listByWorkspace(workspaceId, filters);
  const stats = await taskService.getStats(workspaceId);
  
  return Response.json({ tasks, stats });
}

// POST /api/tasks - Create task
export async function POST(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const body = await request.json();
  
  if (!body.workspaceId || !body.projectId || !body.title) {
    throw new BadRequestException("workspaceId, projectId, and title required");
  }
  
  // Verify access
  const wsGuard = new WorkspaceGuard();
  const modifiedRequest = new Request(`http://localhost/workspaces/${body.workspaceId}`, {
    headers: request.headers,
  });
  await wsGuard.canActivate(modifiedRequest);
  
  const task = await taskService.create(
    {
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      workspaceId: body.workspaceId,
      assigneeId: body.assigneeId,
      priority: body.priority,
      dueDate: body.dueDate,
    },
    (request as any).user.id
  );
  
  // Log activity
  await activityService.log(
    "task_created",
    "task",
    task.id,
    body.workspaceId,
    (request as any).user.id,
    { title: body.title }
  );
  
  return Response.json({ task }, { status: 201 });
}
