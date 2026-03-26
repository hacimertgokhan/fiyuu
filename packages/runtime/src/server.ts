import { createReadStream, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { pathToFileURL } from "node:url";
import chokidar from "chokidar";
import React from "react";
import { renderToString } from "react-dom/server";
import { WebSocketServer, type WebSocket } from "ws";
import { createProjectGraph, scanApp, syncProjectArtifacts, type FeatureRecord, type FiyuuConfig, type MetaDefinition, type RenderMode } from "@fiyuu/core";
import { bundleClient, type ClientAsset } from "./bundler.js";

interface ModuleShape {
  default?: React.ComponentType<any>;
  execute?: (context: any) => Promise<unknown> | unknown;
  page?: { intent: string };
}

interface LayoutModule {
  default?: React.ComponentType<{ children: React.ReactNode; route: string }>;
}

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
}

interface SocketModule {
  registerSocketServer?: () => {
    namespace?: string;
    events?: string[];
    onConnect?: (socket: WebSocket) => void;
    onMessage?: (socket: WebSocket, message: string) => void;
  };
}

interface RuntimeState {
  graph: Awaited<ReturnType<typeof createProjectGraph>>;
  features: FeatureRecord[];
  assets: ClientAsset[];
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
    __FIYUU_DEVTOOLS__?: unknown;
  }
}

export async function startServer(options: StartServerOptions): Promise<StartedServer> {
  const state = await createRuntimeState(options);
  const liveClients = new Set<ServerResponse>();
  const websocketPath = options.config?.websocket?.path ?? "/__fiyuu/ws";

  if (options.mode === "dev") {
    const watcher = chokidar.watch([options.appDirectory, path.join(options.rootDirectory, "packages")], {
      ignoreInitial: true,
    });

    watcher.on("all", async () => {
      const nextState = await createRuntimeState(options);
      state.graph = nextState.graph;
      state.features = nextState.features;
      state.assets = nextState.assets;
      state.version = nextState.version;
      state.warnings = nextState.warnings;

      for (const response of liveClients) {
        response.write(`data: reload\n\n`);
      }
    });
  }

  const server = createServer(async (request, response) => {
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
          routes: state.features.map((feature) => ({ route: feature.route, render: feature.render })),
        });
        return;
      }

      if (url.pathname.startsWith("/__fiyuu/client/")) {
        await serveClientAsset(response, path.join(options.staticClientRoot, path.basename(url.pathname)));
        return;
      }

      const requestId = options.config?.observability?.requestId === false ? "" : createRequestId();
      const middleware = await runMiddleware(options, url, request, options.mode, state.warnings, requestId);

      if (url.pathname.startsWith("/api")) {
        await handleApiRoute(request, response, options, url.pathname, middleware?.headers ?? {}, requestId, options.mode);
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
      );
    } catch (error) {
      sendRuntimeError(response, error, options.mode, request);
    }
  });

  const websocketUrl = await attachWebsocketServer(server, options, websocketPath);

  const port = await listenWithFallback(server, options.port ?? 4050, options.maxPort ?? (options.port ?? 4050) + 20);
  const url = `http://localhost:${port}`;

  console.log(renderStartupMessage(options.mode, url, port, options.port ?? 4050, websocketUrl));

  return { port, url, websocketUrl };
}

async function createRuntimeState(options: StartServerOptions): Promise<RuntimeState> {
  const graph = await createProjectGraph(options.appDirectory);
  const features = await scanApp(options.appDirectory);
  await syncProjectArtifacts(options.rootDirectory, options.appDirectory);
  const assets = await bundleClient(features, options.clientOutputDirectory);

  return {
    graph,
    features,
    assets,
    version: Date.now(),
    warnings: features.flatMap((feature) => feature.warnings.map((warning) => `${feature.route}: ${warning}`)),
  };
}

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
): Promise<void> {
  const feature = state.features.find((item) => item.route === pathname);

  if (!feature) {
    sendDocumentStatusPage(response, {
      statusCode: 404,
      title: "Page not found",
      summary: "This route is not defined in the current Fiyuu application.",
      detail: `No feature matches ${pathname}.`,
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
  const pageModule = (await importModule(feature.files["page.tsx"]!, mode)) as ModuleShape;
  const queryModule = feature.files["query.ts"] ? ((await importModule(feature.files["query.ts"]!, mode)) as ModuleShape) : null;
  const asset = state.assets.find((item) => item.route === feature.route);
  const Page = pageModule.default;

  if (!Page) {
    sendDocumentStatusPage(response, {
      statusCode: 500,
      title: "Invalid page module",
      summary: "The route loaded successfully, but its page module has no default export.",
      detail: `Expected a default React component in ${feature.files["page.tsx"]}.`,
      route: pathname,
      method: request.method ?? "GET",
      requestId,
      hints: [
        "Export a default React component from `page.tsx`.",
        "Make sure the file does not only export helpers or metadata.",
      ],
    });
    return;
  }

  const data = queryModule?.execute ? await queryModule.execute({ request, route: pathname, feature }) : null;
  const intent = feature.intent ?? feature.pageIntent ?? pageModule.page?.intent ?? "";
  const render = feature.render;

  const pageElement = React.createElement(Page, {
    data,
    route: pathname,
    intent,
    render,
  });
  const layoutStack = await loadLayoutStack(appDirectory, feature, mode);
  const mergedMeta = mergeMetaDefinitions(...layoutStack.map((item) => item.meta), await loadFeatureMeta(feature, mode));
  const element = layoutStack.reduceRight<React.ReactElement>(
    (children, layout) => React.createElement(layout.component, { route: pathname, children }),
    pageElement,
  );

  const body = renderToString(element);
  const renderTimeMs = Number((performance.now() - startedAt).toFixed(2));
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
  const directModule = path.join(appDirectory, relativePath, "route.ts");
  if (existsSync(directModule)) {
    return directModule;
  }
  const rootModule = path.join(appDirectory, relativePath + ".ts");
  return existsSync(rootModule) ? rootModule : null;
}

async function importModule(modulePath: string, mode: "dev" | "start"): Promise<unknown> {
  const fileUrl = pathToFileURL(modulePath).href;
  return import(mode === "dev" ? `${fileUrl}?t=${Date.now()}` : fileUrl);
}

async function loadLayoutStack(appDirectory: string, feature: FeatureRecord, mode: "dev" | "start"): Promise<Array<{ component: React.ComponentType<{ children: React.ReactNode; route: string }>; meta: MetaDefinition }>> {
  const parts = feature.feature ? feature.feature.split("/") : [];
  const directories = [appDirectory];
  for (let index = 0; index < parts.length; index += 1) {
    directories.push(path.join(appDirectory, ...parts.slice(0, index + 1)));
  }

  const stack: Array<{ component: React.ComponentType<{ children: React.ReactNode; route: string }>; meta: MetaDefinition }> = [];
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
}): string {
  const liveReloadScript = input.liveReload
    ? `<script type="module">const events=new EventSource('/__fiyuu/live');events.onmessage=(event)=>{if(event.data==='reload'){location.reload();}};</script>`
    : "";
  const clientScript = input.clientPath ? `<script type="module" src="${input.clientPath}"></script>` : "";
  const devtoolsScript = input.liveReload && input.developerTools
    ? `<script type="module">const metrics={route:${JSON.stringify(input.route)},render:${JSON.stringify(input.render)},renderTimeMs:${input.renderTimeMs},warnings:${JSON.stringify(input.warnings)},requestId:${JSON.stringify(input.requestId)}};window.__FIYUU_DEVTOOLS__=metrics;async function mount(){const response=await fetch('/__fiyuu/devtools');const runtime=await response.json();const host=document.createElement('div');host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999;font:12px/1.55 ui-monospace,monospace';const button=document.createElement('button');button.textContent='Fiyuu Devtools';button.style.cssText='border:1px solid rgba(197,214,181,.18);background:rgba(18,24,19,.94);color:#f8f3ea;border-radius:999px;padding:10px 14px;box-shadow:0 18px 56px rgba(0,0,0,.22);cursor:pointer';const panel=document.createElement('aside');panel.style.cssText='display:none;margin-top:10px;width:340px;background:rgba(18,24,19,.94);color:#f8f3ea;border:1px solid rgba(197,214,181,.16);border-radius:20px;padding:14px 16px;box-shadow:0 18px 56px rgba(0,0,0,.22);backdrop-filter:blur(14px)';const close=document.createElement('button');close.textContent='Hide';close.style.cssText='border:1px solid rgba(197,214,181,.16);background:transparent;color:#f8f3ea;border-radius:999px;padding:4px 10px;cursor:pointer';const warnings=(metrics.warnings.length?metrics.warnings:runtime.warnings).slice(0,4).map((item)=>'<li style="margin-top:4px">'+item+'</li>').join('')||'<li style="margin-top:4px">none</li>';const flags=Object.entries(runtime.config.featureFlags||{}).map(([key,value])=>'<span style="display:inline-flex;margin:4px 6px 0 0;padding:3px 8px;border-radius:999px;background:rgba(233,240,224,.08)">'+key+': '+value+'</span>').join('')||'<span style="opacity:.7">none</span>';panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><strong>Fiyuu Devtools</strong><span style="opacity:.7">'+metrics.requestId+'</span></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px"><div><div style="opacity:.7">Route</div><div>'+metrics.route+'</div></div><div><div style="opacity:.7">Render</div><div>'+metrics.render+'</div></div><div><div style="opacity:.7">Render Time</div><div>'+metrics.renderTimeMs+' ms</div></div><div><div style="opacity:.7">Routes</div><div>'+runtime.routes.length+'</div></div></div><div style="margin-top:12px"><div style="opacity:.7">Flags</div><div style="margin-top:4px">'+flags+'</div></div><div style="margin-top:12px"><div style="opacity:.7">Warnings</div><ul style="margin:6px 0 0 16px;padding:0">'+warnings+'</ul></div>';const closeWrap=document.createElement('div');closeWrap.style.cssText='display:flex;justify-content:flex-end;margin-top:12px';closeWrap.appendChild(close);panel.appendChild(closeWrap);button.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none'});close.addEventListener('click',()=>{panel.style.display='none'});host.appendChild(button);host.appendChild(panel);document.body.appendChild(host)}document.addEventListener('DOMContentLoaded',()=>{mount().catch(()=>{})});</script>`
    : "";

  return `<!doctype html>
<html lang="en" data-render-mode="${input.render}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.meta.seo?.title ?? input.meta.title ?? "Fiyuu")}</title>
    <meta name="description" content="${escapeHtml(input.meta.seo?.description ?? (input.intent || "Fiyuu application"))}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f7f8f5; color: #172018; }
      #app { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app">${input.body}</div>
    <script>window.__FIYUU_DATA__=${serialize(input.data)};window.__FIYUU_ROUTE__=${JSON.stringify(input.route)};window.__FIYUU_INTENT__=${JSON.stringify(input.intent)};window.__FIYUU_RENDER__=${JSON.stringify(input.render)};</script>
    ${clientScript}
    ${devtoolsScript}
    ${liveReloadScript}
  </body>
</html>`;
}

function serialize(value: unknown): string {
  return JSON.stringify(value ?? null).replaceAll("<", "\\u003c");
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

async function parseRequestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  const contentType = request.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(raw) as Record<string, unknown>;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }

  return { raw };
}

function sendRuntimeError(response: ServerResponse, error: unknown, mode: "dev" | "start", request?: IncomingMessage): void {
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
  }

  await dispatch(0);
  return { headers: context.responseHeaders };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function createRequestId(): string {
  return `fy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
