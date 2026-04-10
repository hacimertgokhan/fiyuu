# Fiyuu Realtime Skill

## Overview

Fiyuu, WebSocket tabanlı, oda (room) sistemi ile çalışan, auth destekli real-time communication sunar.

## Quick Start

```typescript
// Server-side: Room definition
import { defineRoom } from "@fiyuu/realtime";

export default defineRoom({
  name: "chat",
  
  // Auth on connection
  onAuth: async (token) => {
    const user = await verifyToken(token);
    return { userId: user.id, name: user.name };
  },
  
  // Handle messages
  onMessage: async (ctx, message) => {
    // Broadcast to all in room
    ctx.broadcast({
      type: "chat",
      from: ctx.auth.name,
      text: message.text,
      time: Date.now(),
    });
  },
  
  // On user join
  onJoin: async (ctx) => {
    ctx.broadcast({
      type: "system",
      text: `${ctx.auth.name} joined`,
    });
  },
});
```

## Client Connection

```typescript
// Browser/client
import { connect } from "@fiyuu/realtime/client";

const ws = connect("ws://localhost:3000/rooms/chat", {
  token: "jwt-token",
});

ws.on("open", () => {
  ws.send({ type: "chat", text: "Hello!" });
});

ws.on("message", (msg) => {
  console.log(msg.from + ": " + msg.text);
});
```

## Room Types

### Global Room

```typescript
export default defineRoom({
  name: "notifications",
  type: "global", // Tüm kullanıcılar
  
  onMessage: async (ctx, msg) => {
    // Admin only broadcast
    if (ctx.auth.role !== "admin") return;
    ctx.broadcast(msg);
  },
});
```

### Private Room

```typescript
export default defineRoom({
  name: "dm",
  type: "private", // İki kullanıcı arası
  
  // Room ID: dm:user1:user2
  getRoomId: (ctx) => {
    const ids = [ctx.auth.userId, ctx.params.userId].sort();
    return `dm:${ids[0]}:${ids[1]}`;
  },
});
```

### Dynamic Room

```typescript
export default defineRoom({
  name: "project",
  type: "dynamic", // /rooms/project/:projectId
  
  onAuth: async (token, params) => {
    const user = await verifyToken(token);
    const hasAccess = await checkProjectAccess(user.id, params.projectId);
    if (!hasAccess) throw new Error("Access denied");
    return user;
  },
});
```

## Message Patterns

### Request/Response

```typescript
// Server
export default defineRoom({
  name: "api",
  onMessage: async (ctx, msg) => {
    if (msg.type === "getUser") {
      const user = await db.users.find(msg.userId);
      // Reply to sender only
      ctx.reply({ type: "user", data: user });
    }
  },
});

// Client
ws.send({ type: "getUser", userId: "123" });
ws.on("message", (msg) => {
  if (msg.type === "user") {
    console.log(msg.data);
  }
});
```

### Presence (Online Status)

```typescript
export default defineRoom({
  name: "presence",
  
  onJoin: async (ctx) => {
    // Add to presence list
    await db.presence.set(ctx.auth.userId, { online: true, joinedAt: Date.now() });
    
    // Broadcast updated list
    const online = await db.presence.getAll();
    ctx.broadcast({ type: "presence", users: online });
  },
  
  onLeave: async (ctx) => {
    await db.presence.remove(ctx.auth.userId);
    const online = await db.presence.getAll();
    ctx.broadcast({ type: "presence", users: online });
  },
});
```

## Advanced Features

### Message History

```typescript
export default defineRoom({
  name: "chat",
  
  onJoin: async (ctx) => {
    // Send last 50 messages to new joiner
    const history = await db.messages.findMany({
      where: { roomId: ctx.roomId },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    ctx.reply({ type: "history", messages: history.reverse() });
  },
});
```

### Typing Indicators

```typescript
export default defineRoom({
  name: "chat",
  
  onMessage: async (ctx, msg) => {
    if (msg.type === "typing") {
      // Broadcast typing status (excluding sender)
      ctx.broadcastExceptSender({
        type: "typing",
        user: ctx.auth.name,
      });
    }
  },
});
```

### Rate Limiting

```typescript
export default defineRoom({
  name: "chat",
  rateLimit: {
    messages: 10,    // 10 mesaj
    window: 60000,   // 60 saniyede
  },
  
  onMessage: async (ctx, msg) => {
    // Rate limit otomatik kontrol edilir
    ctx.broadcast(msg);
  },
});
```

## Configuration

```typescript
// fiyuu.config.ts
export default {
  realtime: {
    enabled: true,
    maxConnections: 10000,
    heartbeat: 30000, // 30s
    
    // Redis adapter for multi-server
    adapter: {
      type: "redis",
      url: process.env.REDIS_URL,
    },
  },
};
```

## Best Practices

1. **Auth**: Her zaman onAuth kullan
2. **Validation**: Gelen mesajları validate et
3. **Error Handling**: try/catch ile hataları yönet
4. **Cleanup**: onLeave'te kaynakları temizle
5. **Scaling**: Production'da Redis adapter kullan
