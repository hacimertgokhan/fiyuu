/**
 * HTML document rendering, status pages, and response helpers
 * for the Fiyuu runtime server.
 */

import { createReadStream, existsSync } from "node:fs";
import type { ServerResponse } from "node:http";
import type { MetaDefinition, RenderMode } from "@fiyuu/core";
import { buildClientRuntime } from "./client-runtime.js";
import { escapeHtml, sendText, serialize } from "./server-utils.js";
import { renderUnifiedToolsScript } from "./server-devtools.js";
import type { StatusPageInput } from "./server-types.js";

// ── Document rendering ────────────────────────────────────────────────────────

export function renderDocument(input: {
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
  const runtimeScript = `<script defer src="/__fiyuu/runtime.js"></script>`;
  const clientScript = input.clientPath ? `<script type="module" src="${input.clientPath}"></script>` : "";
  const unifiedToolsScript = input.liveReload && input.developerTools ? renderUnifiedToolsScript(input) : "";

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
    ${runtimeScript}
    ${clientScript}
    ${unifiedToolsScript}
    ${liveErrorDebuggerScript}
    ${liveReloadScript}
  </body>
</html>`;
}

// ── Status page rendering ─────────────────────────────────────────────────────

export function getStatusTone(statusCode: number): {
  background: string;
  border: string;
  accent: string;
  accentSoft: string;
} {
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

export function renderStatusPage(input: StatusPageInput): string {
  const tone = getStatusTone(input.statusCode);
  const badges = [
    `HTTP ${input.statusCode}`,
    input.method ? `Method ${input.method}` : "",
    input.route ? `Route ${input.route}` : "",
  ]
    .filter(Boolean)
    .map((item) => `<span class="badge">${escapeHtml(item)}</span>`)
    .join("");
  const hints = (input.hints ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const diagnostics = (input.diagnostics ?? [])
    .map((item) => `<li><code>${escapeHtml(item)}</code></li>`)
    .join("");
  const requestMeta = input.requestId
    ? `<p class="meta">Request ID: <code>${escapeHtml(input.requestId)}</code></p>`
    : "";

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
        --muted: rgba(24,33,29,.62);
        --accent: ${tone.accent};
        --accent-soft: ${tone.accentSoft};
        --code-bg: rgba(24,33,29,.06);
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--bg); color: var(--text); font: 14px/1.6 ui-sans-serif, system-ui, sans-serif; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .card { background: var(--panel); border: 1px solid var(--border); border-radius: 20px; padding: 32px 36px; max-width: 600px; width: 100%; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,.06); }
      .badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font: 600 11px/1.5 ui-monospace, monospace; margin-right: 6px; }
      h1 { font-size: 22px; font-weight: 700; margin: 14px 0 8px; }
      .summary { color: var(--muted); margin-bottom: 16px; }
      .detail { background: var(--code-bg); border-radius: 10px; padding: 12px 14px; font: 13px/1.5 ui-monospace, monospace; margin-bottom: 18px; white-space: pre-wrap; word-break: break-word; }
      h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 18px 0 8px; }
      ul { padding-left: 18px; }
      li { margin-top: 6px; }
      code { background: var(--code-bg); border-radius: 4px; padding: 1px 5px; font-family: ui-monospace, monospace; font-size: .9em; }
      .meta { font-size: 12px; color: var(--muted); margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div>${badges}</div>
      <h1>${escapeHtml(input.title)}</h1>
      <p class="summary">${escapeHtml(input.summary)}</p>
      ${input.detail ? `<pre class="detail">${escapeHtml(input.detail)}</pre>` : ""}
      ${hints ? `<h2>Suggestions</h2><ul>${hints}</ul>` : ""}
      ${diagnostics ? `<h2>Diagnostics</h2><ul>${diagnostics}</ul>` : ""}
      ${requestMeta}
    </div>
  </body>
</html>`;
}

export function sendDocumentStatusPage(response: ServerResponse, input: StatusPageInput): void {
  response.statusCode = input.statusCode;
  response.setHeader("content-type", "text/html; charset=utf-8");
  if (input.requestId) {
    response.setHeader("x-fiyuu-request-id", input.requestId);
  }
  response.end(renderStatusPage(input));
}

// ── Startup message ───────────────────────────────────────────────────────────

export function renderStartupMessage(
  mode: "dev" | "start",
  url: string,
  actualPort: number,
  preferredPort: number,
  websocketUrl?: string,
): string {
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

// ── Static asset serving ──────────────────────────────────────────────────────

export async function serveClientAsset(response: ServerResponse, assetPath: string): Promise<void> {
  if (!existsSync(assetPath)) {
    sendText(response, 404, `Missing client asset ${assetPath}`);
    return;
  }
  response.statusCode = 200;
  response.setHeader("content-type", "text/javascript; charset=utf-8");
  response.setHeader("cache-control", "public, max-age=31536000, immutable");
  createReadStream(assetPath).pipe(response);
}

export function serveClientRuntime(response: ServerResponse, websocketPath: string): void {
  response.statusCode = 200;
  response.setHeader("content-type", "text/javascript; charset=utf-8");
  response.setHeader("cache-control", "public, max-age=300");
  response.end(buildClientRuntime(websocketPath));
}

// ── Live reload SSE ───────────────────────────────────────────────────────────

export function attachLiveReload(response: ServerResponse, liveClients: Set<ServerResponse>): void {
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
