# @fiyuu/realtime

Real-time communication for the Fiyuu framework. WebSocket + optional NATS support with channels, rooms, and auth.

## Installation

```bash
npm install @fiyuu/realtime

# Optional: NATS support
npm install nats
```

## Quick Start

```typescript
import { FiyuuRealtime } from "@fiyuu/realtime";

const realtime = new FiyuuRealtime({
  transports: ["websocket"],
  websocket: { path: "/__fiyuu/ws", heartbeatMs: 30000 },
});

await realtime.initialize(httpServer);

// Create a channel
const notifications = realtime.channel("notifications");

// Publish to channel
notifications.publish("new-message", { text: "Hello!" });

// Subscribe to channel
const unsubscribe = notifications.subscribe((data) => {
  console.log("Received:", data);
});
```

## Rooms

```typescript
const ws = realtime.ws!;

// Join a socket to a room
ws.joinRoom(socketId, "room-123");

// Broadcast to room
ws.toRoom("room-123", "message", { text: "Hello room!" });

// Leave room
ws.leaveRoom(socketId, "room-123");

// List rooms
ws.listRooms(); // ["room-123", "room-456"]
```

## Authentication

```typescript
const realtime = new FiyuuRealtime({
  transports: ["websocket"],
  websocket: {
    auth: (request) => {
      const token = request.headers["authorization"];
      return !!token && verifyToken(token);
    },
  },
});
```

## NATS Transport

```typescript
const realtime = new FiyuuRealtime({
  transports: ["websocket", "nats"],
  nats: { url: "nats://localhost:4222", name: "my-app" },
});
```

## License

MIT
