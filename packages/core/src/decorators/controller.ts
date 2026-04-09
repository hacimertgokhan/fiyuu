/**
 * Controller decorators for Spring Boot-style API routing.
 *
 * @example
 * ```ts
 * @Controller("/api/users")
 * class UserController {
 *   @Get("/")
 *   async list() { return users; }
 *
 *   @Get("/:id")
 *   async getById(@Param("id") id: string) { return user; }
 *
 *   @Post("/")
 *   async create(@Body() dto: CreateUserDTO) { return created; }
 * }
 * ```
 */

import { Container, Injectable, type Constructor } from "../di/container.js";
import { defineMetadata, getOwnMetadata } from "../di/metadata.js";

// ── Metadata keys ─────────────────────────────────────────────────────────

const CONTROLLER_KEY = Symbol("fiyuu:controller");
const ROUTE_KEY = Symbol("fiyuu:routes");
const PARAM_KEY = Symbol("fiyuu:params");
const GUARD_KEY = Symbol("fiyuu:guards");
const MIDDLEWARE_KEY = Symbol("fiyuu:middleware");

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  handlerName: string;
  statusCode?: number;
}

export interface ControllerMetadata {
  prefix: string;
  routes: RouteMetadata[];
  guards: Constructor[];
  middlewares: Function[];
}

export interface ParamMetadata {
  index: number;
  type: "param" | "query" | "body" | "headers" | "request" | "response";
  name?: string;
}

// ── Controller registry ──────────────────────────────────────────────────

const controllerRegistry: Map<Constructor, ControllerMetadata> = new Map();

export function getControllerRegistry(): Map<Constructor, ControllerMetadata> {
  return controllerRegistry;
}

export function getControllerMetadata(target: Constructor): ControllerMetadata | undefined {
  return controllerRegistry.get(target);
}

// ── Class decorators ─────────────────────────────────────────────────────

/**
 * Marks a class as a controller with a route prefix.
 */
export function Controller(prefix: string = ""): ClassDecorator {
  return function (target: Function) {
    const routes = (getOwnMetadata(ROUTE_KEY, target.prototype) as RouteMetadata[]) ?? [];
    const guards = (getOwnMetadata(GUARD_KEY, target) as Constructor[]) ?? [];
    const middlewares = (getOwnMetadata(MIDDLEWARE_KEY, target) as Function[]) ?? [];

    const metadata: ControllerMetadata = {
      prefix: prefix.startsWith("/") ? prefix : `/${prefix}`,
      routes,
      guards,
      middlewares,
    };

    defineMetadata(CONTROLLER_KEY, metadata, target);
    controllerRegistry.set(target as Constructor, metadata);

    // Auto-register in DI container
    Injectable()(target);
  };
}

// ── Method decorators ────────────────────────────────────────────────────

function createMethodDecorator(method: HttpMethod) {
  return function (path: string = ""): MethodDecorator {
    return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      const routes = (getOwnMetadata(ROUTE_KEY, target) as RouteMetadata[]) ?? [];
      routes.push({
        method,
        path: path.startsWith("/") ? path : `/${path}`,
        handlerName: String(propertyKey),
      });
      defineMetadata(ROUTE_KEY, routes, target);
    };
  };
}

/** @Get("/path") - Handle GET requests */
export const Get = createMethodDecorator("GET");

/** @Post("/path") - Handle POST requests */
export const Post = createMethodDecorator("POST");

/** @Put("/path") - Handle PUT requests */
export const Put = createMethodDecorator("PUT");

/** @Delete("/path") - Handle DELETE requests */
export const Delete = createMethodDecorator("DELETE");

/** @Patch("/path") - Handle PATCH requests */
export const Patch = createMethodDecorator("PATCH");

/** @Head("/path") - Handle HEAD requests */
export const Head = createMethodDecorator("HEAD");

/** @Options("/path") - Handle OPTIONS requests */
export const Options = createMethodDecorator("OPTIONS");

/**
 * Set custom HTTP status code for response.
 */
export function HttpCode(code: number): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const routes = (getOwnMetadata(ROUTE_KEY, target) as RouteMetadata[]) ?? [];
    const route = routes.find((r) => r.handlerName === String(propertyKey));
    if (route) {
      route.statusCode = code;
    }
  };
}

// ── Parameter decorators ─────────────────────────────────────────────────

function createParamDecorator(type: ParamMetadata["type"], name?: string): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const key = propertyKey ? String(propertyKey) : "constructor";
    const existing = (getOwnMetadata(PARAM_KEY, target, key) as ParamMetadata[]) ?? [];
    existing.push({ index: parameterIndex, type, name });
    defineMetadata(PARAM_KEY, existing, target, key);
  };
}

/** Extract a route parameter: `@Param("id") id: string` */
export function Param(name: string): ParameterDecorator {
  return createParamDecorator("param", name);
}

/** Extract a query string parameter: `@Query("page") page: string` */
export function Query(name: string): ParameterDecorator {
  return createParamDecorator("query", name);
}

/** Extract the request body: `@Body() dto: CreateUserDTO` */
export function Body(): ParameterDecorator {
  return createParamDecorator("body");
}

/** Extract request headers: `@Headers("authorization") auth: string` */
export function Headers(name?: string): ParameterDecorator {
  return createParamDecorator("headers", name);
}

/** Inject the raw request object: `@Req() request: IncomingMessage` */
export function Req(): ParameterDecorator {
  return createParamDecorator("request");
}

/** Inject the raw response object: `@Res() response: ServerResponse` */
export function Res(): ParameterDecorator {
  return createParamDecorator("response");
}

/**
 * Apply guard(s) to a controller or method.
 */
export function UseGuard(...guards: Constructor[]): ClassDecorator & MethodDecorator {
  return function (target: Object | Function, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // Method-level guard
      const existing = (getOwnMetadata(GUARD_KEY, target, propertyKey) as Constructor[]) ?? [];
      existing.push(...guards);
      defineMetadata(GUARD_KEY, existing, target, propertyKey);
    } else {
      // Class-level guard
      const existing = (getOwnMetadata(GUARD_KEY, target) as Constructor[]) ?? [];
      existing.push(...guards);
      defineMetadata(GUARD_KEY, existing, target);
    }
  } as ClassDecorator & MethodDecorator;
}

// Export metadata keys for runtime access
export { CONTROLLER_KEY, ROUTE_KEY, PARAM_KEY, GUARD_KEY, MIDDLEWARE_KEY };
