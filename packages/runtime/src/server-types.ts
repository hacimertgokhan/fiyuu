/**
 * Shared types and interfaces for the Fiyuu runtime server.
 * All other server modules import from here — no implementation code.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { WebSocket } from "ws";
import type { createProjectGraph, FeatureRecord, FiyuuConfig, MetaDefinition, RenderMode } from "@fiyuu/core";
import type { FiyuuDB } from "@fiyuu/db";
import type { FiyuuRealtime } from "@fiyuu/realtime";
import type { ClientAsset } from "./bundler.js";
import type { InsightsReport } from "./inspector.js";

export type { IncomingMessage, ServerResponse };
export type { FeatureRecord, FiyuuConfig, MetaDefinition, RenderMode };

// ── Module shapes ─────────────────────────────────────────────────────────────

export interface ModuleShape {
  default?: unknown;
  execute?: (context: any) => Promise<unknown> | unknown;
  page?: { intent: string };
  cache?: { ttl?: number; vary?: string[] };
}

export interface LayoutModule {
  default?: unknown;
}

export interface GeaRenderable {
  props?: Record<string, unknown>;
  template?: (props?: Record<string, unknown>) => string;
  toString: () => string;
}

export interface ApiRouteModule {
  GET?: (context: RequestContext) => Promise<unknown> | unknown;
  POST?: (context: RequestContext) => Promise<unknown> | unknown;
  PUT?: (context: RequestContext) => Promise<unknown> | unknown;
  PATCH?: (context: RequestContext) => Promise<unknown> | unknown;
  DELETE?: (context: RequestContext) => Promise<unknown> | unknown;
}

export interface SocketModule {
  registerSocketServer?: () => {
    namespace?: string;
    events?: string[];
    onConnect?: (socket: WebSocket) => void;
    onMessage?: (socket: WebSocket, message: string) => void;
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────

export interface MiddlewareModule {
  middleware?: MiddlewareHandler | MiddlewareHandler[];
}

export interface MiddlewareContext {
  request: IncomingMessage;
  url: URL;
  responseHeaders: Record<string, string>;
  requestId: string;
  warnings: string[];
}

export interface MiddlewareResult {
  headers?: Record<string, string>;
  response?: {
    status?: number;
    json?: unknown;
    body?: string;
  };
}

export type MiddlewareNext = () => Promise<void>;
export type MiddlewareHandler = (
  context: MiddlewareContext,
  next: MiddlewareNext,
) => Promise<MiddlewareResult | void> | MiddlewareResult | void;

// ── Request handling ──────────────────────────────────────────────────────────

export interface RequestContext {
  request: IncomingMessage;
  route: string;
  feature: FeatureRecord | null;
  input?: Record<string, unknown>;
}

// ── Server options & result ───────────────────────────────────────────────────

export interface StartServerOptions {
  mode: "dev" | "start";
  rootDirectory: string;
  appDirectory: string;
  serverDirectory?: string;
  config?: FiyuuConfig;
  port?: number;
  maxPort?: number;
  clientOutputDirectory: string;
  staticClientRoot: string;
}

export interface StartedServer {
  port: number;
  url: string;
  websocketUrl?: string;
  close: () => Promise<void>;
}

// ── Cache entries ─────────────────────────────────────────────────────────────

export interface QueryCacheEntry {
  data: unknown;
  expiresAt: number;
}

export interface SsgCacheEntry {
  html: string;
  etag: string;
  expiresAt: number | null;
  revalidateSeconds: number | null;
}

// ── Runtime state ─────────────────────────────────────────────────────────────

export interface RuntimeState {
  graph: Awaited<ReturnType<typeof createProjectGraph>>;
  features: FeatureRecord[];
  routeIndex: RouteIndex;
  assets: ClientAsset[];
  assetsByRoute: Map<string, ClientAsset>;
  insights: InsightsReport;
  ssgCache: Map<string, SsgCacheEntry>;
  queryCache: Map<string, QueryCacheEntry>;
  queryInflight: Map<string, Promise<unknown>>;
  queryCacheLastPruneAt: number;
  layoutStackCache: Map<string, Array<{ component: unknown; meta: MetaDefinition }>>;
  featureMetaCache: Map<string, MetaDefinition>;
  mergedMetaCache: Map<string, MetaDefinition>;
  serverEvents: Array<{ at: string; level: "info" | "warn" | "error"; event: string; details?: string }>;
  version: number;
  warnings: string[];
  db: FiyuuDB;
  realtime: FiyuuRealtime;
  serviceNames: string[];
  serverDirectory?: string;
}

// ── Tiny internal router ──────────────────────────────────────────────────────

export interface TinyRouteContext {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  state: RuntimeState;
  options: StartServerOptions;
  liveClients: Set<ServerResponse>;
}

export interface TinyRoute {
  method: "GET" | "POST";
  path: string;
  type: "exact" | "prefix";
  devOnly?: boolean;
  handler: (context: TinyRouteContext) => Promise<void> | void;
}

// ── Status page ───────────────────────────────────────────────────────────────

export interface StatusPageInput {
  statusCode: number;
  title: string;
  summary: string;
  detail?: string;
  route?: string;
  method?: string;
  requestId?: string;
  hints?: string[];
  diagnostics?: string[];
}

// ── Route matching ────────────────────────────────────────────────────────────

export interface RouteMatch {
  feature: FeatureRecord;
  params: Record<string, string>;
}

export interface DynamicRouteMatcher {
  feature: FeatureRecord;
  regex: RegExp;
  paramNames: string[];
}

export interface RouteIndex {
  exact: Map<string, FeatureRecord>;
  dynamic: DynamicRouteMatcher[];
}
