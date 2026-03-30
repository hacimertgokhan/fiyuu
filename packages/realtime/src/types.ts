export interface Message {
  channel: string;
  event: string;
  data: unknown;
  ts: number;
  sender?: string;
}

export interface TransportOptions {
  heartbeatMs?: number;
  maxPayloadBytes?: number;
}

export interface Transport {
  readonly name: string;
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  publish(topic: string, data: unknown): void;
  subscribe(topic: string, handler: (data: unknown, meta: { sender?: string }) => void): () => void;
  isConnected(): boolean;
}

export interface ChannelConfig {
  name: string;
  maxListeners?: number;
}

export interface SocketHandle {
  id: string;
  userId?: string;
  metadata: Record<string, unknown>;
  emit: (event: string, data: unknown) => void;
  close: () => void;
}

export interface ChannelEvent {
  event: string;
  data: unknown;
  socket: SocketHandle;
  ts: number;
}

export type EventHandler = (data: unknown, socket: SocketHandle) => void;

export interface RealtimeConfig {
  enabled?: boolean;
  transports?: ("websocket" | "nats")[];
  websocket?: {
    path?: string;
    heartbeatMs?: number;
    maxPayloadBytes?: number;
  };
  nats?: {
    url?: string;
    name?: string;
  };
}
