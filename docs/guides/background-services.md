# Background Services Guide

Run scheduled tasks, workers, and long-running processes.

## Overview

Background services run continuously, not per-request:
- Cron jobs
- Data processing
- External sync
- Cleanup tasks

## Creating a Service

```typescript
// app/services/email.service.ts
import { defineService } from "@fiyuu/runtime";
import { db } from "@fiyuu/db";

export default defineService({
  name: "email",
  
  async start({ log }) {
    log("info", "Email service started");
    
    // Start processing loop
    this.interval = setInterval(async () => {
      await this.processQueue();
    }, 5000);
  },
  
  async stop({ log }) {
    log("info", "Email service stopping");
    clearInterval(this.interval);
  },
  
  async processQueue() {
    const pending = await db.query(
      "SELECT * FROM emails WHERE sent = 0 LIMIT 10"
    );
    
    for (const email of pending) {
      await this.sendEmail(email);
      await db.query("UPDATE emails SET sent = 1 WHERE id = ?", [email.id]);
    }
  },
  
  async sendEmail(email: any) {
    // Send email logic
    console.log(`Sending email to ${email.to}`);
  },
});
```

## Scheduled Tasks (Cron)

```typescript
// app/services/scheduler.service.ts
import { defineService } from "@fiyuu/runtime";
import { Scheduled } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Service()
class SchedulerService {
  
  // Every minute
  @Scheduled("* * * * *")
  async cleanupSessions() {
    await db.query(
      "DELETE FROM sessions WHERE expires_at < datetime('now')"
    );
  }
  
  // Every hour
  @Scheduled("0 * * * *")
  async generateReports() {
    const stats = await this.calculateStats();
    await db.table("reports").insert({
      id: crypto.randomUUID(),
      data: JSON.stringify(stats),
      createdAt: new Date().toISOString(),
    });
  }
  
  // Daily at midnight
  @Scheduled("0 0 * * *")
  async dailyBackup() {
    console.log("Running daily backup...");
    // Backup logic
  }
  
  // Every 30 seconds
  @Scheduled("*/30 * * * * *")
  async healthCheck() {
    // Check external services
  }
}

export default defineService({
  name: "scheduler",
  start() {
    // Service started, decorators handle scheduling
  },
});
```

## Service Lifecycle

```typescript
import { defineService } from "@fiyuu/runtime";

export default defineService({
  name: "worker",
  
  // Called when server starts
  async start({ db, realtime, log }) {
    log("info", `${this.name} starting`);
    
    // Initialize resources
    this.queue = [];
    this.running = true;
    
    // Start worker loop
    this.loop();
  },
  
  // Called when server stops
  async stop({ log }) {
    log("info", `${this.name} stopping`);
    
    // Cleanup
    this.running = false;
    
    // Wait for current job
    if (this.currentJob) {
      await this.currentJob;
    }
  },
  
  async loop() {
    while (this.running) {
      try {
        this.currentJob = this.processNext();
        await this.currentJob;
      } catch (error) {
        console.error("Worker error:", error);
      }
      
      // Backoff on empty
      await sleep(1000);
    }
  },
  
  async processNext() {
    const job = this.queue.shift();
    if (!job) return;
    
    // Process job
  },
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Real-Time with Services

```typescript
// app/services/notification.service.ts
import { defineService } from "@fiyuu/runtime";
import { realtime } from "@fiyuu/realtime";

export default defineService({
  name: "notifications",
  
  start() {
    const channel = realtime.channel("notifications");
    
    channel.on("subscribe", async (data, socket) => {
      // User subscribed to notifications
      socket.join(`user:${socket.user.id}`);
    });
  },
  
  // Method called from other services
  async sendToUser(userId: string, notification: any) {
    const channel = realtime.channel("notifications");
    channel.to(`user:${userId}`).emit("notification", notification);
    
    // Also persist to DB
    await db.table("notifications").insert({
      userId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    });
  },
});
```

## Cron Syntax Reference

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─── Second (0-59)
│ │ │ │ └───── Minute (0-59)
│ │ │ └─────── Hour (0-23)
│ │ └───────── Day of month (1-31)
│ └─────────── Month (1-12)
└───────────── Day of week (0-7, 0=Sunday)

Examples:
"*/5 * * * *"     → Every 5 minutes
"0 */6 * * *"     → Every 6 hours
"0 9 * * 1"       → Monday 9 AM
"0 0 1 * *"       → First day of month
"0 0 * * 0"       → Every Sunday
"*/30 * * * * *"  → Every 30 seconds
```

## Best Practices

1. **Handle errors** - Don't let crashes stop the service
2. **Use transactions** - For database operations
3. **Implement stop()** - Clean shutdown
4. **Log everything** - For debugging
5. **Rate limiting** - Don't overwhelm external APIs
6. **Idempotency** - Jobs should be safe to retry
