import { z } from "zod";

export type AnyZodSchema = z.ZodTypeAny;

export interface SchemaContract<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema> {
  input: TInput;
  output: TOutput;
  description: string;
}

export interface ActionDefinition<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema>
  extends SchemaContract<TInput, TOutput> {
  kind: "action";
}

export interface QueryDefinition<TInput extends AnyZodSchema = AnyZodSchema, TOutput extends AnyZodSchema = AnyZodSchema>
  extends SchemaContract<TInput, TOutput> {
  kind: "query";
}

export interface QueryCacheConfig {
  /** Cache TTL in seconds. Set to 0 to disable. */
  ttl: number;
  /** Cache key varies by these URL query string parameters. */
  vary?: string[];
}

// Import RenderMode from intent.ts
import type { RenderMode } from "./intent.js";

export interface MetaDefinition {
  intent: string;
  title?: string;
  render?: RenderMode;
  /**
   * Mark this page as zero-JS.
   * `fiyuu doctor` will warn if <script> tags are detected in page.tsx.
   */
  noJs?: boolean;
  /**
   * Revalidate interval in seconds for `render: "ssg"` pages.
   * Works like ISR: stale HTML is served immediately and refreshed in background.
   */
  revalidate?: number;
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface PageDefinition {
  kind: "page";
  intent: string;
}

export interface LayoutDefinition {
  kind: "layout";
  name?: string;
}

// Note: RenderMode is defined in intent.ts as "ssr" | "csr" | "static" | "edge"
// This type is kept for backward compatibility
export type LegacyRenderMode = "ssr" | "csr" | "ssg";

export interface PageProps<TData = unknown> {
  data: TData | null;
  route: string;
  intent: string;
  render: RenderMode;
  /** Dynamic route parameters extracted from the URL, e.g. { id: "42" } for /blog/[id] */
  params: Record<string, string>;
}

export interface LayoutProps {
  children: string;
  route: string;
}

export function defineQuery<TInput extends AnyZodSchema, TOutput extends AnyZodSchema>(config: SchemaContract<TInput, TOutput>): QueryDefinition<TInput, TOutput> {
  return {
    kind: "query",
    ...config,
  };
}

// Note: definePage, defineLayout, defineAction are now exported from intent.js
// These implementations are kept for backward compatibility but will be removed in v0.6.0

export function defineMeta(config: MetaDefinition): MetaDefinition {
  return config;
}

// ── Type inference helpers ─────────────────────────────────────────────────
//
// Eliminate type duplication between Zod schemas and TypeScript code.
// Define your schema once in query.ts / action.ts — infer everywhere else.
//
// @example  page.tsx
//   import { query } from "./query.js";
//   type PageData = InferQueryOutput<typeof query>;  // no manual type needed
//
// @example  action.ts execute()
//   export async function execute({ input, request }: ActionContext<typeof action>) { ... }
//   // input is fully typed from the action's Zod input schema

/** TypeScript output type inferred from a QueryDefinition's output Zod schema. */
export type InferQueryOutput<T extends QueryDefinition> = z.infer<T["output"]>;

/** TypeScript input type inferred from a QueryDefinition's input Zod schema. */
export type InferQueryInput<T extends QueryDefinition> = z.infer<T["input"]>;

/** TypeScript input type inferred from an ActionDefinition's input Zod schema. */
export type InferActionInput<T extends ActionDefinition> = z.infer<T["input"]>;

/** TypeScript output type inferred from an ActionDefinition's output Zod schema. */
export type InferActionOutput<T extends ActionDefinition> = z.infer<T["output"]>;

/**
 * Context passed to query `execute()` functions.
 *
 * @example
 * export async function execute({ request, params }: QueryContext) {
 *   const sessionId = getSessionIdFromRequest(request as any);
 *   ...
 * }
 */
export interface QueryContext {
  /** Incoming HTTP request (Node.js IncomingMessage). Cast to `any` if you need raw access. */
  request: unknown;
  /** Dynamic URL parameters, e.g. { id: "42" } for route /blog/[id] */
  params: Record<string, string>;
}

/**
 * Context passed to action `execute()` functions.
 * Pass `typeof action` as the generic to get fully typed `input`.
 *
 * @example
 * export const action = defineAction({ input: z.object({ title: z.string() }), ... });
 *
 * export async function execute({ input, request }: ActionContext<typeof action>) {
 *   // input.title is typed as string — no manual type annotation needed
 * }
 */
export interface ActionContext<T extends ActionDefinition = ActionDefinition> {
  /** Action input, typed from the action's Zod input schema. */
  input: z.infer<T["input"]>;
  /** Incoming HTTP request (Node.js IncomingMessage). Cast to `any` if you need raw access. */
  request: unknown;
  /** Dynamic URL parameters, e.g. { id: "42" } for route /blog/[id] */
  params: Record<string, string>;
}

// ── Middleware ─────────────────────────────────────────────────────────────
//
// Use `defineMiddleware` to get full type inference without importing from
// @fiyuu/runtime. All types use `unknown` for Node.js primitives so that
// @fiyuu/core stays free of @types/node as a required peer dependency.

/**
 * Context object passed to every middleware handler.
 *
 * @example
 * export const middleware = defineMiddleware(async ({ url, request }, next) => {
 *   if (url.pathname === "/secret") { ... }
 *   await next();
 * });
 */
export interface FiyuuMiddlewareContext {
  /** Incoming HTTP request — Node.js `IncomingMessage`. */
  request: unknown;
  /** Parsed request URL. */
  url: URL;
  /** Mutable response headers that will be sent with the final response. */
  responseHeaders: Record<string, string>;
  /** Unique ID for this request (useful for logging). */
  requestId: string;
  /** Non-fatal warnings accumulated during request handling. */
  warnings: string[];
}

/**
 * Return this from a middleware to short-circuit the request.
 *
 * @example
 * // Redirect to login
 * return {
 *   headers: { Location: "/auth" },
 *   response: { status: 302, body: "" },
 * };
 */
export interface FiyuuMiddlewareResult {
  /** Extra response headers to send (e.g. `Location` for redirects). */
  headers?: Record<string, string>;
  response?: {
    /** HTTP status code. */
    status?: number;
    /** JSON body — serialised automatically. */
    json?: unknown;
    /** Raw string body. */
    body?: string;
  };
}

/** Call this to continue to the next middleware or the route handler. */
export type FiyuuMiddlewareNext = () => Promise<void>;

/**
 * A single middleware function.
 * Return `FiyuuMiddlewareResult` to short-circuit, or call `next()` to continue.
 */
export type FiyuuMiddlewareHandler = (
  context: FiyuuMiddlewareContext,
  next: FiyuuMiddlewareNext,
) => Promise<FiyuuMiddlewareResult | void> | FiyuuMiddlewareResult | void;

/**
 * Wraps your middleware function and gives it full type inference.
 * Import from `@fiyuu/core` — no need to touch `@fiyuu/runtime`.
 *
 * @example  app/middleware.ts
 * import { defineMiddleware } from "@fiyuu/core";
 *
 * export const middleware = defineMiddleware(async ({ url, request }, next) => {
 *   if (url.pathname.startsWith("/dashboard")) {
 *     const user = await getSessionUser(request);
 *     if (!user) return { headers: { Location: "/auth" }, response: { status: 302, body: "" } };
 *   }
 *   await next();
 * });
 */
export function defineMiddleware(handler: FiyuuMiddlewareHandler): FiyuuMiddlewareHandler {
  return handler;
}
