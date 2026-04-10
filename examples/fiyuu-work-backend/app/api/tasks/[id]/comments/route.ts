import { AuthGuard } from "../../../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../../../guards/workspace.guard.js";
import { TaskService } from "../../../../services/task.service.js";
import { TaskRepository } from "../../../../repositories/task.repository.js";
import { NotificationService } from "../../../../services/notification.service.js";

const taskRepo = new TaskRepository();
const notificationService = new NotificationService();
const taskService = new TaskService(taskRepo, notificationService);

// POST /api/tasks/:id/comments - Add comment
export async function POST(
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
  
  if (!body.content) {
    return Response.json({ error: "Content required" }, { status: 400 });
  }
  
  const comment = await taskService.addComment(
    params.id,
    body.content,
    (request as any).user.id,
    task.workspaceId
  );
  
  return Response.json({ comment }, { status: 201 });
}
