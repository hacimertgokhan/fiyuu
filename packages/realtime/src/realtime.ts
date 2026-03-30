import type { Server } from "node:http";
import type { Transport, RealtimeConfig, ChannelConfig } from "./types.js";
import { WebSocketTransport } from "./ws-transport.js";
import { NatsTransport } from "./nats-transport.js";
import { Channel } from "./channels.js";

export class FiyuuRealtime {
  private channels = new Map<string, Channel>();
  private transports: Transport[] = [];
  private config: RealtimeConfig;
  private wsTransport: WebSocketTransport | null = null;
  private started = false;

  constructor(config: RealtimeConfig = {}) {
    this.config = config;
  }

  async initialize(server: Server): Promise<void> {
    if (this.started) return;

    const enabledTransports = this.config.transports || ["websocket"];

    // WebSocket transport (built-in, always available)
    if (enabledTransports.includes("websocket")) {
      this.wsTransport = new WebSocketTransport({
        path: this.config.websocket?.path || "/__fiyuu/ws",
        heartbeatMs: this.config.websocket?.heartbeatMs || 30000,
        maxPayloadBytes: this.config.websocket?.maxPayloadBytes || 65536,
      });
      this.wsTransport.attach(server);
      this.transports.push(this.wsTransport);
    }

    // NATS transport (optional, requires `nats` package)
    if (enabledTransports.includes("nats")) {
      try {
        const natsTransport = new NatsTransport({
          url: this.config.nats?.url,
          name: this.config.nats?.name,
        });
        await natsTransport.connect();
        if (natsTransport.isConnected()) {
          this.transports.push(natsTransport);
        }
      } catch {
        console.warn("[fiyuu/realtime] NATS transport not available. Install `nats` package to enable.");
      }
    }

    this.started = true;
  }

  async shutdown(): Promise<void> {
    for (const transport of this.transports) {
      await transport.disconnect();
    }
    this.transports = [];
    this.channels.clear();
    this.started = false;
  }

  channel(name: string, config?: Partial<ChannelConfig>): Channel {
    if (!this.channels.has(name)) {
      const ch = new Channel({ name, ...config });

      for (const transport of this.transports) {
        ch.addTransport(transport);
      }

      this.channels.set(name, ch);
    }

    return this.channels.get(name)!;
  }

  removeChannel(name: string): boolean {
    return this.channels.delete(name);
  }

  listChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  broadcast(event: string, data: unknown): void {
    for (const transport of this.transports) {
      transport.publish(event, data);
    }
  }

  get ws(): WebSocketTransport | null {
    return this.wsTransport;
  }

  get isConnected(): boolean {
    return this.started && this.transports.length > 0;
  }

  stats(): { channels: number; transports: number; wsConnections: number } {
    return {
      channels: this.channels.size,
      transports: this.transports.length,
      wsConnections: this.wsTransport?.connectedCount || 0,
    };
  }
}

let globalRealtime: FiyuuRealtime | null = null;

export function createRealtime(config?: RealtimeConfig): FiyuuRealtime {
  return new FiyuuRealtime(config);
}

export function getRealtime(): FiyuuRealtime {
  if (!globalRealtime) {
    globalRealtime = new FiyuuRealtime();
  }
  return globalRealtime;
}

export function setRealtime(rt: FiyuuRealtime): void {
  globalRealtime = rt;
}
