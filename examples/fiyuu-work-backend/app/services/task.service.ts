import { Service } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";
import { NotFoundException } from "@fiyuu/core";
import type { TaskRepository } from "../repositories/task.repository.js";
import { NotificationService } from "./notification.service.js";

@Service()
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private notificationService: NotificationService
  ) {}
  
  async create(data: {
    title: string;
    description?: string;
    projectId: string;
    workspaceId: string;
    assigneeId?: string;
    priority?: string;
    dueDate?: string;
  }, createdBy: string) {
    const task = await db.table("tasks").insert({
      id: crypto.randomUUID(),
      ...data,
      status: "todo",
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Notify assignee
    if (data.assigneeId) {
      await this.notificationService.create({
        type: "task_assigned",
        title: "New task assigned",
        message: `You were assigned to: ${data.title}`,
        userId: data.assigneeId,
        workspaceId: data.workspaceId,
        taskId: task.id,
      });
    }
    
    return task;
  }
  
  async getById(taskId: string) {
    const task = await this.taskRepo.findWithDetails(taskId);
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    return task;
  }
  
  async update(taskId: string, data: any, workspaceId: string) {
    const existing = await this.getById(taskId);
    
    await db.table("tasks").update(
      { id: taskId },
      { ...data, updatedAt: new Date().toISOString() }
    );
    
    // If status changed to done, notify creator
    if (data.status === "done" && existing.status !== "done") {
      await this.notificationService.create({
        type: "task_completed",
        title: "Task completed",
        message: `"${existing.title}" has been completed`,
        userId: existing.createdBy,
        workspaceId,
        taskId,
      });
    }
    
    return this.getById(taskId);
  }
  
  async delete(taskId: string) {
    await db.table("tasks").delete({ id: taskId });
    return { success: true };
  }
  
  async listByWorkspace(workspaceId: string, filters: any) {
    return this.taskRepo.findByWorkspace(workspaceId, filters);
  }
  
  async addComment(taskId: string, content: string, authorId: string, workspaceId: string) {
    const comment = await db.table("comments").insert({
      id: crypto.randomUUID(),
      content,
      taskId,
      workspaceId,
      authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Get task for notification
    const task = await this.getById(taskId);
    
    // Notify task creator if not the commenter
    if (task.createdBy !== authorId) {
      await this.notificationService.create({
        type: "comment_added",
        title: "New comment",
        message: `New comment on "${task.title}"`,
        userId: task.createdBy,
        workspaceId,
        taskId,
      });
    }
    
    return comment;
  }
  
  async getStats(workspaceId: string) {
    return this.taskRepo.getTaskStats(workspaceId);
  }
}
