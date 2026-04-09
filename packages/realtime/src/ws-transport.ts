import type { Transport, TransportOptions } from "./types.js";
import { type Server, type IncomingMessage } from "node:http";
import type { Socket } from "node:net";
import { WebSocketServer, WebSocket, type RawData } from "ws";

export interface WebSocketTransportOptions extends TransportOptions {
  path?: string;
  /** Auth function - return false to reject connection */
  auth?: (request: IncomingMessage) => boolean | Promise<boolean>;
}

export class WebSocketTransport implements Transport {
  readonly name = "websocket";
  private wss: WebSocketServer | null = null;
  private server: Server | null = null;
  private handlers = new Map<string, Set<(data: unknown, meta: { sender?: string }) => void>>();
  private sockets = new Map<string, WebSocket>();
  private socketRooms = new Map<string, Set<string>>(); // socketId -> set of room names
  private rooms = new Map<string, Set<string>>(); // roomName -> set of socketIds
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatMs: number;
  private maxPayloadBytes: number;
  private path: string;
  private handledSockets = new WeakSet<Socket>();
  private authFn?: (request: IncomingMessage) => boolean | Promise<boolean>;

  constructor(options: WebSocketTransportOptions = {}) {
    this.heartbeatMs = options.heartbeatMs || 30000;
    this.maxPayloadBytes = options.maxPayloadBytes || 65536;
    this.path = options.path || "/__fiyuu/ws";
    this.authFn = options.auth;
  }

  get connectedCount(): number {
    return this.sockets.size;
  }

  attach(server: Server): void {
    this.server = server;
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", async (request: IncomingMessage, socket: Socket, head) => {
      const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
      if (url.pathname !== this.path) return;

      if (!this.wss) return;

      if (this.handledSockets.has(socket)) return;
      this.handledSockets.add(socket);

      // Auth check
      if (this.authFn) {
        try {
          const allowed = await this.authFn(request);
          if (!allowed) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
          }
        } catch {
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
          socket.destroy();
          return;
        }
      }

      try {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit("connection", ws, request);
        });
      } catch {
        // Another WebSocket handler already processed this socket
      }
    });

    this.wss.on("connection", (ws: WebSocket) => {
      const id = generateSocketId();
      this.sockets.set(id, ws);

      ws.on("message", (raw: RawData) => {
        try {
          const msg = JSON.parse(String(raw));
          const { channel, event, data } = msg;

          if (channel && event) {
            this.dispatch(channel, event, data, { sender: id });
          }
        } catch {
          // invalid message, ignore
        }
      });

      ws.on("close", () => {
        this.cleanupSocket(id);
      });

      ws.on("error", () => {
        this.cleanupSocket(id);
      });

      // Send ready message
      this.sendToSocket(ws, {
        channel: "__system__",
        event: "ready",
        data: { id },
        ts: Date.now(),
      });
    });

    this.heartbeatTimer = setInterval(() => {
      for (const [id, ws] of this.sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.sockets.delete(id);
        }
      }
    }, this.heartbeatMs);
  }

  connect(): void {
    // WebSocket transport requires attach() to be called with an HTTP server
  }

  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const [, ws] of this.sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Server shutdown");
      }
    }
    this.sockets.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  isConnected(): boolean {
    return this.wss !== null;
  }

  publish(topic: string, data: unknown): void {
    const message = { channel: topic, event: "broadcast", data, ts: Date.now() };
    for (const [, ws] of this.sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
      }
    }
  }

  emit(event: string, data: unknown, targetSocketId?: string): void {
    const message = { channel: "__event__", event, data, ts: Date.now() };
    if (targetSocketId) {
      const ws = this.sockets.get(targetSocketId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
      }
      return;
    }

    for (const [, ws] of this.sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
      }
    }
  }

  subscribe(topic: string, handler: (data: unknown, meta: { sender?: string }) => void): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);

    return () => {
      const set = this.handlers.get(topic);
      if (set) {
        set.delete(handler);
        if (set.size === 0) this.handlers.delete(topic);
      }
    };
  }

  private cleanupSocket(id: string): void {
    this.sockets.delete(id);
    // Clean up rooms
    const rooms = this.socketRooms.get(id);
    if (rooms) {
      for (const roomName of rooms) {
        const room = this.rooms.get(roomName);
        if (room) {
          room.delete(id);
          if (room.size === 0) this.rooms.delete(roomName);
        }
      }
      this.socketRooms.delete(id);
    }
  }

  private dispatch(channel: string, event: string, data: unknown, meta: { sender?: string }): void {
    const key = `${channel}:${event}`;
    const handlers = this.handlers.get(key) || this.handlers.get(channel);

    if (handlers) {
      const payload = { event, data, ts: Date.now() };
      for (const handler of handlers) {
        try {
          handler(payload, meta);
        } catch {
          // handler errors are swallowed
        }
      }
    }
  }

  private sendToSocket(ws: WebSocket, message: unknown): void {
    try {
      const raw = JSON.stringify(message);
      if (raw.length > this.maxPayloadBytes) return;
      ws.send(raw);
    } catch {
      // serialization error
    }
  }

  getSocketIds(): string[] {
    return Array.from(this.sockets.keys());
  }

  sendTo(socketId: string, event: string, data: unknown): void {
    const ws = this.sockets.get(socketId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToSocket(ws, { channel: "__event__", event, data, ts: Date.now() });
    }
  }

  // ── Room management ──────────────────────────────────────────────────────

  /**
   * Join a socket to a room.
   */
  joinRoom(socketId: string, roomName: string): void {
    // Track socket -> rooms
    if (!this.socketRooms.has(socketId)) {
      this.socketRooms.set(socketId, new Set());
    }
    this.socketRooms.get(socketId)!.add(roomName);

    // Track room -> sockets
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(socketId);
  }

  /**
   * Remove a socket from a room.
   */
  leaveRoom(socketId: string, roomName: string): void {
    this.socketRooms.get(socketId)?.delete(roomName);
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) this.rooms.delete(roomName);
    }
  }

  /**
   * Broadcast to all sockets in a room.
   */
  toRoom(roomName: string, event: string, data: unknown): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const message = { channel: "__room__", event, data, room: roomName, ts: Date.now() };
    for (const socketId of room) {
      const ws = this.sockets.get(socketId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
      }
    }
  }

  /**
   * Get all sockets in a room.
   */
  getRoomMembers(roomName: string): string[] {
    return Array.from(this.rooms.get(roomName) ?? []);
  }

  /**
   * Get all rooms a socket belongs to.
   */
  getSocketRooms(socketId: string): string[] {
    return Array.from(this.socketRooms.get(socketId) ?? []);
  }

  /**
   * Get all room names.
   */
  listRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

function generateSocketId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `s_${time}${rand}`;
}
