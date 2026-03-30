import { defineService } from "@fiyuu/runtime";

/**
 * Notification Service
 * Listens for events and broadcasts notifications to all connected clients.
 * Runs continuously in the background as part of the always-live app.
 */
export default defineService({
  name: "blog-notifications",

  async start({ realtime, db, log }) {
    const notifications = realtime.channel("notifications");

    // Listen for new comments
    notifications.on("new-comment", async (payload) => {
      const data = payload as { postSlug: string; author: string };
      log("info", "new-comment", { postSlug: data.postSlug, author: data.author });

      // Save notification to DB
      db.table("notifications").insert({
        type: "comment",
        message: `${data.author} yorum yaptı`,
        postSlug: data.postSlug,
        read: false,
        createdAt: Date.now(),
      });

      // Broadcast to all connected clients
      notifications.broadcast("push", {
        type: "comment",
        message: `${data.author} yorum yaptı`,
        postSlug: data.postSlug,
        ts: Date.now(),
      });
    });

    // Periodic stats broadcast (every 30 seconds)
    setInterval(() => {
      const stats = {
        online: realtime.stats().wsConnections,
        ts: Date.now(),
      };
      notifications.broadcast("stats", stats);
    }, 30000);

    log("info", "notification-service-ready", {
      channels: realtime.listChannels(),
      wsConnections: realtime.stats().wsConnections,
    });
  },

  async stop({ log }) {
    log("info", "notification-service-stopped");
  },
});
