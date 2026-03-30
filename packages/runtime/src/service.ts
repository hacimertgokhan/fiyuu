import type { FiyuuDB } from "@fiyuu/db";
import type { FiyuuRealtime } from "@fiyuu/realtime";
import type { FiyuuConfig } from "@fiyuu/core";

export interface ServiceContext {
  db: FiyuuDB;
  realtime: FiyuuRealtime;
  config: FiyuuConfig;
  log: (level: "info" | "warn" | "error", msg: string, data?: unknown) => void;
}

export interface FiyuuService {
  name: string;
  start(ctx: ServiceContext): Promise<void> | void;
  stop?(ctx: ServiceContext): Promise<void> | void;
}

export function defineService(service: FiyuuService): FiyuuService {
  if (!service.name || service.name.trim().length === 0) {
    throw new Error("Service must have a non-empty name.");
  }
  if (typeof service.start !== "function") {
    throw new Error(`Service "${service.name}" must have a start() function.`);
  }
  return service;
}

export class ServiceManager {
  private services: FiyuuService[] = [];
  private context: ServiceContext | null = null;
  private started = false;

  setContext(ctx: ServiceContext): void {
    this.context = ctx;
  }

  register(service: FiyuuService): void {
    if (this.services.some((s) => s.name === service.name)) {
      throw new Error(`Service "${service.name}" is already registered.`);
    }
    this.services.push(service);
  }

  async startAll(): Promise<void> {
    if (!this.context) throw new Error("ServiceManager context not set. Call setContext() first.");

    this.started = true;

    for (const service of this.services) {
      try {
        this.context.log("info", `service.start`, { name: service.name });
        await service.start(this.context);
        this.context.log("info", `service.started`, { name: service.name });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.context.log("error", `service.start.error`, { name: service.name, error: msg });
      }
    }
  }

  async stopAll(): Promise<void> {
    if (!this.context || !this.started) return;

    // Stop in reverse order
    for (let i = this.services.length - 1; i >= 0; i--) {
      const service = this.services[i];
      if (service.stop) {
        try {
          this.context.log("info", `service.stop`, { name: service.name });
          await service.stop(this.context);
          this.context.log("info", `service.stopped`, { name: service.name });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.context.log("error", `service.stop.error`, { name: service.name, error: msg });
        }
      }
    }

    this.started = false;
  }

  list(): string[] {
    return this.services.map((s) => s.name);
  }

  get count(): number {
    return this.services.length;
  }

  get isRunning(): boolean {
    return this.started;
  }
}

export function createServiceManager(): ServiceManager {
  return new ServiceManager();
}
