import type { Transport } from "./types.js";

export class NatsTransport implements Transport {
  readonly name = "nats" as const;
  private url: string;
  private clusterName: string;
  private connection: unknown = null;
  private handlers = new Map<string, Set<(data: unknown, meta: { sender?: string }) => void>>();
  private connected = false;

  constructor(options: { url?: string; name?: string } = {}) {
    this.url = options.url || "nats://localhost:4222";
    this.clusterName = options.name || "fiyuu";
  }

  async connect(): Promise<void> {
    try {
      // @ts-ignore - nats is an optional peer dependency
      const { connect } = await import("nats");
      this.connection = await connect({
        servers: this.url,
        name: this.clusterName,
      });
      this.connected = true;

      this.listenForMessages();
    } catch {
      this.connected = false;
      console.warn("[fiyuu/realtime] NATS connection failed. Real-time features limited to WebSocket only.");
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      const nc = this.connection as { drain?: () => Promise<void> };
      if (nc.drain) {
        await nc.drain();
      }
      this.connection = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  publish(topic: string, data: unknown): void {
    if (!this.connection) return;

    const nc = this.connection as { publish: (subject: string, data: Uint8Array) => void };
    const message = JSON.stringify({ channel: topic, event: "broadcast", data, ts: Date.now() });
    nc.publish(topic, new TextEncoder().encode(message));
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

  private async listenForMessages(): Promise<void> {
    if (!this.connection) return;

    const nc = this.connection as { subscribe: (subject: string) => AsyncIterable<{ subject: string; data: Uint8Array }> };
    const sub = nc.subscribe("fiyuu.>");

    for await (const msg of sub) {
      try {
        const raw = new TextDecoder().decode(msg.data);
        const parsed = JSON.parse(raw);
        const { channel, data } = parsed;

        const handlers = this.handlers.get(channel);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(data, { sender: "nats" });
            } catch {
              // handler error
            }
          }
        }
      } catch {
        // invalid message
      }
    }
  }
}
