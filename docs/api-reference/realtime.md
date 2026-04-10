# Real-Time Channels

Built-in WebSocket and NATS support for real-time communication. No external packages needed.

## Overview

Fiyuu Realtime provides:
- WebSocket channels for browser clients
- NATS integration for microservices
- Room-based messaging
- Presence tracking
- Authentication on connection

## Installation

```typescript
import { realtime } from "@fiyuu/realtime";
```

Enable in config:

```typescript
// fiyuu.config.ts
export default {
  websocket: {
    enabled: true,
    port: 4051,  // Optional: separate WS port
  },
};
```

## WebSocket Channels

### Creating a Channel

```typescript
import { realtime } from "@fiyuu/realtime";

const chat = realtime.channel("chat");
```

### Handling Connections

```typescript
// app/services/chat.service.ts
import { defineService } from "@fiyuu/runtime";
import { realtime } from "@fiyuu/realtime";

export default defineService({
  name: "chat",
  start() {
    const chat = realtime.channel("chat");
    
    // New client connected
    chat.on("connect", (socket) => {
      console.log(`Client ${socket.id} connected`);
    });
    
    // Client disconnected
    chat.on("disconnect", (socket) => {
      console.log(`Client ${socket.id} disconnected`);
    });
    
    // Handle custom events
    chat.on("message", async (data, socket) => {
      // Broadcast to all clients
      chat.broadcast("message", {
        text: data.text,
        user: socket.userId,
        timestamp: Date.now(),
      });
    });
  },
});
```

### Event Handlers

```typescript
const channel = realtime.channel("notifications");

// Handle messages
channel.on("message", (data, socket) => {
  console.log("Received:", data);
});

// Handle with async
channel.on("save", async (data, socket) => {
  await db.table("messages").insert(data);
  socket.emit("saved", { id: data.id });
});

// One-time listener
channel.once("init", (data, socket) => {
  console.log("Initialization complete");
});
```

### Emitting Events

```typescript
// To specific socket
socket.emit("event", { message: "Hello" });

// Broadcast to all (except sender)
channel.broadcast("event", data);

// Broadcast to all (including sender)
channel.broadcast("event", data, { includeSelf: true });
```

### Rooms

Organize clients into rooms:

```typescript
// Join room
socket.join("room-123");

// Leave room
socket.leave("room-123");

// Emit to room
channel.to("room-123").emit("message", data);

// Multiple rooms
socket.join(["room-123", "room-456"]);
channel.to(["room-123", "room-456"]).emit("event", data);
```

### Presence

Track who's online:

```typescript
// Set user data
socket.setPresence({
  userId: "123",
  name: "John",
  status: "online",
});

// Get presence in room
const onlineUsers = await channel.presence("room-123");
// [{ userId: "123", name: "John", status: "online" }, ...]

// Listen for presence changes
channel.on("presence", (change) => {
  if (change.type === "join") {
    console.log(`${change.user.name} joined`);
  } else if (change.type === "leave") {
    console.log(`${change.user.name} left`);
  }
});
```

## Client-Side Usage

### Browser Client

```html
<script>
  const ws = new WebSocket('ws://localhost:4051/chat');
  
  ws.onopen = () => {
    console.log('Connected');
    ws.send(JSON.stringify({
      event: 'join',
      room: 'general'
    }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
  };
  
  // Send message
  function sendMessage(text) {
    ws.send(JSON.stringify({
      event: 'message',
      data: { text }
    }));
  }
</script>
```

### Fiyuu Client Helper

```typescript
import { createChannel } from "@fiyuu/realtime/client";

const chat = createChannel("ws://localhost:4051/chat");

chat.on("connect", () => {
  console.log("Connected");
});

chat.on("message", (data) => {
  console.log("New message:", data);
});

chat.emit("message", { text: "Hello!" });
```

## Authentication

### Guard on Connect

```typescript
import { defineGuard } from "@fiyuu/realtime";

export const wsAuthGuard = defineGuard({
  async canConnect(request: Request) {
    const token = new URL(request.url).searchParams.get("token");
    
    if (!token) {
      return { allowed: false, reason: "No token" };
    }
    
    try {
      const user = await verifyToken(token);
      return { 
        allowed: true, 
        user: { id: user.id, name: user.name }
      };
    } catch {
      return { allowed: false, reason: "Invalid token" };
    }
  },
});

// Apply to channel
const channel = realtime.channel("secure", {
  guard: wsAuthGuard,
});
```

### Token in Query

```javascript
// Client
const ws = new WebSocket(`ws://localhost:4051/chat?token=${jwtToken}`);
```

### Access User in Handlers

```typescript
channel.on("message", (data, socket) => {
  // socket.user is set by guard
  console.log(`Message from ${socket.user.name}`);
  
  // Save with user context
  await db.table("messages").insert({
    text: data.text,
    userId: socket.user.id,
  });
});
```

## Complete Chat Example

```typescript
// app/services/chat.service.ts
import { defineService } from "@fiyuu/runtime";
import { realtime } from "@fiyuu/realtime";
import { db } from "@fiyuu/db";

export default defineService({
  name: "chat",
  start() {
    const chat = realtime.channel("chat", {
      async canConnect(request) {
        const token = new URL(request.url).searchParams.get("token");
        const user = await verifyToken(token);
        return { allowed: !!user, user };
      },
    });
    
    // Join room
    chat.on("join", async (data, socket) => {
      const { roomId } = data;
      
      socket.join(roomId);
      socket.setPresence({
        userId: socket.user.id,
        name: socket.user.name,
        room: roomId,
      });
      
      // Load recent messages
      const messages = await db.query(
        "SELECT * FROM messages WHERE roomId = ? ORDER BY createdAt DESC LIMIT 50",
        [roomId]
      );
      
      socket.emit("history", messages.reverse());
      
      // Notify room
      chat.to(roomId).emit("user-joined", {
        user: socket.user,
        timestamp: Date.now(),
      });
    });
    
    // Send message
    chat.on("message", async (data, socket) => {
      const { roomId, text } = data;
      
      const message = {
        id: crypto.randomUUID(),
        roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        text,
        createdAt: new Date().toISOString(),
      };
      
      // Save to database
      await db.table("messages").insert(message);
      
      // Broadcast to room
      chat.to(roomId).emit("message", message);
    });
    
    // Typing indicator
    chat.on("typing", (data, socket) => {
      chat.to(data.roomId).emit("typing", {
        user: socket.user,
        isTyping: data.isTyping,
      });
    });
    
    // Leave room
    chat.on("leave", (data, socket) => {
      socket.leave(data.roomId);
      chat.to(data.roomId).emit("user-left", {
        user: socket.user,
      });
    });
    
    // Disconnect
    chat.on("disconnect", (socket) => {
      console.log(`${socket.user?.name} disconnected`);
    });
  },
});
```

## NATS Integration

Connect to NATS for microservice communication:

```typescript
import { nats } from "@fiyuu/realtime/nats";

// Connect
const nc = await nats.connect({
  servers: ["nats://localhost:4222"],
});

// Subscribe
const sub = nc.subscribe("orders.created");
(async () => {
  for await (const msg of sub) {
    const order = JSON.parse(msg.data);
    await processOrder(order);
  }
})();

// Publish
nc.publish("orders.created", JSON.stringify({ id: "123", total: 100 }));

// Request-Reply
const response = await nc.request(
  "users.get",
  JSON.stringify({ id: "123" }),
  { timeout: 1000 }
);
const user = JSON.parse(response.data);
```

## Configuration

### WebSocket Options

```typescript
// fiyuu.config.ts
export default {
  websocket: {
    enabled: true,
    port: 4051,
    path: "/ws",
    
    // Heartbeat
    heartbeat: {
      enabled: true,
      interval: 30000,  // 30 seconds
      timeout: 60000,   // 60 seconds
    },
    
    // Rate limiting
    rateLimit: {
      messagesPerSecond: 30,
      burstSize: 50,
    },
    
    // CORS
    cors: {
      origin: ["https://myapp.com"],
      credentials: true,
    },
  },
};
```

### Channel Options

```typescript
const channel = realtime.channel("chat", {
  // Max clients
  maxClients: 1000,
  
  // Message history
  history: {
    enabled: true,
    maxMessages: 100,
    ttl: 3600000,  // 1 hour
  },
  
  // Persistence
  persist: {
    enabled: true,
    table: "messages",
  },
});
```

## Error Handling

```typescript
channel.on("error", (error, socket) => {
  console.error("Socket error:", error);
  socket.emit("error", { message: "An error occurred" });
});

// Handle specific errors
channel.on("message", async (data, socket) => {
  try {
    await processMessage(data);
  } catch (error) {
    socket.emit("error", { 
      event: "message",
      message: error.message 
    });
  }
});
```

## Scaling

### Redis Adapter

For multi-server deployments:

```typescript
// fiyuu.config.ts
export default {
  websocket: {
    adapter: {
      type: "redis",
      url: "redis://localhost:6379",
    },
  },
};
```

Now broadcasts work across all servers.

## Best Practices

1. **Authenticate connections** - Use guards
2. **Validate messages** - Check data structure
3. **Handle disconnects** - Clean up resources
4. **Use rooms** - Don't broadcast to all
5. **Rate limit** - Prevent spam
6. **Persist important data** - Don't rely on memory

## Next Steps

- Learn about [Background Services](../guides/background-services.md)
- Explore [Decorators](./decorators.md) for structured code
- Read the [Database](./database.md) guide
