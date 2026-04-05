/**
 * Fiyuu runtime server — main orchestrator.
 *
 * This file wires together the modular pieces:
 *   server-types     → shared interfaces
 *   server-utils     → serialise, escapeHtml, sendJson/Text, parseBody, …
 *   server-router    → buildRouteIndex, matchRoute
 *   server-loader    → importModule, layout/meta loading, query cache, renderGeaComponent
 *   server-renderer  → renderDocument, renderStatusPage, serveClientAsset, …
 *   server-devtools  → renderUnifiedToolsScript (dev only)
 *   server-middleware→ runMiddleware
 *   server-websocket → attachWebsocketServer
 */

import { existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import chokidar from "chokidar";
import { createProjectGraph, scanApp, syncProjectArtifacts, type MetaDefinition, type RenderMode } from "@fiyuu/core";
import { FiyuuDB } from "@fiyuu/db";
import { FiyuuRealtime } from "@fiyuu/realtime";
import { bundleClient } from "./bundler.js";
import { buildInsightsReport } from "./inspector.js";
import { type FiyuuService, ServiceManager, createServiceManager } from "./service.js";

// ── Re-export public types ────────────────────────────────────────────────────
export type { StartServerOptions, StartedServer } from "./server-types.js";
import type {
  ApiRouteModule,
  FeatureRecord,
  LayoutModule,
  ModuleShape,
  RouteIndex,
  RuntimeState,
  StartedServer,
  StartServerOptions,
  StatusPageInput,
  TinyRoute,
  TinyRouteContext,
} from "./server-types.js";

// ── Utils ─────────────────────────────────────────────────────────────────────
import {
  createWeakEtag,
  createRequestId,
  parseRequestBody,
  prefersHtmlResponse,
  pushServerEvent,
  sendJson,
  sendText,
  sendXml,
} from "./server-utils.js";

// ── Router ────────────────────────────────────────────────────────────────────
import { buildRouteIndex, matchRoute } from "./server-router.js";

// ── Loader ────────────────────────────────────────────────────────────────────
import {
  getCachedLayoutStack,
  getCachedMergedMeta,
  importModule,
  loadFeatureMeta,
  loadLayoutMeta,
  loadLayoutStack,
  mergeMetaDefinitions,
  pruneQueryCache,
  renderGeaComponent,
  resolveApiRouteModule,
} from "./server-loader.js";

// ── Renderer ──────────────────────────────────────────────────────────────────
import {
  attachLiveReload,
  renderDocument,
  renderStartupMessage,
  renderStatusPage,
  serveClientRuntime,
  sendDocumentStatusPage,
  serveClientAsset,
} from "./server-renderer.js";

// ── Middleware & WebSocket ────────────────────────────────────────────────────
import { runMiddleware } from "./server-middleware.js";
import { attachWebsocketServer } from "./server-websocket.js";

// ── Window augmentation (client type hints) ───────────────────────────────────

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
      };
    };
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function startServer(options: StartServerOptions): Promise<StartedServer> {
  const state = await createRuntimeState(options);
  const liveClients = new Set<ServerResponse>();
  const websocketPath = options.config?.websocket?.path ?? "/__fiyuu/ws";
  const handleTinyRoute = createTinyInternalRouter(options, state, liveClients);

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
        Object.assign(state, nextState);
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
    // Strip internal x-fiyuu-* headers to prevent spoofing (cf. CVE-2025-29927).
    for (const key of Object.keys(request.headers)) {
      if (key.startsWith("x-fiyuu-") && key !== "x-fiyuu-navigate") {
        delete request.headers[key];
      }
    }

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

      if (await handleTinyRoute({ request, response, url, state, options, liveClients })) {
        return;
      }

      const requestId = options.config?.observability?.requestId === false ? "" : createRequestId();
      pushServerEvent(state, "info", "request.start", `${request.method ?? "GET"} ${url.pathname}`);

      const middleware = await runMiddleware(options, url, request, options.mode, state.warnings, requestId);
      if (middleware?.response) {
        pushServerEvent(state, "info", "middleware.short-circuit", `${url.pathname} → ${middleware.response.status ?? 200}`);
        if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
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

      if (url.pathname === "/sitemap.xml") {
        await handleSitemap(request, response, options, state, url);
        return;
      }

      if (url.pathname === "/robots.txt") {
        await handleRobots(request, response, options);
        return;
      }

      if (url.pathname === "/sitemap.xml") {
        await handleSitemap(request, response, options, state, url);
        return;
      }

      if (url.pathname === "/robots.txt") {
        await handleRobots(request, response, options);
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
            requestId: createRequestId(),
          });
        } catch {
          // custom error handler must not throw
        }
      }
      await sendRuntimeError(response, error, options, request);
    }
  });

  const port = await listenWithFallback(server, options.port ?? 4050, options.maxPort ?? (options.port ?? 4050) + 20);
  const url = `http://localhost:${port}`;

  // ── Initialize DB ──────────────────────────────────────────────────────────
  await state.db.initialize();
  console.log(`[fiyuu] DB initialized — tables: ${state.db.listTables().join(", ") || "none"}`);

  // ── Initialize Realtime (before standalone WS so it claims connections first) ──
  await state.realtime.initialize(server);
  console.log(`[fiyuu] Realtime initialized — transports: ${state.realtime.stats().transports}`);

  // ── Standalone WebSocket (fallback for custom socket modules, skips if realtime owns the path) ──
  const websocketUrl = await attachWebsocketServer(server, options, websocketPath);

  // ── Discover and start services ────────────────────────────────────────────
  const serviceManager = createServiceManager();
  const servicesDir = path.join(options.appDirectory, "services");
  if (existsSync(servicesDir)) {
    const serviceFiles = await discoverServices(servicesDir);
    for (const svcFile of serviceFiles) {
      try {
        const mod = await importService(svcFile);
        const service = (mod.default || mod.service || mod) as Record<string, unknown>;
        if (service && typeof service.start === "function") {
          serviceManager.register(service as unknown as FiyuuService);
        }
      } catch (err) {
        console.warn(`[fiyuu] Failed to load service from ${svcFile}:`, err);
      }
    }
  }

  serviceManager.setContext({
    db: state.db,
    realtime: state.realtime,
    config: options.config || {},
    log: (level, msg, data) => pushServerEvent(state, level, `service.${msg}`, data ? JSON.stringify(data) : undefined),
  });

  await serviceManager.startAll();
  state.serviceNames = serviceManager.list();
  console.log(`[fiyuu] Services started: ${state.serviceNames.length > 0 ? state.serviceNames.join(", ") : "none"}`);

  console.log(renderStartupMessage(options.mode, url, port, options.port ?? 4050, websocketUrl));

  return {
    port,
    url,
    websocketUrl,
    close: async () => {
      // Stop services first
      await serviceManager.stopAll();
      // Shutdown realtime
      await state.realtime.shutdown();
      // Persist DB
      await state.db.shutdown();
      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

// ─── Runtime state ────────────────────────────────────────────────────────────

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

  const db = new FiyuuDB({
    path: options.config?.data?.path || path.join(options.rootDirectory, ".fiyuu", "data"),
    autosave: options.config?.data?.autosave !== false,
    autosaveIntervalMs: options.config?.data?.autosaveIntervalMs || 5000,
    tables: options.config?.data?.tables,
  });

  const realtime = new FiyuuRealtime({
    enabled: options.config?.realtime?.enabled !== false,
    transports: options.config?.realtime?.transports || ["websocket"],
    websocket: {
      path: options.config?.realtime?.websocket?.path || options.config?.websocket?.path || "/__fiyuu/ws",
      heartbeatMs: options.config?.realtime?.websocket?.heartbeatMs || options.config?.websocket?.heartbeatMs || 30000,
      maxPayloadBytes: options.config?.realtime?.websocket?.maxPayloadBytes || options.config?.websocket?.maxPayloadBytes || 65536,
    },
    nats: {
      url: options.config?.realtime?.nats?.url,
      name: options.config?.realtime?.nats?.name,
    },
  });

  return {
    graph,
    features,
    routeIndex: buildRouteIndex(features),
    assets,
    assetsByRoute: new Map(assets.map((asset) => [asset.route, asset])),
    insights,
    ssgCache: new Map(),
    queryCache: new Map(),
    queryInflight: new Map(),
    queryCacheLastPruneAt: Date.now(),
    layoutStackCache: new Map(),
    featureMetaCache: new Map(),
    mergedMetaCache: new Map(),
    serverEvents: [],
    version: Date.now(),
    warnings: features.flatMap((f) => f.warnings.map((w) => `${f.route}: ${w}`)),
    db,
    realtime,
    serviceNames: [],
  };
}

// ─── Tiny internal router (/__fiyuu/* paths) ──────────────────────────────────

function createTinyInternalRouter(
  options: StartServerOptions,
  state: RuntimeState,
  liveClients: Set<ServerResponse>,
): (context: TinyRouteContext) => Promise<boolean> {
  const routes: TinyRoute[] = [
    {
      method: "GET",
      type: "exact",
      path: "/__fiyuu/live",
      devOnly: true,
      handler: ({ response }) => attachLiveReload(response, liveClients),
    },
    {
      method: "GET",
      type: "exact",
      path: "/__fiyuu/devtools",
      devOnly: true,
      handler: ({ response }) =>
        sendJson(response, 200, {
          version: state.version,
          warnings: state.warnings,
          config: {
            websocket: options.config?.websocket?.enabled ?? false,
            middleware: options.config?.middleware?.enabled ?? true,
            analytics: options.config?.analytics?.enabled ?? false,
            featureFlags: options.config?.featureFlags?.defaults ?? {},
          },
          insights: { summary: state.insights.summary, assistant: state.insights.assistant },
          routes: state.features.map((f) => ({ route: f.route, render: f.render })),
        }),
    },
    {
      method: "GET",
      type: "exact",
      path: "/__fiyuu/insights",
      devOnly: true,
      handler: ({ response }) => sendJson(response, 200, state.insights),
    },
    {
      method: "GET",
      type: "exact",
      path: "/__fiyuu/runtime.js",
      handler: ({ response }) => serveClientRuntime(response, options.config?.websocket?.path ?? "/__fiyuu/ws"),
    },
    {
      method: "GET",
      type: "exact",
      path: "/__fiyuu/server-events",
      devOnly: true,
      handler: ({ response }) => sendJson(response, 200, { events: state.serverEvents }),
    },
    {
      method: "GET",
      type: "prefix",
      path: "/__fiyuu/client/",
      handler: async ({ response, url }) =>
        serveClientAsset(response, path.join(options.staticClientRoot, path.basename(url.pathname))),
    },
  ];

  const exactByMethod = new Map<string, Map<string, TinyRoute>>();
  const prefixByMethod = new Map<string, TinyRoute[]>();
  for (const route of routes) {
    if (route.type === "exact") {
      const map = exactByMethod.get(route.method) ?? new Map<string, TinyRoute>();
      map.set(route.path, route);
      exactByMethod.set(route.method, map);
    } else {
      const list = prefixByMethod.get(route.method) ?? [];
      list.push(route);
      prefixByMethod.set(route.method, list);
    }
  }

  return async (context: TinyRouteContext): Promise<boolean> => {
    const method = String(context.request.method ?? "GET").toUpperCase();

    const exactRoute = exactByMethod.get(method)?.get(context.url.pathname);
    if (exactRoute) {
      if (exactRoute.devOnly && options.mode !== "dev") return false;
      await exactRoute.handler(context);
      return true;
    }

    for (const route of prefixByMethod.get(method) ?? []) {
      if (route.devOnly && options.mode !== "dev") continue;
      if (!context.url.pathname.startsWith(route.path)) continue;
      await route.handler(context);
      return true;
    }

    return false;
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

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
  const routeMatch = matchRoute(state.routeIndex, pathname);
  const feature = routeMatch?.feature ?? null;
  const routeParams = routeMatch?.params ?? {};

  if (!feature) {
    const customNotFound = await tryRenderSystemPage({
      appDirectory, mode, kind: "not-found",
      route: pathname, method: request.method ?? "GET", requestId,
      data: { route: pathname, method: request.method ?? "GET", title: "Page not found" },
      metaFallback: { intent: "Fallback not found page", title: "Page not found" },
      websocketPath,
    });
    if (customNotFound) {
      response.statusCode = 404;
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(customNotFound);
      return;
    }
    sendDocumentStatusPage(response, {
      statusCode: 404, title: "Page not found",
      summary: "This route is not defined in the application.",
      detail: `No feature matches "${pathname}".`,
      route: pathname, method: request.method ?? "GET", requestId,
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
      statusCode: 404, title: "Page file missing",
      summary: "The route exists, but it does not provide a `page.tsx` entry.",
      detail: `Feature ${feature.feature || "/"} is missing its page component.`,
      route: pathname, method: request.method ?? "GET", requestId,
      hints: ["Add `page.tsx` to the feature directory."],
      diagnostics: [
        `Feature path: ${feature.feature || "/"}`,
        `Known files: ${Object.keys(feature.files).join(", ") || "none"}`,
      ],
    });
    return;
  }

  const startedAt = performance.now();

  const ifNoneMatch = request.headers["if-none-match"];

  // SSG cache hit in production
  if (feature.render === "ssg" && mode === "start") {
    const cached = state.ssgCache.get(feature.route);
    if (cached && (cached.expiresAt === null || cached.expiresAt > Date.now())) {
      if (matchesIfNoneMatch(ifNoneMatch, cached.etag)) {
        response.statusCode = 304;
        response.setHeader("etag", cached.etag);
        if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
        for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
        response.end();
        return;
      }
      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.setHeader("etag", cached.etag);
      response.setHeader("cache-control", buildSsgCacheControl(cached.revalidateSeconds));
      response.setHeader("x-fiyuu-cache", "ssg-fresh");
      if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
      for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
      response.end(cached.html);
      return;
    }
  }

  const pageModule = (await importModule(feature.files["page.tsx"]!, mode)) as ModuleShape;
  const queryModule = feature.files["query.ts"]
    ? ((await importModule(feature.files["query.ts"]!, mode)) as ModuleShape)
    : null;
  const asset = state.assetsByRoute.get(feature.route);
  const Page = pageModule.default;

  if (!Page) {
    sendDocumentStatusPage(response, {
      statusCode: 500, title: "Invalid page module",
      summary: "The route loaded successfully, but its page module has no default export.",
      detail: `Expected a default Gea component in ${feature.files["page.tsx"]}.`,
      route: pathname, method: request.method ?? "GET", requestId,
      hints: ["Export a default Gea component from `page.tsx`."],
    });
    return;
  }

  // Query execution with optional caching
  let data: unknown = null;
  if (queryModule?.execute) {
    const cacheConfig = queryModule.cache;
    if (cacheConfig?.ttl && cacheConfig.ttl > 0) {
      const now = Date.now();
      pruneQueryCache(state, now);
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      const varyValues = (cacheConfig.vary ?? []).map(
        (key) => requestUrl.searchParams.get(key) ?? "",
      );
      const cacheKey = `${feature.route}:${JSON.stringify(routeParams)}:${varyValues.join(",")}`;
      const cached = state.queryCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        data = cached.data;
        pushServerEvent(state, "info", "query.cache-hit", `${pathname} (ttl=${cacheConfig.ttl}s)`);
      } else {
        const pending = state.queryInflight.get(cacheKey);
        if (pending) {
          data = await pending;
        } else {
          const execution = Promise.resolve(
            queryModule.execute({ request, route: pathname, feature, params: routeParams }),
          );
          state.queryInflight.set(cacheKey, execution);
          try {
            data = await execution;
            state.queryCache.set(cacheKey, { data, expiresAt: now + cacheConfig.ttl * 1000 });
          } finally {
            state.queryInflight.delete(cacheKey);
          }
        }
      }
    } else {
      data = await queryModule.execute({ request, route: pathname, feature, params: routeParams });
    }
  }

  const intent = feature.intent ?? feature.pageIntent ?? pageModule.page?.intent ?? "";
  const render = feature.render;

  const layoutStack =
    mode === "start"
      ? await getCachedLayoutStack(state, appDirectory, feature, mode)
      : await loadLayoutStack(appDirectory, feature, mode);

  const mergedMeta =
    mode === "start"
      ? await getCachedMergedMeta(state, feature, layoutStack, mode)
      : mergeMetaDefinitions(...layoutStack.map((item) => item.meta), await loadFeatureMeta(feature, mode));

  // SSR body
  let body = "";
  if (render === "ssr") {
    const pageBody = renderGeaComponent(Page, { data, route: pathname, intent, render, params: routeParams });
    body = layoutStack.reduceRight<string>(
      (children, layout) => renderGeaComponent(layout.component, { route: pathname, children }),
      pageBody,
    );
  }

  const renderTimeMs = Number((performance.now() - startedAt).toFixed(2));

  // SPA navigation: return JSON instead of full document
  if (request.headers["x-fiyuu-navigate"] === "1") {
    const navPayload = JSON.stringify({
      body, title: mergedMeta.seo?.title ?? mergedMeta.title ?? "Fiyuu",
      description: mergedMeta.seo?.description ?? intent ?? "",
      route: pathname, render, data,
      clientPath: asset?.publicPath ?? null,
    });
    const navEtag = createWeakEtag(navPayload);
    if (matchesIfNoneMatch(ifNoneMatch, navEtag)) {
      response.statusCode = 304;
      response.setHeader("etag", navEtag);
      response.setHeader("x-fiyuu-navigate", "1");
      if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
      for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
      response.end();
      return;
    }
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("x-fiyuu-navigate", "1");
    response.setHeader("etag", navEtag);
    response.setHeader("cache-control", "private, max-age=0, must-revalidate");
    response.setHeader("server-timing", `render;dur=${renderTimeMs}`);
    if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
    for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
    response.end(`${navPayload}\n`);
    pushServerEvent(state, "info", "request.navigate", `${pathname} (${render.toUpperCase()}) ${renderTimeMs}ms`);
    return;
  }

  const html = renderDocument({
    body, data, route: pathname, intent, render,
    clientPath: asset?.publicPath ?? null,
    liveReload: mode === "dev",
    warnings: feature.warnings,
    renderTimeMs,
    developerTools: developerToolsEnabled,
    requestId, meta: mergedMeta, websocketPath,
  });

  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  const htmlEtag = createWeakEtag(html);
  if (matchesIfNoneMatch(ifNoneMatch, htmlEtag)) {
    response.statusCode = 304;
    response.setHeader("etag", htmlEtag);
    if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
    for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
    response.end();
    return;
  }
  response.setHeader("etag", htmlEtag);
  response.setHeader("server-timing", `render;dur=${renderTimeMs}`);
  for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
  if (requestId) response.setHeader("x-fiyuu-request-id", requestId);

  if (render === "ssg" && mode === "start") {
    const revalidateSeconds = normalizeRevalidateSeconds(mergedMeta.revalidate);
    response.setHeader("cache-control", buildSsgCacheControl(revalidateSeconds));
    state.ssgCache.set(feature.route, {
      html,
      etag: htmlEtag,
      revalidateSeconds,
      expiresAt: revalidateSeconds === null ? null : Date.now() + revalidateSeconds * 1000,
    });
  }

  response.end(html);
  pushServerEvent(state, "info", "request.page", `${pathname} (${render.toUpperCase()}) ${renderTimeMs}ms`);
}

// ─── System page renderer (not-found / error) ─────────────────────────────────

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
  const filePath = path.join(
    input.appDirectory,
    input.kind === "not-found" ? "not-found.tsx" : "error.tsx",
  );
  if (!existsSync(filePath)) return null;

  const module = (await importModule(filePath, input.mode)) as ModuleShape;
  if (!module.default) return null;

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
    body, data: input.data,
    route: input.route,
    intent: input.metaFallback.intent ?? "",
    render: "ssr",
    clientPath: null,
    liveReload: input.mode === "dev",
    warnings: [], renderTimeMs: 0,
    developerTools: false,
    requestId: input.requestId,
    meta: mergeMetaDefinitions(rootMeta, input.metaFallback),
    websocketPath: input.websocketPath,
  });
}

// ─── Action request handler ───────────────────────────────────────────────────

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
  if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
  for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
  response.end(`${JSON.stringify(result ?? null)}\n`);
}

// ─── Sitemap & Robots handlers ────────────────────────────────────────────────

async function handleSitemap(
  request: IncomingMessage,
  response: ServerResponse,
  options: StartServerOptions,
  state: RuntimeState,
  url: URL,
): Promise<void> {
  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const baseUrl = options.config?.seo?.baseUrl;
  if (!baseUrl) {
    sendText(response, 404, "Sitemap not configured. Set seo.baseUrl in fiyuu.config.ts");
    return;
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const features = state.features.filter((f) => f.files["page.tsx"] && !f.isDynamic);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const feature of features) {
    const loc = `${cleanBaseUrl}${feature.route}`;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${feature.route === "/" ? "1.0" : "0.8"}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  sendXml(response, 200, xml);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function handleRobots(
  request: IncomingMessage,
  response: ServerResponse,
  options: StartServerOptions,
): Promise<void> {
  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const baseUrl = options.config?.seo?.baseUrl;
  const sitemapEnabled = options.config?.seo?.sitemap === true;
  const sitemapUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/sitemap.xml` : null;

  let text = `User-agent: *\nAllow: /\n`;
  if (sitemapUrl && sitemapEnabled) {
    text += `Sitemap: ${sitemapUrl}\n`;
  }

  response.statusCode = 200;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end(text);
}

// ─── API route handler ────────────────────────────────────────────────────────

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
  if (requestId) response.setHeader("x-fiyuu-request-id", requestId);
  for (const [key, value] of Object.entries(middlewareHeaders)) response.setHeader(key, value);
  response.end(`${JSON.stringify(result ?? null)}\n`);
}

// ─── Runtime error response ───────────────────────────────────────────────────

async function sendRuntimeError(
  response: ServerResponse,
  error: unknown,
  options: StartServerOptions,
  request?: IncomingMessage,
): Promise<void> {
  const mode = options.mode;
  const message = error instanceof Error ? error.message : "Unknown runtime error";
  const diagnostics: string[] = [];

  if (request && !prefersHtmlResponse(request)) {
    sendJson(response, 500, {
      error: {
        message,
        requestId: String(response.getHeader("x-fiyuu-request-id") ?? ""),
        ...(mode === "dev" && error instanceof Error && error.stack ? { stack: error.stack } : {}),
      },
    });
    return;
  }

  const customErrorPage = await tryRenderSystemPage({
    appDirectory: options.appDirectory, mode, kind: "error",
    route: request?.url ?? "/", method: request?.method ?? "GET",
    requestId: String(response.getHeader("x-fiyuu-request-id") ?? ""),
    data: {
      message, route: request?.url ?? "/", method: request?.method ?? "GET",
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
    requestId: String(response.getHeader("x-fiyuu-request-id") ?? ""),
    hints: mode === "dev"
      ? [
          "Inspect the stack trace and the route module shown below.",
          "Check page/query/action exports for missing or invalid values.",
        ]
      : [
          "Review server logs for the matching request identifier.",
          "Retry the request after verifying the latest deployment completed successfully.",
        ],
    diagnostics,
  });
}

// ─── TCP listener helpers ─────────────────────────────────────────────────────

async function listenWithFallback(
  server: ReturnType<typeof createServer>,
  preferredPort: number,
  maxPort: number,
): Promise<number> {
  for (let port = preferredPort; port <= maxPort; port += 1) {
    try {
      await listen(server, port);
      const address = server.address() as AddressInfo | null;
      return address?.port ?? port;
    } catch (error) {
      if (!isAddressInUseError(error) || port === maxPort) throw error;
    }
  }
  throw new Error(`No available port found between ${preferredPort} and ${maxPort}.`);
}

async function listen(server: ReturnType<typeof createServer>, port: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => { server.off("listening", onListening); reject(error); };
    const onListening = () => { server.off("error", onError); resolve(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE");
}

function normalizeRevalidateSeconds(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.floor(value);
}

function buildSsgCacheControl(revalidateSeconds: number | null): string {
  if (revalidateSeconds === null) {
    return "public, max-age=300, stale-while-revalidate=300";
  }
  return `public, max-age=${revalidateSeconds}, stale-while-revalidate=${revalidateSeconds}`;
}

function matchesIfNoneMatch(header: string | string[] | undefined, etag: string): boolean {
  if (!header) return false;
  const raw = Array.isArray(header) ? header.join(",") : header;
  return raw
    .split(",")
    .map((part) => part.trim())
    .some((candidate) => candidate === "*" || candidate === etag);
}

// ─── Service discovery helpers ──────────────────────────────────────────────────

async function discoverServices(directory: string): Promise<string[]> {
  const { promises: fs } = await import("node:fs");
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      files.push(path.join(directory, entry.name));
    }
  }

  return files;
}

async function importService(filePath: string): Promise<Record<string, unknown>> {
  const fileUrl = pathToFileURL(filePath).href;
  return import(`${fileUrl}?t=${Date.now()}`);
}
