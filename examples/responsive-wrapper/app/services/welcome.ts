import { defineService } from "@fiyuu/runtime";

/**
 * Welcome Notification Service
 * Sends a welcome notification when a new user subscribes.
 */
export default defineService({
  name: "onepage-welcome",

  async start({ realtime, db, log }) {
    const channel = realtime.channel("responsive-wrapper-notifs");

    // Check for new subscribers every 30 seconds and send welcome
    let lastChecked = Date.now();

    setInterval(() => {
      const newSubs = db.table("newsletter").find({}) as unknown as Array<{
        email: string; subscribedAt: number; active: boolean;
      }>;

      const recent = newSubs.filter((s) => s.subscribedAt > lastChecked);
      if (recent.length > 0) {
        lastChecked = Date.now();
        channel.broadcast("welcome", {
          message: `${recent.length} yeni abone katıldı! Toplam: ${newSubs.length}`,
          ts: Date.now(),
        });
        log("info", "new-subscribers", { count: recent.length });
      }
    }, 30000);

    log("info", "responsive-wrapper-service-ready");
  },

  async stop({ log }) {
    log("info", "responsive-wrapper-service-stopped");
  },
});
