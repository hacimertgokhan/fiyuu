/**
 * Service and Repository decorators.
 */

import { Injectable, Container, type Constructor, type Scope } from "../di/container.js";
import { defineMetadata } from "../di/metadata.js";

// ── Metadata keys ─────────────────────────────────────────────────────────

const SERVICE_KEY = Symbol("fiyuu:service");
const REPOSITORY_KEY = Symbol("fiyuu:repository");
const SCHEDULED_KEY = Symbol("fiyuu:scheduled");

// ── Registries ───────────────────────────────────────────────────────────

const serviceRegistry: Map<Constructor, ServiceMetadata> = new Map();
const repositoryRegistry: Map<Constructor, RepositoryMetadata> = new Map();
const scheduledTasks: ScheduledTask[] = [];

export interface ServiceMetadata {
  name?: string;
  scope: Scope;
}

export interface RepositoryMetadata {
  tableName: string;
}

export interface ScheduledTask {
  target: Constructor;
  methodName: string;
  cron: string;
  intervalId?: ReturnType<typeof setInterval>;
}

export function getServiceRegistry(): Map<Constructor, ServiceMetadata> {
  return serviceRegistry;
}

export function getRepositoryRegistry(): Map<Constructor, RepositoryMetadata> {
  return repositoryRegistry;
}

export function getScheduledTasks(): ScheduledTask[] {
  return scheduledTasks;
}

// ── @Service() ───────────────────────────────────────────────────────────

/**
 * Marks a class as a service (business logic layer).
 * Auto-registered in DI container as singleton.
 */
export function Service(options: { name?: string; scope?: Scope } = {}): ClassDecorator {
  return function (target: Function) {
    const metadata: ServiceMetadata = {
      name: options.name ?? target.name,
      scope: options.scope ?? "singleton",
    };

    defineMetadata(SERVICE_KEY, metadata, target);
    serviceRegistry.set(target as Constructor, metadata);

    Injectable({ scope: metadata.scope })(target);
  };
}

// ── @Repository() ────────────────────────────────────────────────────────

/**
 * Marks a class as a repository (data access layer).
 * Auto-connected to the specified F1 DB table.
 */
export function Repository(tableName: string): ClassDecorator {
  return function (target: Function) {
    const metadata: RepositoryMetadata = { tableName };

    defineMetadata(REPOSITORY_KEY, metadata, target);
    repositoryRegistry.set(target as Constructor, metadata);

    Injectable()(target);
  };
}

// ── @Scheduled() ─────────────────────────────────────────────────────────

/**
 * Schedule a method to run on a cron interval.
 *
 * @example
 * ```ts
 * @Service()
 * class CleanupService {
 *   @Scheduled("0 * * * *") // every hour
 *   async cleanExpiredSessions() { ... }
 * }
 * ```
 */
export function Scheduled(cron: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    scheduledTasks.push({
      target: target.constructor as Constructor,
      methodName: String(propertyKey),
      cron,
    });
  };
}

export { SERVICE_KEY, REPOSITORY_KEY, SCHEDULED_KEY };
