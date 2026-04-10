import { defineService } from "@fiyuu/runtime";
import { realtime } from "@fiyuu/realtime";
import { db } from "@fiyuu/db";
import { verifyToken } from "../lib/auth.js";

export default defineService({
  name: "websocket-gateway",
  
  start() {
    // Notifications channel
    const notifications = realtime.channel("notifications", {
      async canConnect(request) {
        const token = new URL(request.url).searchParams.get("token");
        const payload = verifyToken(token || "");
        if (!payload) return { allowed: false, reason: "Invalid token" };
        
        const user = await db.table("users").findOne({ id: payload.userId });
        if (!user) return { allowed: false, reason: "User not found" };
        
        return { 
          allowed: true, 
          user: { id: user.id, email: user.email, name: user.name }
        };
      },
    });
    
    // Join user-specific room
    notifications.on("connect", (socket) => {
      socket.join(`user:${socket.user.id}`);
      console.log(`[WS] User ${socket.user.name} connected to notifications`);
    });
    
    notifications.on("disconnect", (socket) => {
      console.log(`[WS] User ${socket.user.name} disconnected`);
    });
    
    // Mark notification as read via WebSocket
    notifications.on("mark-read", async (data, socket) => {
      await db.query(
        "UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?",
        [data.notificationId, socket.user.id]
      );
      
      socket.emit("marked-read", { notificationId: data.notificationId });
    });
    
    // Workspace channel for real-time collaboration
    const workspace = realtime.channel("workspace", {
      async canConnect(request) {
        const token = new URL(request.url).searchParams.get("token");
        const payload = verifyToken(token || "");
        if (!payload) return { allowed: false, reason: "Invalid token" };
        
        return { allowed: true, user: { id: payload.userId } };
      },
    });
    
    workspace.on("join-workspace", async (data, socket) => {
      const { workspaceId } = data;
      
      // Verify membership
      const member = await db.table("workspace_members").findOne({
        workspaceId,
        userId: socket.user.id,
      });
      
      if (!member) {
        socket.emit("error", { message: "Access denied" });
        return;
      }
      
      socket.join(`workspace:${workspaceId}`);
      socket.setPresence({
        userId: socket.user.id,
        workspaceId,
        joinedAt: Date.now(),
      });
      
      // Notify others
      workspace.to(`workspace:${workspaceId}`).emit("user-joined", {
        user: socket.user,
        timestamp: Date.now(),
      });
      
      // Send online users
      const online = await workspace.presence(`workspace:${workspaceId}`);
      socket.emit("online-users", online);
    });
    
    // Task updates
    workspace.on("task-update", (data, socket) => {
      const { workspaceId, task } = data;
      
      // Broadcast to all workspace members
      workspace.to(`workspace:${workspaceId}`).emit("task-updated", {
        task,
        updatedBy: socket.user.id,
        timestamp: Date.now(),
      });
    });
    
    // Typing indicator
    workspace.on("typing", (data, socket) => {
      const { workspaceId, taskId, isTyping } = data;
      
      socket.to(`workspace:${workspaceId}`).emit("user-typing", {
        user: socket.user,
        taskId,
        isTyping,
      });
    });
    
    // Leave workspace
    workspace.on("leave-workspace", (data, socket) => {
      const { workspaceId } = data;
      
      socket.leave(`workspace:${workspaceId}`);
      workspace.to(`workspace:${workspaceId}`).emit("user-left", {
        user: socket.user,
      });
    });
    
    console.log("[WebSocket] Gateways initialized");
  },
});
