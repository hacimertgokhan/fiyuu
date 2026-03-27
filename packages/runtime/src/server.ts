import { createReadStream, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import chokidar from "chokidar";
import { WebSocketServer, type WebSocket } from "ws";
import { createProjectGraph, scanApp, syncProjectArtifacts, type FeatureRecord, type FiyuuConfig, type MetaDefinition, type RenderMode } from "@fiyuu/core";
import { bundleClient, type ClientAsset } from "./bundler.js";
import { buildInsightsReport, type InsightsReport } from "./inspector.js";
import { buildClientRuntime } from "./client-runtime.js";

interface ModuleShape {
  default?: unknown;
  execute?: (context: any) => Promise<unknown> | unknown;
  page?: { intent: string };
  cache?: { ttl?: number; vary?: string[] };
}

interface LayoutModule {
  default?: unknown;
}

interface GeaRenderable {
  props?: Record<string, unknown>;
  template?: (props?: Record<string, unknown>) => string;
  toString: () => string;
}

const geaComponentModeCache = new WeakMap<Function, "class" | "function">();

interface ApiRouteModule {
  GET?: (context: RequestContext) => Promise<unknown> | unknown;
  POST?: (context: RequestContext) => Promise<unknown> | unknown;
  PUT?: (context: RequestContext) => Promise<unknown> | unknown;
  PATCH?: (context: RequestContext) => Promise<unknown> | unknown;
  DELETE?: (context: RequestContext) => Promise<unknown> | unknown;
}

interface MiddlewareModule {
  middleware?: MiddlewareHandler | MiddlewareHandler[];
}

interface MiddlewareContext {
  request: IncomingMessage;
  url: URL;
  responseHeaders: Record<string, string>;
  requestId: string;
  warnings: string[];
}

interface MiddlewareResult {
  headers?: Record<string, string>;
  response?: {
    status?: number;
    json?: unknown;
    body?: string;
  };
}

type MiddlewareNext = () => Promise<void>;
type MiddlewareHandler = (context: MiddlewareContext, next: MiddlewareNext) => Promise<MiddlewareResult | void> | MiddlewareResult | void;

interface RequestContext {
  request: IncomingMessage;
  route: string;
  feature: FeatureRecord | null;
  input?: Record<string, unknown>;
}

export interface StartServerOptions {
  mode: "dev" | "start";
  rootDirectory: string;
  appDirectory: string;
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

interface SocketModule {
  registerSocketServer?: () => {
    namespace?: string;
    events?: string[];
    onConnect?: (socket: WebSocket) => void;
    onMessage?: (socket: WebSocket, message: string) => void;
  };
}

interface QueryCacheEntry {
  data: unknown;
  expiresAt: number;
}

interface RuntimeState {
  graph: Awaited<ReturnType<typeof createProjectGraph>>;
  features: FeatureRecord[];
  assets: ClientAsset[];
  insights: InsightsReport;
  ssgCache: Map<string, string>;
  queryCache: Map<string, QueryCacheEntry>;
  serverEvents: Array<{ at: string; level: "info" | "warn" | "error"; event: string; details?: string }>;
  version: number;
  warnings: string[];
}

interface StatusPageInput {
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

declare global {
  interface Window {
    __FIYUU_DATA__?: unknown;
    __FIYUU_ROUTE__?: string;
    __FIYUU_INTENT__?: string;
    __FIYUU_RENDER__?: RenderMode;
    __FIYUU_WS_PATH__?: string;
    __FIYUU_DEVTOOLS__?: unknown;
    fiyuu?: {
      theme: {
        get(): "light" | "dark";
        set(value: "light" | "dark"): void;
        toggle(): void;
        bindToggle(elementId: string): void;
        onChange(fn: (theme: "light" | "dark") => void): void;
      };
      bind(elementId: string, value?: unknown, asHtml?: boolean): void;
      partial(elementId: string, url: string, options?: { loading?: string }): Promise<void>;
      onError(callback: (event: { message: string; error: Error | null; source: string | null; line: number | null }) => void): void;
      state<T>(key: string, initialValue: T): {
        get(): T;
        set(value: T): void;
        bind(elementId: string): object;
        onChange(fn: (value: T) => void): object;
      };
      router: {
        navigate(url: string): Promise<void>;
        on(event: "navigate" | "before", fn: (detail: { route: string; render?: string; title?: string }) => void | false): object;
      };
      ws(overridePath?: string): {
        on(type: string, handler: (data: unknown) => void): object;
        onOpen(handler: () => void): object;
        onClose(handler: () => void): object;
        onError(handler: () => void): object;
        send(data: unknown): object;
        status(): "connecting" | "connected" | "closed" | "unavailable";
        socket: WebSocket;
      };
    };
  }
}

export async function startServer(options: StartServerOptions): Promise<StartedServer> {
  const state = await createRuntimeState(options);
  const liveClients = new Set<ServerResponse>();
  const websocketPath = options.config?.websocket?.path ?? "/__fiyuu/ws";

  if (options.mode === "dev") {
    const watchTargets = [options.appDirectory];
    const serverDir = path.join(options.rootDirectory, "server");
    const skillsDir = path.join(options.rootDirectory, "skills");
    if (existsSync(serverDir)) watchTargets.push(serverDir);
    if (existsSync(skillsDir)) watchTargets.push(skillsDir);

    const watcher = chokidar.watch(watchTargets, {
      ignoreInitial: true,
      ignored: /node_modules|\.fiyuu/,
    });

    watcher.on("all", async (eventName, filePath) => {
      pushServerEvent(state, "info", "watch.change", `${eventName} ${filePath}`);
      try {
        const nextState = await createRuntimeState(options);
        state.graph = nextState.graph;
        state.features = nextState.features;
        state.assets = nextState.assets;
        state.insights = nextState.insights;
        state.version = nextState.version;
        state.warnings = nextState.warnings;
        pushServerEvent(state, "info", "watch.rebuild", "runtime state refreshed");
      } catch (error) {
        const message = error instanceof Error ? error.message : "watch rebuild failed";
        pushServerEvent(state, "error", "watch.rebuild.error", message);
      }

      for (const response of liveClients) {
        response.write(`data: reload\n\n`);
      }
    });
  }

  const server = createServer(async (request, response) => {
    // Strip internal x-fiyuu-* headers set by the client runtime before they
    // can influence routing decisions. This prevents spoofing attacks similar
    // to the Next.js 15 middleware bypass (CVE-2025-29927).
    for (const key of Object.keys(request.headers)) {
      if (key.startsWith("x-fiyuu-") && key !== "x-fiyuu-navigate") {
        delete request.headers[key];
      }
    }
    // x-fiyuu-navigate is only trusted from same-origin JS (fetch with credentials).
    // We accept it but do not allow it to elevate any privilege.

    try {
      if (!request.url) {
        sendDocumentStatusPage(response, {
          statusCode: 400,
          title: "Malformed request",
          summary: "The incoming request does not include a valid URL.",
          detail: "Fiyuu cannot route a request without a pathname.",
          method: request.method ?? "GET",
          requestId: "",
          hints: [
            "Check the client or proxy that created this request.",
            "Verify the request URL is forwarded correctly.",
          ],
        });
        return;
      }

      const url = new URL(request.url, `http://localhost:${options.port ?? 4050}`);

      if (url.pathname === "/__fiyuu/live" && options.mode === "dev") {
        attachLiveReload(response, liveClients);
        return;
      }

      if (url.pathname === "/__fiyuu/devtools" && options.mode === "dev") {
        sendJson(response, 200, {
          version: state.version,
          warnings: state.warnings,
          config: {
            websocket: options.config?.websocket?.enabled ?? false,
            middleware: options.config?.middleware?.enabled ?? true,
            analytics: options.config?.analytics?.enabled ?? false,
            featureFlags: options.config?.featureFlags?.defaults ?? {},
          },
          insights: {
            summary: state.insights.summary,
            assistant: state.insights.assistant,
          },
          routes: state.features.map((feature) => ({ route: feature.route, render: feature.render })),
        });
        return;
      }

      if (url.pathname === "/__fiyuu/insights" && options.mode === "dev") {
        sendJson(response, 200, state.insights);
        return;
      }

      if (url.pathname === "/__fiyuu/server-events" && options.mode === "dev") {
        sendJson(response, 200, { events: state.serverEvents });
        return;
      }

      if (url.pathname.startsWith("/__fiyuu/client/")) {
        await serveClientAsset(response, path.join(options.staticClientRoot, path.basename(url.pathname)));
        return;
      }

      const requestId = options.config?.observability?.requestId === false ? "" : createRequestId();
      pushServerEvent(state, "info", "request.start", `${request.method ?? "GET"} ${url.pathname} ${requestId ? `(${requestId})` : ""}`);
      const middleware = await runMiddleware(options, url, request, options.mode, state.warnings, requestId);
      if (middleware?.response) {
        pushServerEvent(state, "info", "middleware.short-circuit", `${request.method ?? "GET"} ${url.pathname} -> ${middleware.response.status ?? 200}`);
        if (requestId) {
          response.setHeader("x-fiyuu-request-id", requestId);
        }
        for (const [key, value] of Object.entries(middleware.headers ?? {})) {
          response.setHeader(key, value);
        }
        if (middleware.response.json !== undefined) {
          sendJson(response, middleware.response.status ?? 200, middleware.response.json);
          return;
        }
        sendText(response, middleware.response.status ?? 200, middleware.response.body ?? "");
        return;
      }

      if (url.pathname.startsWith("/api")) {
        await handleApiRoute(request, response, options, url.pathname, middleware?.headers ?? {}, requestId, options.mode);
        pushServerEvent(state, "info", "request.api", `${request.method ?? "GET"} ${url.pathname}`);
        return;
      }

      await handleRoute(
        request,
        response,
        url.pathname,
        state,
        options.appDirectory,
        options.mode,
        middleware?.headers ?? {},
        options.config?.developerTools?.enabled !== false,
        requestId,
        websocketPath,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      pushServerEvent(state, "error", "request.error", err.message);
      if (options.config?.errors?.handler) {
        try {
          await options.config.errors.handler(err, {
            route: request.url ?? "/",
            method: request.method ?? "GET",
            requestId: options.config?.observability?.requestId === false ? "" : createRequestId(),
          });
        } catch {
          // error handler must not throw
        }
      }
      await sendRuntimeError(response, error, options, request);
    }
  });

  const websocketUrl = await attachWebsocketServer(server, options, websocketPath);

  const port = await listenWithFallback(server, options.port ?? 4050, options.maxPort ?? (options.port ?? 4050) + 20);
  const url = `http://localhost:${port}`;

  console.log(renderStartupMessage(options.mode, url, port, options.port ?? 4050, websocketUrl));

  return {
    port,
    url,
    websocketUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function createRuntimeState(options: StartServerOptions): Promise<RuntimeState> {
  const graph = await createProjectGraph(options.appDirectory);
  const features = await scanApp(options.appDirectory);
  await syncProjectArtifacts(options.rootDirectory, options.appDirectory);
  const assets = await bundleClient(features, options.clientOutputDirectory);
  const insights = await buildInsightsReport({
    rootDirectory: options.rootDirectory,
    appDirectory: options.appDirectory,
    features,
    config: options.config,
  });

  return {
    graph,
    features,
    assets,
    insights,
    ssgCache: new Map<string, string>(),
    queryCache: new Map<string, QueryCacheEntry>(),
    serverEvents: [],
    version: Date.now(),
    warnings: features.flatMap((feature) => feature.warnings.map((warning) => `${feature.route}: ${warning}`)),
  };
}

// ── Dynamic route matching ─────────────────────────────────────────────────

interface RouteMatch {
  feature: FeatureRecord;
  params: Record<string, string>;
}

function buildRouteRegex(route: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const parts = route.split("/").filter(Boolean);
  const regexParts = parts.map((segment) => {
    const optionalCatchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
    if (optionalCatchAll) {
      paramNames.push(optionalCatchAll[1]);
      return `(?:/(.*))?`;
    }
    const catchAll = segment.match(/^\[\.\.\.(\w+)\]$/);
    if (catchAll) {
      paramNames.push(catchAll[1]);
      return `(.+)`;
    }
    const dynamic = segment.match(/^\[(\w+)\]$/);
    if (dynamic) {
      paramNames.push(dynamic[1]);
      return `([^/]+)`;
    }
    return segment.replace(/[$()*+.[\]?\\^{}|]/g, "\\$&");
  });
  return { regex: new RegExp(`^/${regexParts.join("/")}$`), paramNames };
}

function matchRoute(features: FeatureRecord[], pathname: string): RouteMatch | null {
  // Static routes take priority.
  const exact = features.find((f) => f.route === pathname && !f.isDynamic);
  if (exact) return { feature: exact, params: {} };

  // Dynamic routes — sorted so fewer dynamic segments win (more specific first).
  const dynamic = features
    .filter((f) => f.isDynamic)
    .sort((a, b) => a.params.length - b.params.length);

  for (const feature of dynamic) {
    const { regex, paramNames } = buildRouteRegex(feature.route);
    const match = pathname.match(regex);
    if (!match) continue;
    const params: Record<string, string> = {};
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match[i + 1] ?? "";
    }
    return { feature, params };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

async function handleRoute(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
  state: RuntimeState,
  appDirectory: string,
  mode: "dev" | "start",
  middlewareHeaders: Record<string, string>,
  developerToolsEnabled: boolean,
  requestId: string,
  websocketPath: string,
): Promise<void> {
  const routeMatch = matchRoute(state.features, pathname);
  const feature = routeMatch?.feature ?? null;
  const routeParams = routeMatch?.params ?? {};

  if (!feature) {
    const customNotFound = await tryRenderSystemPage({
      appDirectory,
      mode,
      kind: "not-found",
      route: pathname,
      method: request.method ?? "GET",
      requestId,
      data: {
        route: pathname,
        method: request.method ?? "GET",
        title: "Page not found",
      },
      metaFallback: {
        intent: "Fallback not found page",
        title: "Page not found",
      },
      websocketPath,
    });
    if (customNotFound) {
      response.statusCode = 404;
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(customNotFound);
      return;
    }

    sendDocumentStatusPage(response, {
      statusCode: 404,
      title: "Page not found",
      summary: "This route is not defined in the application.",
      detail: `No feature matches "${pathname}".`,
      route: pathname,
      method: request.method ?? "GET",
      requestId,
      hints: [
        "Confirm the route folder exists under app/.",
        "Check nested feature names and file-based routing paths.",
        "If this page should exist, run `fiyuu sync` and rebuild.",
      ],
      diagnostics: state.features.slice(0, 6).map((item) => `Available route: ${item.route}`),
    });
    return;
  }

  if (request.method === "POST") {
    await handleActionRequest(request, response, feature, mode, middlewareHeaders, requestId);
    return;
  }

  if (!feature.files["page.tsx"]) {
    sendDocumentStatusPage(response, {
      statusCode: 404,
      title: "Page file missing",
      summary: "The route exists, but it does not provide a `page.tsx` entry.",
      detail: `Feature ${feature.feature || "/"} is missing its page component.`,
      route: pathname,
      method: request.method ?? "GET",
      requestId,
      hints: [
        "Add `page.tsx` to the feature directory.",
        "If this route should only expose an action or API, avoid opening it directly in the browser.",
      ],
      diagnostics: [
        `Feature path: ${feature.feature || "/"}`,
        `Known files: ${Object.keys(feature.files).join(", ") || "none"}`,
      ],
    });
    return;
  }

  const startedAt = performance.now();
  if (feature.render === "ssg" && mode === "start") {
    const cached = state.ssgCache.get(feature.route);
    if (cached) {
      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.setHeader("x-fiyuu-cache", "ssg-hit");
      if (requestId) {
        response.setHeader("x-fiyuu-request-id", requestId);
      }
      for (const [key, value] of Object.entries(middlewareHeaders)) {
        response.setHeader(key, value);
      }
      response.end(cached);
      return;
    }
  }
  const pageModule = (await importModule(feature.files["page.tsx"]!, mode)) as ModuleShape;
  const queryModule = feature.files["query.ts"] ? ((await importModule(feature.files["query.ts"]!, mode)) as ModuleShape) : null;
  const asset = state.assets.find((item) => item.route === feature.route);
  const Page = pageModule.default;

  if (!Page) {
    sendDocumentStatusPage(response, {
      statusCode: 500,
      title: "Invalid page module",
      summary: "The route loaded successfully, but its page module has no default export.",
      detail: `Expected a default Gea component in ${feature.files["page.tsx"]}.`,
      route: pathname,
      method: request.method ?? "GET",
      requestId,
      hints: [
        "Export a default Gea component from `page.tsx`.",
        "Make sure the file does not only export helpers or metadata.",
      ],
    });
    return;
  }

  let data: unknown = null;
  if (queryModule?.execute) {
    const cacheConfig = (queryModule as ModuleShape).cache;
    if (cacheConfig?.ttl && cacheConfig.ttl > 0) {
      const varyValues = (cacheConfig.vary ?? []).map((key) => new URL(request.url ?? "/", "http://localhost").searchParams.get(key) ?? "");
      const cacheKey = `${feature.route}:${JSON.stringify(routeParams)}:${varyValues.join(",")}`;
      const cached = state.queryCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        data = cached.data;
        pushServerEvent(state, "info", "query.cache-hit", `${pathname} (ttl=${cacheConfig.ttl}s)`);
      } else {
        data = await queryModule.execute({ request, route: pathname, feature, params: routeParams });
        state.queryCache.set(cacheKey, { data, expiresAt: Date.now() + cacheConfig.ttl * 1000 });
      }
    } else {
      data = await queryModule.execute({ request, route: pathname, feature, params: routeParams });
    }
  }
  const intent = feature.intent ?? feature.pageIntent ?? pageModule.page?.intent ?? "";
  const render = feature.render;
  const layoutStack = await loadLayoutStack(appDirectory, feature, mode);
  const mergedMeta = mergeMetaDefinitions(...layoutStack.map((item) => item.meta), await loadFeatureMeta(feature, mode));

  let body = "";
  if (render === "ssr") {
    const pageProps = {
      data,
      route: pathname,
      intent,
      render,
      params: routeParams,
    };
    const pageBody = renderGeaComponent(Page, pageProps);
    body = layoutStack.reduceRight<string>(
      (children, layout) => renderGeaComponent(layout.component, { route: pathname, children }),
      pageBody,
    );
  }
  const renderTimeMs = Number((performance.now() - startedAt).toFixed(2));

  // Client-side navigation: return JSON payload instead of full document.
  const isNavigationRequest = request.headers["x-fiyuu-navigate"] === "1";
  if (isNavigationRequest) {
    const navPayload = JSON.stringify({
      body,
      title: mergedMeta.seo?.title ?? mergedMeta.title ?? "Fiyuu",
      description: mergedMeta.seo?.description ?? intent ?? "",
      route: pathname,
      render,
      data,
      clientPath: asset?.publicPath ?? null,
    });
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("x-fiyuu-navigate", "1");
    response.setHeader("server-timing", `render;dur=${renderTimeMs}`);
    if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
    for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
    response.end(`${navPayload}\n`);
    pushServerEvent(state, "info", "request.navigate", `${pathname} (${render.toUpperCase()}) ${renderTimeMs}ms`);
    return;
  }

  const html = renderDocument({
    body,
    data,
    route: pathname,
    intent,
    render,
    clientPath: asset?.publicPath ?? null,
    liveReload: mode === "dev",
    warnings: feature.warnings,
    renderTimeMs,
    developerTools: developerToolsEnabled,
    requestId,
    meta: mergedMeta,
    websocketPath,
  });

  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("server-timing", `render;dur=${renderTimeMs}`);
  for (const [key, value] of Object.entries(middlewareHeaders)) {
    response.setHeader(key, value);
  }
  if (requestId) {
    response.setHeader("x-fiyuu-request-id", requestId);
  }
  response.end(html);
  pushServerEvent(state, "info", "request.page", `${pathname} (${render.toUpperCase()}) ${renderTimeMs}ms`);
  if (render === "ssg" && mode === "start") {
    state.ssgCache.set(feature.route, html);
  }
}

async function tryRenderSystemPage(input: {
  appDirectory: string;
  mode: "dev" | "start";
  kind: "not-found" | "error";
  route: string;
  method: string;
  requestId: string;
  data: unknown;
  metaFallback: MetaDefinition;
  websocketPath: string;
}): Promise<string | null> {
  const filePath = path.join(input.appDirectory, input.kind === "not-found" ? "not-found.tsx" : "error.tsx");
  if (!existsSync(filePath)) {
    return null;
  }

  const module = (await importModule(filePath, input.mode)) as ModuleShape;
  if (!module.default) {
    return null;
  }

  let body = renderGeaComponent(module.default, {
    data: input.data,
    route: input.route,
    intent: input.metaFallback.intent ?? "",
    render: "ssr",
  });

  const rootLayoutPath = path.join(input.appDirectory, "layout.tsx");
  if (existsSync(rootLayoutPath)) {
    const rootLayoutModule = (await importModule(rootLayoutPath, input.mode)) as LayoutModule;
    if (rootLayoutModule.default) {
      body = renderGeaComponent(rootLayoutModule.default, { route: input.route, children: body });
    }
  }

  const rootMeta = await loadLayoutMeta(input.appDirectory, input.mode);
  return renderDocument({
    body,
    data: input.data,
    route: input.route,
    intent: input.metaFallback.intent ?? "",
    render: "ssr",
    clientPath: null,
    liveReload: input.mode === "dev",
    warnings: [],
    renderTimeMs: 0,
    developerTools: false,
    requestId: input.requestId,
    meta: mergeMetaDefinitions(rootMeta, input.metaFallback),
    websocketPath: input.websocketPath,
  });
}

async function handleActionRequest(
  request: IncomingMessage,
  response: ServerResponse,
  feature: FeatureRecord,
  mode: "dev" | "start",
  middlewareHeaders: Record<string, string>,
  requestId: string,
): Promise<void> {
  if (!feature.files["action.ts"]) {
    sendText(response, 405, `No action available for ${feature.route}`);
    return;
  }

  const actionModule = (await importModule(feature.files["action.ts"]!, mode)) as ModuleShape;
  if (!actionModule.execute) {
    sendText(response, 500, `Missing execute export in ${feature.files["action.ts"]}`);
    return;
  }

  const input = await parseRequestBody(request);
  const context = { request, route: feature.route, feature, input };
  let result: unknown;

  try {
    result = await actionModule.execute(context);
  } catch (error) {
    if (error instanceof TypeError) {
      result = await actionModule.execute(input);
    } else {
      throw error;
    }
  }

  response.statusCode = 200;
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (requestId) {
    response.setHeader("x-fiyuu-request-id", requestId);
  }
  for (const [key, value] of Object.entries(middlewareHeaders)) {
    response.setHeader(key, value);
  }
  response.end(`${JSON.stringify(result ?? null)}\n`);
}

async function handleApiRoute(
  request: IncomingMessage,
  response: ServerResponse,
  options: StartServerOptions,
  pathname: string,
  middlewareHeaders: Record<string, string>,
  requestId: string,
  mode: "dev" | "start",
): Promise<void> {
  const modulePath = resolveApiRouteModule(options.appDirectory, pathname);
  if (!modulePath) {
    sendText(response, 404, `No API route found for ${pathname}`);
    return;
  }

  const routeModule = (await importModule(modulePath, mode)) as ApiRouteModule;
  const method = (request.method ?? "GET").toUpperCase() as keyof ApiRouteModule;
  const handler = routeModule[method];
  if (!handler) {
    sendText(response, 405, `Method ${method} is not supported for ${pathname}`);
    return;
  }

  const input = await parseRequestBody(request);
  const result = await handler({ request, route: pathname, feature: null as any, input });
  response.statusCode = 200;
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (requestId) {
    response.setHeader("x-fiyuu-request-id", requestId);
  }
  for (const [key, value] of Object.entries(middlewareHeaders)) {
    response.setHeader(key, value);
  }
  response.end(`${JSON.stringify(result ?? null)}\n`);
}

function resolveApiRouteModule(appDirectory: string, pathname: string): string | null {
  const relativePath = pathname.replace(/^\//, "");
  const normalizedRoot = path.resolve(appDirectory) + path.sep;

  const directModule = path.resolve(appDirectory, relativePath, "route.ts");
  if (!directModule.startsWith(normalizedRoot)) return null; // path traversal guard
  if (existsSync(directModule)) return directModule;

  const rootModule = path.resolve(appDirectory, relativePath + ".ts");
  if (!rootModule.startsWith(normalizedRoot)) return null; // path traversal guard
  return existsSync(rootModule) ? rootModule : null;
}

async function importModule(modulePath: string, mode: "dev" | "start"): Promise<unknown> {
  const fileUrl = pathToFileURL(modulePath).href;
  return import(mode === "dev" ? `${fileUrl}?t=${Date.now()}` : fileUrl);
}

async function loadLayoutStack(appDirectory: string, feature: FeatureRecord, mode: "dev" | "start"): Promise<Array<{ component: unknown; meta: MetaDefinition }>> {
  const parts = feature.feature ? feature.feature.split("/") : [];
  const directories = [appDirectory];
  for (let index = 0; index < parts.length; index += 1) {
    directories.push(path.join(appDirectory, ...parts.slice(0, index + 1)));
  }

  const stack: Array<{ component: unknown; meta: MetaDefinition }> = [];
  for (const directory of directories) {
    const layoutFile = path.join(directory, "layout.tsx");
    const metaFile = path.join(directory, "layout.meta.ts");
    if (existsSync(layoutFile)) {
      const module = (await importModule(layoutFile, mode)) as LayoutModule;
      if (module.default) {
        stack.push({ component: module.default, meta: await loadMetaFile(metaFile, mode) });
      }
    }
  }
  return stack;
}

async function loadFeatureMeta(feature: FeatureRecord, mode: "dev" | "start"): Promise<MetaDefinition> {
  return feature.files["meta.ts"] ? loadMetaFile(feature.files["meta.ts"], mode) : { intent: feature.intent ?? "" };
}

async function loadLayoutMeta(directory: string, mode: "dev" | "start"): Promise<MetaDefinition> {
  return loadMetaFile(path.join(directory, "layout.meta.ts"), mode);
}

async function loadMetaFile(filePath: string, mode: "dev" | "start"): Promise<MetaDefinition> {
  if (!existsSync(filePath)) {
    return { intent: "" };
  }
  const module = (await importModule(filePath, mode)) as { default?: MetaDefinition };
  return module.default ?? { intent: "" };
}

function mergeMetaDefinitions(...definitions: MetaDefinition[]): MetaDefinition {
  return definitions.reduce<MetaDefinition>(
    (current, item) => ({
      ...current,
      ...item,
      seo: {
        ...current.seo,
        ...item.seo,
      },
    }),
    { intent: "" },
  );
}

function renderGeaComponent(component: unknown, props: Record<string, unknown>): string {
  if (typeof component !== "function") {
    throw new Error("Route module default export must be a Gea component class or function.");
  }

  const candidate = component as {
    prototype?: { template?: (props?: Record<string, unknown>) => string };
    new (props?: Record<string, unknown>): GeaRenderable;
    (props?: Record<string, unknown>): unknown;
  };
  const componentKey = candidate as unknown as Function;

  const cachedMode = geaComponentModeCache.get(componentKey);
  const mode = cachedMode ?? (typeof candidate.prototype?.template === "function" ? "class" : "function");
  if (!cachedMode) {
    geaComponentModeCache.set(componentKey, mode);
  }

  if (mode === "class") {
    const instance = new candidate(props);
    if (typeof instance.template === "function") {
      return String(instance.template(instance.props ?? props));
    }
    return String(instance.toString());
  }

  return String(candidate(props));
}


async function serveClientAsset(response: ServerResponse, assetPath: string): Promise<void> {
  if (!existsSync(assetPath)) {
    sendText(response, 404, `Missing client asset ${assetPath}`);
    return;
  }

  response.statusCode = 200;
  response.setHeader("content-type", "text/javascript; charset=utf-8");
  createReadStream(assetPath).pipe(response);
}

function attachLiveReload(response: ServerResponse, liveClients: Set<ServerResponse>): void {
  response.writeHead(200, {
    "cache-control": "no-cache",
    connection: "keep-alive",
    "content-type": "text/event-stream",
  });

  response.write(`data: ready\n\n`);
  liveClients.add(response);
  response.on("close", () => {
    liveClients.delete(response);
  });
}

function renderDocument(input: {
  body: string;
  data: unknown;
  route: string;
  intent: string;
  render: RenderMode;
  clientPath: string | null;
  liveReload: boolean;
  warnings: string[];
  renderTimeMs: number;
  developerTools: boolean;
  requestId: string;
  meta: MetaDefinition;
  websocketPath: string;
}): string {
  const liveReloadScript = input.liveReload
    ? `<script type="module">const events=new EventSource('/__fiyuu/live');events.onmessage=(event)=>{if(event.data==='reload'){location.reload();}};</script>`
    : "";
  const liveErrorDebuggerScript = input.liveReload
    ? `<script type="module">(function(){const host=document.createElement('aside');host.style.cssText='position:fixed;left:12px;top:12px;z-index:10000;max-width:min(560px,calc(100vw - 24px));background:#2a1717;color:#ffe9e9;border:1px solid #7f3e3e;border-radius:12px;padding:10px 12px;font:12px/1.45 ui-monospace,monospace;white-space:pre-wrap;display:none';const title=document.createElement('div');title.style.cssText='font-weight:700;margin-bottom:6px';title.textContent='Fiyuu Live Error';const body=document.createElement('div');const close=document.createElement('button');close.textContent='dismiss';close.style.cssText='margin-top:8px;border:1px solid #9f5b5b;background:transparent;color:#ffe9e9;border-radius:999px;padding:2px 8px;cursor:pointer';close.addEventListener('click',()=>{host.style.display='none';});host.append(title,body,close);function show(message){body.textContent=message;host.style.display='block';if(!host.isConnected)document.body.appendChild(host);}window.addEventListener('error',(event)=>{const stack=event.error&&event.error.stack?event.error.stack:'';show(String(event.message||'Unknown runtime error')+(stack?'\n\n'+stack:''));});window.addEventListener('unhandledrejection',(event)=>{const reason=event.reason instanceof Error?(event.reason.stack||event.reason.message):String(event.reason||'Unhandled promise rejection');show(reason);});})();</script>`
    : "";
  const clientRuntime = buildClientRuntime(input.websocketPath);
  const clientScript = input.clientPath ? `<script type="module" src="${input.clientPath}"></script>` : "";
  const unifiedToolsScript = input.liveReload && input.developerTools ? renderUnifiedToolsScript(input) : "";
  const insightsScript = "";
  const devtoolsScript = "";

  return `<!doctype html>
<html lang="en" data-render-mode="${input.render}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.meta.seo?.title ?? input.meta.title ?? "Fiyuu")}</title>
    <meta name="description" content="${escapeHtml(input.meta.seo?.description ?? (input.intent || "Fiyuu application"))}" />
    <script>
      // Theme detection runs before anything else to prevent flash of wrong theme.
      (function(){
        try {
          var saved = localStorage.getItem('fiyuu-theme');
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          var isDark = saved === 'dark' || (!saved && prefersDark);
          document.documentElement.classList.toggle('dark', isDark);
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } catch(e) {}
      })();
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      // Tailwind CDN config must be set after the script loads.
      if (typeof tailwind !== 'undefined') {
        tailwind.config = { darkMode: 'class' };
      }
    </script>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      :root { color-scheme: light; }
      html.dark { color-scheme: dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f7f8f5; color: #172018; }
      html.dark body { background: #111513; color: #f0f5ee; }
      #app { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app">${input.body}</div>
    <script>window.__FIYUU_DATA__=${serialize(input.data)};window.__FIYUU_ROUTE__=${JSON.stringify(input.route)};window.__FIYUU_INTENT__=${JSON.stringify(input.intent)};window.__FIYUU_RENDER__=${JSON.stringify(input.render)};window.__FIYUU_WS_PATH__=${JSON.stringify(input.websocketPath)};</script>
    ${clientRuntime}
    ${clientScript}
    ${unifiedToolsScript}
    ${devtoolsScript}
    ${insightsScript}
    ${liveErrorDebuggerScript}
    ${liveReloadScript}
  </body>
</html>`;
}

function renderInsightsPanelScript(): string {
  return `<script type="module">
const host=document.createElement('div');
host.style.cssText='position:fixed;left:16px;bottom:16px;z-index:9998;font:12px/1.5 ui-monospace,monospace';
const toggle=document.createElement('button');
toggle.textContent='Fiyuu Insights';
toggle.style.cssText='border:1px solid rgba(197,214,181,.18);background:rgba(18,24,19,.94);color:#f8f3ea;border-radius:999px;padding:10px 14px;box-shadow:0 18px 56px rgba(0,0,0,.22);cursor:pointer';
const panel=document.createElement('aside');
panel.style.cssText='display:none;margin-top:10px;width:min(420px,calc(100vw - 30px));max-height:min(72vh,620px);overflow:auto;background:rgba(18,24,19,.96);color:#f8f3ea;border:1px solid rgba(197,214,181,.16);border-radius:18px;padding:14px 16px;box-shadow:0 18px 56px rgba(0,0,0,.22);backdrop-filter:blur(14px)';
toggle.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none';});

function renderItems(items){
  if(!items.length){return '<li style="margin-top:6px">No findings.</li>'}
  return items.slice(0,8).map((item)=>'<li style="margin-top:8px"><strong>['+item.severity.toUpperCase()+'] '+item.title+'</strong><br/><span style="opacity:.82">'+item.summary+'</span><br/><span style="opacity:.7">'+item.recommendation+'</span></li>').join('');
}

async function mount(){
  const response=await fetch('/__fiyuu/insights');
  const data=await response.json();
  const byCategory={
    security:(data.items||[]).filter((item)=>item.category==='security'),
    performance:(data.items||[]).filter((item)=>item.category==='performance'),
    design:(data.items||[]).filter((item)=>item.category==='design'),
    architecture:(data.items||[]).filter((item)=>item.category==='architecture'),
  };
  panel.innerHTML=''
    +'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>AI Insights</strong><span style="opacity:.7">'+(data.generatedAt||'')+'</span></div>'
    +'<p style="margin:8px 0 0;opacity:.82">'+data.summary.high+' high · '+data.summary.medium+' medium · '+data.summary.low+' low</p>'
    +'<div style="margin-top:10px;display:flex;gap:8px"><button data-tab="findings" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:rgba(255,255,255,.06);color:#f8f3ea;cursor:pointer">Findings</button><button data-tab="assistant" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Assistant</button></div>'
    +'<section data-view="findings" style="margin-top:10px">'
    +'<p style="margin:0"><strong>Security</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.security)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Performance</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.performance)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Design</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.design)+'</ul>'
    +'<p style="margin:10px 0 0"><strong>Architecture</strong></p><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.architecture)+'</ul>'
    +'</section>'
    +'<section data-view="assistant" style="display:none;margin-top:10px">'
    +'<p style="margin:0;opacity:.84">Mode: '+data.assistant.mode+' · '+data.assistant.status+'</p>'
    +'<p style="margin:8px 0 0;opacity:.72">'+data.assistant.details+'</p>'
    +'<ul style="margin:8px 0 0;padding-left:18px">'+(data.assistant.suggestions||[]).map((line)=>'<li style="margin-top:6px">'+line+'</li>').join('')+'</ul>'
    +'</section>';

  const findingsButton=panel.querySelector('[data-tab="findings"]');
  const assistantButton=panel.querySelector('[data-tab="assistant"]');
  const findingsView=panel.querySelector('[data-view="findings"]');
  const assistantView=panel.querySelector('[data-view="assistant"]');
  findingsButton?.addEventListener('click',()=>{findingsView.style.display='block';assistantView.style.display='none';findingsButton.style.background='rgba(255,255,255,.06)';assistantButton.style.background='transparent';});
  assistantButton?.addEventListener('click',()=>{findingsView.style.display='none';assistantView.style.display='block';assistantButton.style.background='rgba(255,255,255,.06)';findingsButton.style.background='transparent';});
}

mount().catch((error)=>{console.warn('Fiyuu insights panel failed',error);});
host.append(toggle,panel);
document.body.append(host);
</script>`;
}

function renderUnifiedToolsScript(input: {
  route: string;
  render: RenderMode;
  renderTimeMs: number;
  warnings: string[];
  requestId: string;
}): string {
  const metrics = JSON.stringify({
    route: input.route,
    render: input.render,
    renderTimeMs: input.renderTimeMs,
    warnings: input.warnings,
    requestId: input.requestId,
  });

  return `<script type="module">(function(){
const metrics=${metrics};
const removeLegacyPanels=()=>{const old=[...document.querySelectorAll('button')].filter((button)=>button.textContent==='Fiyuu Devtools'||button.textContent==='Fiyuu Insights');for(const button of old){const host=button.closest('div');if(host&&host.parentNode){host.parentNode.removeChild(host);}}};
removeLegacyPanels();
setInterval(removeLegacyPanels,500);

const host=document.createElement('div');
host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:10001;font:12px/1.5 ui-monospace,monospace';
const toggle=document.createElement('button');
toggle.textContent='Fiyuu Console';
toggle.style.cssText='border:1px solid rgba(197,214,181,.18);background:rgba(18,24,19,.94);color:#f8f3ea;border-radius:999px;padding:10px 14px;box-shadow:0 18px 56px rgba(0,0,0,.22);cursor:pointer';
const panel=document.createElement('aside');
panel.style.cssText='display:none;margin-top:10px;width:min(500px,calc(100vw - 30px));max-height:min(78vh,700px);overflow:auto;background:rgba(18,24,19,.96);color:#f8f3ea;border:1px solid rgba(197,214,181,.16);border-radius:18px;padding:14px 16px;box-shadow:0 18px 56px rgba(0,0,0,.22);backdrop-filter:blur(14px)';
toggle.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none';});

let serverTraceEnabled=false;
let pollingId;
const renderItems=(items)=>{if(!items.length){return '<li style="margin-top:6px">No findings.</li>';}return items.slice(0,8).map((item)=>'<li style="margin-top:8px"><strong>['+item.severity.toUpperCase()+'] '+item.title+'</strong><br/><span style="opacity:.82">'+item.summary+'</span><br/><span style="opacity:.72">'+item.recommendation+'</span></li>').join('');};
const renderServerItems=(events)=>{if(!events||!events.length){return '<li style="margin-top:6px">No server activity yet.</li>';}return events.slice(0,40).map((event)=>'<li style="margin-top:8px"><strong>'+event.event+'</strong><span style="opacity:.7"> ['+event.level.toUpperCase()+']</span><br/><span style="opacity:.75">'+event.at+'</span><br/><span style="opacity:.82">'+(event.details||'')+'</span></li>').join('');};
const refreshServerEvents=async()=>{if(!serverTraceEnabled){return;}const response=await fetch('/__fiyuu/server-events');if(!response.ok){return;}const payload=await response.json();const list=panel.querySelector('[data-server-list]');if(list){list.innerHTML=renderServerItems(payload.events||[]);}};
const startServerTrace=()=>{if(pollingId){clearInterval(pollingId);}pollingId=setInterval(()=>{refreshServerEvents().catch(()=>{});},1200);refreshServerEvents().catch(()=>{});};
const stopServerTrace=()=>{if(pollingId){clearInterval(pollingId);pollingId=undefined;}};

const mount=async()=>{
  const [runtimeResponse,insightsResponse]=await Promise.all([fetch('/__fiyuu/devtools'),fetch('/__fiyuu/insights')]);
  const runtime=runtimeResponse.ok?await runtimeResponse.json():{warnings:[],config:{featureFlags:{}}};
  const insights=insightsResponse.ok?await insightsResponse.json():{summary:{high:0,medium:0,low:0},assistant:{mode:'rule-only',status:'fallback',details:'unavailable'},items:[]};
  const warnings=(metrics.warnings.length?metrics.warnings:(runtime.warnings||[])).slice(0,4);
  const flags=Object.entries((runtime.config&&runtime.config.featureFlags)||{}).map(([k,v])=>'<span style="display:inline-flex;margin:4px 6px 0 0;padding:3px 8px;border-radius:999px;background:rgba(233,240,224,.08)">'+k+': '+v+'</span>').join('')||'<span style="opacity:.7">none</span>';
  const byCategory={security:(insights.items||[]).filter((i)=>i.category==='security'),performance:(insights.items||[]).filter((i)=>i.category==='performance'),design:(insights.items||[]).filter((i)=>i.category==='design'),architecture:(insights.items||[]).filter((i)=>i.category==='architecture')};

  panel.innerHTML=''
    +'<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>Fiyuu Console</strong><span style="opacity:.7">'+metrics.requestId+'</span></div>'
    +'<div style="margin-top:10px;display:flex;gap:8px"><button data-tab="runtime" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:rgba(255,255,255,.06);color:#f8f3ea;cursor:pointer">Runtime</button><button data-tab="insights" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Insights</button><button data-tab="server" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;cursor:pointer">Server</button></div>'
    +'<section data-view="runtime" style="margin-top:12px"><p style="margin:0;opacity:.86">Route <strong>'+metrics.route+'</strong> · '+String(metrics.render).toUpperCase()+' · '+metrics.renderTimeMs+'ms</p><p style="margin:8px 0 0;opacity:.7">Warnings</p><ul style="margin:6px 0 0;padding-left:18px">'+(warnings.map((w)=>'<li style="margin-top:6px">'+w+'</li>').join('')||'<li style="margin-top:6px">none</li>')+'</ul><p style="margin:10px 0 0;opacity:.7">Feature Flags</p><div style="margin-top:6px">'+flags+'</div></section>'
    +'<section data-view="insights" style="display:none;margin-top:12px"><p style="margin:0;opacity:.86">'+insights.summary.high+' high · '+insights.summary.medium+' medium · '+insights.summary.low+' low</p><p style="margin:8px 0 0;opacity:.72">Assistant: '+insights.assistant.mode+' ('+insights.assistant.status+')</p><p style="margin:8px 0 0;opacity:.72">'+insights.assistant.details+'</p><div style="margin-top:10px"><strong>Security</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.security)+'</ul></div><div style="margin-top:10px"><strong>Performance</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.performance)+'</ul></div><div style="margin-top:10px"><strong>Design</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.design)+'</ul></div><div style="margin-top:10px"><strong>Architecture</strong><ul style="margin:6px 0 0;padding-left:18px">'+renderItems(byCategory.architecture)+'</ul></div></section>'
    +'<section data-view="server" style="display:none;margin-top:12px"><label style="display:flex;align-items:center;gap:8px"><input data-server-toggle type="checkbox"/> <span>Enable live server trace (dev only)</span></label><ul data-server-list style="margin:10px 0 0;padding-left:18px"></ul></section>';

  const runtimeButton=panel.querySelector('[data-tab="runtime"]');
  const insightsButton=panel.querySelector('[data-tab="insights"]');
  const serverButton=panel.querySelector('[data-tab="server"]');
  const runtimeView=panel.querySelector('[data-view="runtime"]');
  const insightsView=panel.querySelector('[data-view="insights"]');
  const serverView=panel.querySelector('[data-view="server"]');
  const serverToggle=panel.querySelector('[data-server-toggle]');

  runtimeButton?.addEventListener('click',()=>{runtimeView.style.display='block';insightsView.style.display='none';serverView.style.display='none';runtimeButton.style.background='rgba(255,255,255,.06)';insightsButton.style.background='transparent';serverButton.style.background='transparent';});
  insightsButton?.addEventListener('click',()=>{runtimeView.style.display='none';insightsView.style.display='block';serverView.style.display='none';insightsButton.style.background='rgba(255,255,255,.06)';runtimeButton.style.background='transparent';serverButton.style.background='transparent';});
  serverButton?.addEventListener('click',()=>{runtimeView.style.display='none';insightsView.style.display='none';serverView.style.display='block';serverButton.style.background='rgba(255,255,255,.06)';runtimeButton.style.background='transparent';insightsButton.style.background='transparent';});
  serverToggle?.addEventListener('change',(event)=>{serverTraceEnabled=Boolean(event.target&&event.target.checked);if(serverTraceEnabled){startServerTrace();}else{stopServerTrace();}});
};

mount().catch((error)=>{console.warn('Fiyuu console mount failed',error);});
host.append(toggle,panel);
document.body.append(host);
})();</script>`;
}

function serialize(value: unknown): string {
  return JSON.stringify(value ?? null).replaceAll("<", "\\u003c");
}

function pushServerEvent(
  state: RuntimeState,
  level: "info" | "warn" | "error",
  event: string,
  details?: string,
): void {
  state.serverEvents.unshift({
    at: new Date().toISOString(),
    level,
    event,
    details,
  });
  if (state.serverEvents.length > 120) {
    state.serverEvents.length = 120;
  }
}

function sendText(response: ServerResponse, statusCode: number, message: string): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end(message);
}

function sendDocumentStatusPage(response: ServerResponse, input: StatusPageInput): void {
  response.statusCode = input.statusCode;
  response.setHeader("content-type", "text/html; charset=utf-8");
  if (input.requestId) {
    response.setHeader("x-fiyuu-request-id", input.requestId);
  }
  response.end(renderStatusPage(input));
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

const MAX_BODY_BYTES = 1_048_576; // 1 MB

async function parseRequestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw Object.assign(new Error("Request body too large (limit: 1 MB)."), { statusCode: 413 });
    }
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  const contentType = request.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(rawBody);
    // Reject attempts to pollute Object.prototype via JSON keys.
    if (parsed !== null && typeof parsed === "object") {
      if ("__proto__" in parsed || "constructor" in parsed || "prototype" in parsed) {
        throw Object.assign(new Error("Request body contains forbidden keys."), { statusCode: 400 });
      }
    }
    return parsed as Record<string, unknown>;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const entries = [...new URLSearchParams(rawBody).entries()].filter(
      ([key]) => key !== "__proto__" && key !== "constructor" && key !== "prototype",
    );
    return Object.fromEntries(entries);
  }

  return { raw: rawBody };
}

async function sendRuntimeError(response: ServerResponse, error: unknown, options: StartServerOptions, request?: IncomingMessage): Promise<void> {
  const mode = options.mode;
  const message = error instanceof Error ? error.message : "Unknown runtime error";
  const diagnostics: string[] = [];

  if (request && !prefersHtmlResponse(request)) {
    sendJson(response, 500, {
      error: {
        message,
        requestId: typeof response.getHeader("x-fiyuu-request-id") === "string" ? String(response.getHeader("x-fiyuu-request-id")) : undefined,
        ...(mode === "dev" && error instanceof Error && error.stack ? { stack: error.stack } : {}),
      },
    });
    return;
  }

  const customErrorPage = await tryRenderSystemPage({
    appDirectory: options.appDirectory,
    mode,
    kind: "error",
    route: request?.url ?? "/",
    method: request?.method ?? "GET",
    requestId: typeof response.getHeader("x-fiyuu-request-id") === "string" ? String(response.getHeader("x-fiyuu-request-id")) : "",
    data: {
      message,
      route: request?.url ?? "/",
      method: request?.method ?? "GET",
      stack: mode === "dev" && error instanceof Error ? error.stack ?? "" : "",
    },
    metaFallback: {
      intent: "Fallback error page",
      title: mode === "dev" ? "Runtime error" : "Application error",
    },
    websocketPath: options.config?.websocket?.path ?? "/__fiyuu/ws",
  });
  if (customErrorPage) {
    response.statusCode = 500;
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(customErrorPage);
    return;
  }

  if (error instanceof Error && mode === "dev" && error.stack) {
    diagnostics.push(error.stack);
  }

  sendDocumentStatusPage(response, {
    statusCode: 500,
    title: mode === "dev" ? "Runtime error" : "Application error",
    summary: mode === "dev"
      ? "Fiyuu caught an exception while rendering this request."
      : "Something went wrong while processing this request.",
    detail: message,
    route: request?.url,
    method: request?.method ?? "GET",
    requestId: typeof response.getHeader("x-fiyuu-request-id") === "string" ? String(response.getHeader("x-fiyuu-request-id")) : "",
    hints: mode === "dev"
      ? [
          "Inspect the stack trace and the route module shown below.",
          "Check page/query/action exports for missing or invalid values.",
          "Re-run the request after fixing the module to confirm recovery.",
        ]
      : [
          "Review server logs for the matching request identifier.",
          "Retry the request after verifying the latest deployment completed successfully.",
        ],
    diagnostics,
  });
}

function prefersHtmlResponse(request: IncomingMessage): boolean {
  if ((request.url ?? "").startsWith("/api")) {
    return false;
  }

  const accept = request.headers.accept ?? "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return false;
  }

  return true;
}

function renderStatusPage(input: StatusPageInput): string {
  const tone = getStatusTone(input.statusCode);
  const badges = [
    `HTTP ${input.statusCode}`,
    input.method ? `Method ${input.method}` : "",
    input.route ? `Route ${input.route}` : "",
  ].filter(Boolean).map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("");
  const hints = (input.hints ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const diagnostics = (input.diagnostics ?? []).map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join("");
  const requestMeta = input.requestId ? `<p class="meta">Request ID: <code>${escapeHtml(input.requestId)}</code></p>` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(`${input.statusCode} ${input.title} - Fiyuu`)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: ${tone.background};
        --panel: rgba(255,255,255,.76);
        --border: ${tone.border};
        --text: #18211d;
        --muted: #58645d;
        --accent: ${tone.accent};
        --accent-soft: ${tone.accentSoft};
        --code: #13201a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(255,255,255,.72), transparent 28%),
          radial-gradient(circle at right 20%, rgba(255,255,255,.35), transparent 24%),
          linear-gradient(135deg, var(--bg), #f6f1e7 55%, #efe8dc 100%);
      }
      main {
        width: min(1040px, calc(100% - 32px));
        margin: 0 auto;
        padding: 40px 0 56px;
      }
      .hero {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 28px;
        padding: 32px;
        background: linear-gradient(180deg, rgba(255,255,255,.9), var(--panel));
        box-shadow: 0 30px 80px rgba(67, 45, 18, .12);
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto -20% -35% auto;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, var(--accent-soft), transparent 68%);
        pointer-events: none;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.78);
        border: 1px solid var(--border);
        color: var(--muted);
        font: 600 12px/1.1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 12px;
        font-size: clamp(2.3rem, 7vw, 4.6rem);
        line-height: .95;
        letter-spacing: -.05em;
      }
      .summary {
        margin: 0;
        max-width: 700px;
        font-size: 1.08rem;
        line-height: 1.7;
        color: var(--muted);
      }
      .detail {
        margin: 20px 0 0;
        padding-left: 16px;
        border-left: 3px solid var(--accent);
        max-width: 760px;
        font: 500 .98rem/1.7 ui-sans-serif, system-ui, sans-serif;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.84);
        border: 1px solid var(--border);
        font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--code);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        margin-top: 20px;
      }
      section {
        border: 1px solid var(--border);
        border-radius: 22px;
        padding: 20px 22px;
        background: rgba(255,255,255,.66);
        backdrop-filter: blur(8px);
      }
      h2 {
        margin: 0 0 14px;
        font: 700 1rem/1.2 ui-sans-serif, system-ui, sans-serif;
        letter-spacing: -.02em;
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      li {
        margin-top: 10px;
        color: var(--muted);
        font: 500 .96rem/1.55 ui-sans-serif, system-ui, sans-serif;
      }
      li:first-child { margin-top: 0; }
      code {
        font: 500 .92rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: var(--code);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .meta {
        margin: 20px 0 0;
        color: var(--muted);
        font: 500 .92rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      @media (max-width: 640px) {
        main { width: min(100% - 20px, 1040px); padding: 18px 0 28px; }
        .hero { padding: 22px; border-radius: 22px; }
        section { padding: 18px; border-radius: 18px; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="hero">
        <div class="eyebrow">Fiyuu System Response</div>
        <h1>${escapeHtml(input.title)}</h1>
        <p class="summary">${escapeHtml(input.summary)}</p>
        ${input.detail ? `<p class="detail">${escapeHtml(input.detail)}</p>` : ""}
        <div class="badges">${badges}</div>
        ${requestMeta}
      </div>
      <div class="grid">
        <section>
          <h2>What to check next</h2>
          <ul>${hints || "<li>No recovery hints are available for this response.</li>"}</ul>
        </section>
        <section>
          <h2>Diagnostics</h2>
          <ul>${diagnostics || `<li><code>No extra diagnostics were captured.</code></li>`}</ul>
        </section>
      </div>
    </main>
  </body>
</html>`;
}

function getStatusTone(statusCode: number): { background: string; border: string; accent: string; accentSoft: string } {
  if (statusCode >= 500) {
    return {
      background: "#f2dfd5",
      border: "rgba(151, 73, 45, .22)",
      accent: "#97492d",
      accentSoft: "rgba(151, 73, 45, .20)",
    };
  }

  if (statusCode === 404) {
    return {
      background: "#e4ebdf",
      border: "rgba(58, 98, 75, .22)",
      accent: "#3a624b",
      accentSoft: "rgba(58, 98, 75, .18)",
    };
  }

  return {
    background: "#e8e2d4",
    border: "rgba(105, 88, 52, .22)",
    accent: "#695834",
    accentSoft: "rgba(105, 88, 52, .18)",
  };
}

async function runMiddleware(
  options: StartServerOptions,
  url: URL,
  request: IncomingMessage,
  mode: "dev" | "start",
  stateWarnings: string[] = [],
  requestId = "",
): Promise<MiddlewareResult | undefined> {
  if (options.config?.middleware?.enabled === false) {
    return undefined;
  }
  const middlewarePath = path.join(options.appDirectory, "middleware.ts");
  if (!existsSync(middlewarePath)) {
    return undefined;
  }
  const module = (await importModule(middlewarePath, mode)) as MiddlewareModule;
  const handlers = Array.isArray(module.middleware) ? module.middleware : module.middleware ? [module.middleware] : [];
  const context: MiddlewareContext = {
    request,
    url,
    responseHeaders: {},
    requestId,
    warnings: stateWarnings,
  };
  let shortCircuit: MiddlewareResult["response"];

  let index = -1;
  async function dispatch(position: number): Promise<void> {
    if (position <= index) {
      throw new Error("Middleware next() called multiple times.");
    }
    index = position;
    const handler = handlers[position];
    if (!handler) {
      return;
    }
    const result = await handler(context, async () => dispatch(position + 1));
    if (result?.headers) {
      Object.assign(context.responseHeaders, result.headers);
    }
    if (result?.response) {
      shortCircuit = result.response;
    }
  }

  await dispatch(0);
  return { headers: context.responseHeaders, response: shortCircuit };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function attachWebsocketServer(
  server: ReturnType<typeof createServer>,
  options: StartServerOptions,
  websocketPath: string,
): Promise<string | undefined> {
  if (!options.config?.websocket?.enabled) {
    return undefined;
  }

  const socketModulePath = path.join(options.rootDirectory, "server", "socket.ts");
  const socketModule = existsSync(socketModulePath) ? ((await importModule(socketModulePath, options.mode)) as SocketModule) : null;
  const registration = socketModule?.registerSocketServer?.() ?? {};
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: options.config?.websocket?.maxPayloadBytes ?? 64 * 1024,
  });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "fiyuu:ready",
        namespace: registration.namespace ?? "app",
        events: registration.events ?? [],
      }),
    );

    registration.onConnect?.(socket);
    socket.on("message", (message) => {
      registration.onMessage?.(socket, message.toString());
    });
  });

  server.on("upgrade", (request, socket, head) => {
    if (!request.url) {
      socket.destroy();
      return;
    }

    const url = new URL(request.url, "http://localhost");
    if (url.pathname !== websocketPath) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit("connection", client, request);
    });
  });

  return `ws://localhost:${options.port ?? 4050}${websocketPath}`;
}

async function listenWithFallback(server: ReturnType<typeof createServer>, preferredPort: number, maxPort: number): Promise<number> {
  for (let port = preferredPort; port <= maxPort; port += 1) {
    try {
      await listen(server, port);
      const address = server.address() as AddressInfo | null;
      return address?.port ?? port;
    } catch (error) {
      if (!isAddressInUseError(error) || port === maxPort) {
        throw error;
      }
    }
  }

  throw new Error(`No available port found between ${preferredPort} and ${maxPort}.`);
}

async function listen(server: ReturnType<typeof createServer>, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE");
}

function renderStartupMessage(mode: "dev" | "start", url: string, actualPort: number, preferredPort: number, websocketUrl?: string): string {
  const lines = [
    "",
    `Fiyuu ${mode === "dev" ? "Development Server" : "Production Server"}`,
    `- URL: ${url}`,
    `- Mode: ${mode.toUpperCase()}`,
  ];

  if (actualPort !== preferredPort) {
    lines.push(`- Port: ${preferredPort} was busy, using ${actualPort}`);
  } else {
    lines.push(`- Port: ${actualPort}`);
  }

  if (mode === "dev") {
    lines.push("- Live Reload: enabled");
    lines.push("- Rendering: per-route SSR/CSR");
  }

  if (websocketUrl) {
    lines.push(`- WebSocket: ${websocketUrl.replace(`:${preferredPort}`, `:${actualPort}`)}`);
  }

  return lines.join("\n");
}
