/**
 * Guard and interceptor decorators for AOP (Aspect-Oriented Programming).
 */

import { Injectable, type Constructor } from "../di/container.js";
import { defineMetadata, getOwnMetadata } from "../di/metadata.js";

// ── Metadata keys ─────────────────────────────────────────────────────────

const GUARD_META_KEY = Symbol("fiyuu:guard_meta");
const INTERCEPTOR_KEY = Symbol("fiyuu:interceptor");
const FILTER_KEY = Symbol("fiyuu:filter");

// ── Registries ───────────────────────────────────────────────────────────

const guardRegistry: Map<Constructor, GuardMetadata> = new Map();
const interceptorRegistry: Map<Constructor, InterceptorMetadata> = new Map();
const filterRegistry: Map<Constructor, FilterMetadata> = new Map();

export interface RequestContext {
  method: string;
  url: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string | undefined>;
  body: unknown;
  user?: unknown;
  requestId: string;
}

export interface CanActivate {
  canActivate(context: RequestContext): boolean | Promise<boolean>;
}

export interface Interceptor {
  before?(context: RequestContext): void | Promise<void>;
  after?(context: RequestContext, result: unknown): unknown | Promise<unknown>;
}

export interface ExceptionFilter {
  catch(error: Error, context: RequestContext): ExceptionResponse | Promise<ExceptionResponse>;
}

export interface ExceptionResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

interface GuardMetadata { name: string; }
interface InterceptorMetadata { name: string; }
interface FilterMetadata { name: string; catches?: Constructor<Error>; }

export function getGuardRegistry(): Map<Constructor, GuardMetadata> { return guardRegistry; }
export function getInterceptorRegistry(): Map<Constructor, InterceptorMetadata> { return interceptorRegistry; }
export function getFilterRegistry(): Map<Constructor, FilterMetadata> { return filterRegistry; }

// ── @Guard() ─────────────────────────────────────────────────────────────

/**
 * Marks a class as a guard.
 */
export function Guard(): ClassDecorator {
  return function (target: Function) {
    const metadata: GuardMetadata = { name: target.name };
    defineMetadata(GUARD_META_KEY, metadata, target);
    guardRegistry.set(target as Constructor, metadata);
    Injectable()(target);
  };
}

// ── @UseInterceptor() ────────────────────────────────────────────────────

/**
 * Apply interceptor(s) to a controller or method.
 */
export function UseInterceptor(...interceptors: Constructor[]): ClassDecorator & MethodDecorator {
  return function (target: Object | Function, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      const existing = (getOwnMetadata(INTERCEPTOR_KEY, target, propertyKey) as Constructor[]) ?? [];
      existing.push(...interceptors);
      defineMetadata(INTERCEPTOR_KEY, existing, target, propertyKey);
    } else {
      const existing = (getOwnMetadata(INTERCEPTOR_KEY, target) as Constructor[]) ?? [];
      existing.push(...interceptors);
      defineMetadata(INTERCEPTOR_KEY, existing, target);
    }
  } as ClassDecorator & MethodDecorator;
}

// ── @ExceptionHandler() ──────────────────────────────────────────────────

/**
 * Marks a class as an exception handler.
 */
export function ExceptionHandler(errorType?: Constructor<Error>): ClassDecorator {
  return function (target: Function) {
    const metadata: FilterMetadata = {
      name: target.name,
      catches: errorType,
    };
    defineMetadata(FILTER_KEY, metadata, target);
    filterRegistry.set(target as Constructor, metadata);
    Injectable()(target);
  };
}

export { GUARD_META_KEY, INTERCEPTOR_KEY, FILTER_KEY };
