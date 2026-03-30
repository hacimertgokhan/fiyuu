import type { ChannelConfig, EventHandler, SocketHandle, ChannelEvent, Transport } from "./types.js";

export class Channel {
  readonly name: string;
  private listeners = new Map<string, Set<EventHandler>>();
  private maxListeners: number;
  private transports: Transport[] = [];

  constructor(config: ChannelConfig) {
    this.name = config.name;
    this.maxListeners = config.maxListeners || 100;
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);

    transport.subscribe(this.name, (payload: unknown, meta: { sender?: string }) => {
      const event = payload as ChannelEvent;
      this.dispatchLocal(event.event, event.data, {
        id: meta.sender || "unknown",
        emit: (e: string, d: unknown) => this.emit(e, d),
        close: () => {},
        metadata: {},
      });
    });
  }

  emit(event: string, data: unknown): void {
    const message: ChannelEvent = { event, data, socket: this.createSelfSocket(), ts: Date.now() };
    this.dispatchLocal(event, data, this.createSelfSocket());

    // Broadcast to all transports
    for (const transport of this.transports) {
      transport.publish(this.name, message);
    }
  }

  broadcast(event: string, data: unknown): void {
    this.emit(event, data);
  }

  to(target: string | SocketHandle): ToSender {
    const targetId = typeof target === "string" ? target : target.id;
    return {
      emit: (event: string, data: unknown) => {
        for (const transport of this.transports) {
          if ("sendTo" in transport && typeof transport.sendTo === "function") {
            (transport as unknown as { sendTo: (id: string, e: string, d: unknown) => void }).sendTo(targetId, event, data);
          }
        }
      },
    };
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event)!;
    if (set.size >= this.maxListeners) {
      console.warn(`[fiyuu/realtime] Channel "${this.name}" event "${event}" has ${this.maxListeners} listeners (max).`);
    }

    set.add(handler);

    return () => {
      set.delete(handler);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  off(event: string, handler: EventHandler): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  private dispatchLocal(event: string, data: unknown, socket: SocketHandle): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const channelEvent: ChannelEvent = { event, data, socket, ts: Date.now() };
    for (const handler of handlers) {
      try {
        handler(data, socket);
      } catch (err) {
        console.error(`[fiyuu/realtime] Channel "${this.name}" handler error for "${event}":`, err);
      }
    }
  }

  private createSelfSocket(): SocketHandle {
    return {
      id: "__server__",
      userId: undefined,
      metadata: {},
      emit: (event: string, data: unknown) => this.emit(event, data),
      close: () => {},
    };
  }
}

export interface ToSender {
  emit: (event: string, data: unknown) => void;
}
