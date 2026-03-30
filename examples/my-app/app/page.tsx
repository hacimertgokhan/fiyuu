import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type HomeData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Landing page — Fiyuu framework product site" });

const GITHUB_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/></svg>`;

const comparisonRows = [
  { feature: "Rendering model",      fiyuu: "SSR — GEA engine",     react: "CSR / SSR",     next: "SSR/SSG/ISR",  vue: "CSR / SSR",      nuxt: "SSR/SSG/ISR",  astro: "Islands/SSG/SSR", svelte: "CSR/SSR (Kit)" },
  { feature: "Virtual DOM",          fiyuu: "None",                 react: "Yes",           next: "Yes",          vue: "Yes",            nuxt: "Yes",          astro: "None",            svelte: "None (compiled)" },
  { feature: "Build step",           fiyuu: "Not required",         react: "Required",      next: "Required",     vue: "Required",       nuxt: "Required",     astro: "Required",        svelte: "Required" },
  { feature: "Built-in database",    fiyuu: "F1 JSON store",        react: "None",          next: "None",         vue: "None",           nuxt: "None",         astro: "None",            svelte: "None" },
  { feature: "Route contracts",      fiyuu: "First-class",          react: "Not available", next: "Partial",      vue: "Not available",  nuxt: "Partial",      astro: "Not available",   svelte: "Partial" },
  { feature: "Typed middleware",     fiyuu: "defineMiddleware",     react: "Not available", next: "Manual",       vue: "Not available",  nuxt: "Manual",       astro: "Manual",          svelte: "Manual" },
  { feature: "Client interactivity", fiyuu: "window.fiyuu runtime", react: "React hooks",   next: "React hooks",  vue: "Vue reactivity", nuxt: "Vue reactivity", astro: "Islands / any", svelte: "Svelte reactivity" },
  { feature: "AI-first design",      fiyuu: "Core principle",       react: "No",            next: "No",           vue: "No",             nuxt: "No",           astro: "No",              svelte: "No" },
  { feature: "Learning curve",       fiyuu: "Low",                  react: "Moderate",      next: "Moderate",     vue: "Low",            nuxt: "Moderate",     astro: "Low",             svelte: "Low" },
];

const MARQUEE_ITEMS = [
  "Route Contracts", "F1 Database", "GEA Components", "Zero Build Step",
  "Type-safe Middleware", "SSR Engine", "AI-first Design", "Browser Runtime",
  "Developer Console", "Live Reload", "Per-request Tracing", "TypeScript-first",
];

// Terminal lines for the create-fiyuu-app demo
const TERMINAL_STEPS = [
  { delay: 0,    type: "cmd",     text: "npm create fiyuu-app my-app" },
  { delay: 800,  type: "info",    text: "◆  Creating project structure..." },
  { delay: 1400, type: "success", text: "✔  app/page.tsx" },
  { delay: 1700, type: "success", text: "✔  app/layout.tsx" },
  { delay: 2000, type: "success", text: "✔  app/middleware.ts" },
  { delay: 2300, type: "success", text: "✔  lib/db.ts  ·  lib/auth.ts" },
  { delay: 2700, type: "info",    text: "◆  Installing dependencies..." },
  { delay: 3800, type: "success", text: "✔  Done in 1.2s" },
  { delay: 4400, type: "blank",   text: "" },
  { delay: 4500, type: "cmd",     text: "cd my-app && npx fiyuu dev" },
  { delay: 5200, type: "brand",   text: " ▲  Fiyuu v0.2.0  ready" },
  { delay: 5600, type: "route",   text: " ◆  GET  /           →  app/page.tsx" },
  { delay: 5900, type: "route",   text: " ◆  GET  /docs       →  app/docs/page.tsx" },
  { delay: 6200, type: "route",   text: " ◆  GET  /docs/:slug →  app/docs/[slug]/page.tsx" },
  { delay: 6500, type: "route",   text: " ◆  POST /auth       →  app/auth/action.ts" },
  { delay: 6800, type: "blank",   text: "" },
  { delay: 7000, type: "ready",   text: " ➜  http://localhost:4050" },
];

export default class LandingPage extends Component<PageProps<HomeData>> {
  template({ data }: PageProps<HomeData> = this.props) {
    const version = data?.latestVersion ?? "0.1.0";
    const docCount = data?.docCount ?? 0;

    /* ── Marquee ── */
    const marqueeContent = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
      .map(item => `
        <span style="display:inline-flex;align-items:center;gap:0.75rem;flex-shrink:0;padding:0 1.5rem">
          <span style="width:3px;height:3px;background:#d4d4d8;display:inline-block;flex-shrink:0"></span>
          <span style="font-size:0.75rem;font-weight:500;color:#71717a;white-space:nowrap;letter-spacing:0.02em;text-transform:uppercase">${escapeHtml(item)}</span>
        </span>
      `).join("");

    /* ── Comparison table ── */
    const tableRows = comparisonRows.map((row, i) => `
      <tr style="border-bottom:1px solid #f4f4f5;background:${i % 2 === 0 ? "white" : "#fafafa"}">
        <td style="padding:0.6rem 1rem;font-size:0.8rem;color:#52525b;font-weight:500;white-space:nowrap;border-right:1px solid #f4f4f5">${escapeHtml(row.feature)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;font-weight:700;color:#18181b;background:rgba(0,0,0,0.02);border-right:1px solid #f4f4f5">${escapeHtml(row.fiyuu)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa;border-right:1px solid #f4f4f5">${escapeHtml(row.react)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa;border-right:1px solid #f4f4f5">${escapeHtml(row.next)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa;border-right:1px solid #f4f4f5">${escapeHtml(row.vue)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa;border-right:1px solid #f4f4f5">${escapeHtml(row.nuxt)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa;border-right:1px solid #f4f4f5">${escapeHtml(row.astro)}</td>
        <td style="padding:0.6rem 0.875rem;font-size:0.8rem;text-align:center;color:#a1a1aa">${escapeHtml(row.svelte)}</td>
      </tr>
    `).join("");

    /* ── Terminal step data for JS ── */
    const stepsJson = JSON.stringify(TERMINAL_STEPS);

    return html`
      <!-- ── Page-level styles ──────────────────────────────────── -->
      <style>
        @keyframes fiyuu-fly {
          0%   { transform: translateY(var(--fy)) translateX(var(--fx)) rotate(var(--fr)) scale(0.75); opacity: 0; filter: blur(10px); }
          100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes fiyuu-fade-up {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fiyuu-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fiyuu-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes fiyuu-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fiyuu-slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fy-letter {
          display: inline-block; opacity: 0;
          animation: fiyuu-fly 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--fd, 0ms);
        }
        .fy-fade {
          opacity: 0;
          animation: fiyuu-fade-up 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--fd, 0ms);
        }
        .fy-marquee-track {
          display: flex; align-items: center; width: max-content;
          animation: fiyuu-marquee 32s linear infinite;
        }
        .fy-marquee-track:hover { animation-play-state: paused; }
        .fy-pulse { animation: fiyuu-pulse 2s ease-in-out infinite; }
        .fy-cursor { animation: fiyuu-blink 1s step-end infinite; }
        .fy-term-line { animation: fiyuu-slide-in 0.2s ease both; }
        .fy-bento { transition: border-color 0.15s; }
        .fy-bento:hover { border-color: #a1a1aa !important; }
        .fy-bento-dark { transition: border-color 0.15s; }
        .fy-bento-dark:hover { border-color: #52525b !important; }
        .fy-btn-primary:hover { background: #27272a !important; }
        .fy-btn-outline:hover { border-color: #71717a !important; color: white !important; }
      </style>

      <main style="font-family:'Inter',system-ui,-apple-system,sans-serif">

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- HERO                                                    -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="position:relative;background:#08080a;overflow:hidden;min-height:94vh;display:flex;flex-direction:column;justify-content:center">
          <div style="position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);background-size:72px 72px"></div>
          <div style="position:absolute;top:-6rem;right:-4rem;width:32rem;height:32rem;background:radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%);pointer-events:none"></div>
          <!-- Speed lines -->
          <div style="position:absolute;left:0;right:0;pointer-events:none;top:44%;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.07) 30%,rgba(255,255,255,0.14) 50%,rgba(255,255,255,0.07) 70%,transparent 100%)"></div>
          <div style="position:absolute;left:0;right:0;pointer-events:none;top:50%;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 35%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 65%,transparent 100%)"></div>
          <div style="position:absolute;left:0;right:0;pointer-events:none;top:56%;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.07) 30%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.07) 70%,transparent 100%)"></div>

          <div style="position:relative;max-width:72rem;margin:0 auto;padding:7rem 1.5rem 6rem">
            <div class="fy-fade" style="--fd:0ms;display:inline-flex;align-items:center;gap:0.5rem;border:1px solid #2a2a2e;padding:0.25rem 0.75rem;margin-bottom:3rem;font-family:monospace;font-size:0.6875rem;color:#71717a;letter-spacing:0.04em">
              <span class="fy-pulse" style="width:6px;height:6px;background:#22c55e;display:inline-block;flex-shrink:0"></span>
              v${escapeHtml(version)} — stable release
            </div>

            <div style="margin-bottom:1.5rem;line-height:1;overflow:visible">
              <h1 style="margin:0;padding:0;font-size:clamp(5.5rem,15vw,12rem);font-weight:900;letter-spacing:-0.055em;color:white;line-height:0.9;user-select:none"><!--
                --><span class="fy-letter" style="--fd:40ms;  --fy:-80px; --fx:-45px; --fr:-11deg">F</span><!--
                --><span class="fy-letter" style="--fd:110ms; --fy:90px;  --fx:30px;  --fr:9deg">i</span><!--
                --><span class="fy-letter" style="--fd:180ms; --fy:-65px; --fx:-25px; --fr:-7deg">y</span><!--
                --><span class="fy-letter" style="--fd:250ms; --fy:75px;  --fx:35px;  --fr:10deg">u</span><!--
                --><span class="fy-letter" style="--fd:320ms; --fy:-70px; --fx:-30px; --fr:-8deg">u</span>
              </h1>
            </div>

            <div class="fy-fade" style="--fd:480ms;width:5rem;height:2px;background:linear-gradient(90deg,white,transparent);margin-bottom:1.75rem"></div>
            <p class="fy-fade" style="--fd:560ms;font-size:clamp(0.9rem,1.5vw,1.125rem);color:#a1a1aa;font-weight:300;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:0.75rem">A fullstack TypeScript framework for the AI era</p>
            <p class="fy-fade" style="--fd:640ms;font-size:0.9375rem;color:#52525b;line-height:1.75;max-width:40ch;margin-bottom:2.5rem">Route contracts, built-in F1 database, GEA components. No virtual DOM. No build pipeline. No configuration overhead.</p>

            <div class="fy-fade" style="--fd:720ms;display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem">
              <a href="/docs/getting-started" class="fy-btn-primary" style="display:inline-flex;align-items:center;gap:0.5rem;background:white;color:#08080a;padding:0.625rem 1.375rem;font-size:0.875rem;font-weight:600;text-decoration:none;transition:background 0.15s;letter-spacing:-0.01em">
                Get started
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </a>
              <a href="/docs" class="fy-btn-outline" style="display:inline-flex;align-items:center;gap:0.5rem;border:1px solid #2a2a2e;color:#71717a;padding:0.625rem 1.375rem;font-size:0.875rem;font-weight:500;text-decoration:none;transition:border-color 0.15s,color 0.15s;letter-spacing:-0.01em">
                Documentation <span style="font-family:monospace;color:#3f3f46;font-size:0.8rem">${docCount} pages</span>
              </a>
            </div>

            <div class="fy-fade" style="--fd:840ms;margin-top:4.5rem;padding-top:2rem;border-top:1px solid #1c1c1f;display:flex;align-items:center;gap:4rem">
              <div>
                <p style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:white;font-variant-numeric:tabular-nums;letter-spacing:-0.04em;margin:0">${docCount}</p>
                <p style="font-size:0.6875rem;color:#52525b;margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.07em">Doc pages</p>
              </div>
              <div style="width:1px;height:2.5rem;background:#1c1c1f"></div>
              <div>
                <p style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:white;letter-spacing:-0.04em;margin:0">v${escapeHtml(version)}</p>
                <p style="font-size:0.6875rem;color:#52525b;margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.07em">Latest stable</p>
              </div>
              <div style="width:1px;height:2.5rem;background:#1c1c1f"></div>
              <div>
                <p style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:white;letter-spacing:-0.04em;margin:0">0ms</p>
                <p style="font-size:0.6875rem;color:#52525b;margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.07em">Build time</p>
              </div>
              <div style="width:1px;height:2.5rem;background:#1c1c1f"></div>
              <div>
                <p style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:white;letter-spacing:-0.04em;margin:0">5</p>
                <p style="font-size:0.6875rem;color:#52525b;margin-top:0.25rem;text-transform:uppercase;letter-spacing:0.07em">Files per route</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- MARQUEE                                                 -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <div style="border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;padding:0.875rem 0;overflow:hidden;background:#fafafa">
          <div class="fy-marquee-track">${marqueeContent}</div>
        </div>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- BENTO GRID                                              -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="max-width:72rem;margin:0 auto;padding:5rem 1.5rem">
          <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:0.5rem">Capabilities</p>
          <h2 style="font-size:1.625rem;font-weight:700;color:#18181b;letter-spacing:-0.03em;margin-bottom:3rem">Everything included. Nothing unnecessary.</h2>

          <div style="display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:auto auto;gap:1px;background:#e4e4e7">
            <!-- Route Contracts — 8 cols, 2 rows -->
            <div class="fy-bento-dark" style="grid-column:span 8;grid-row:span 2;background:#09090b;border:1px solid #27272a;padding:2.25rem;display:flex;flex-direction:column;min-height:300px">
              <div style="width:2.25rem;height:2.25rem;border:1px solid #27272a;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:1rem;background:#111113">
                <svg width="16" height="16" fill="none" stroke="#71717a" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 style="font-size:1.0625rem;font-weight:600;color:white;margin-bottom:0.625rem;letter-spacing:-0.02em">Route Contracts</h3>
              <p style="font-size:0.875rem;color:#71717a;line-height:1.7;max-width:38ch;margin-bottom:auto">Every route owns its schema, query, action, page and meta. Isolated by design — no global state, no prop drilling. Each directory is a fully self-contained contract.</p>
              <div style="margin-top:2rem;border:1px solid #1c1c1f;background:#060608;padding:1rem 1.25rem">
                <div style="font-family:monospace;font-size:0.75rem;line-height:2.1;color:#3f3f46">
                  <div><span style="color:#27272a">app/posts/</span></div>
                  <div style="padding-left:1.25rem"><span style="color:#3f3f46">├─</span> <span style="color:#71717a">schema.ts</span></div>
                  <div style="padding-left:1.25rem"><span style="color:#3f3f46">├─</span> <span style="color:#71717a">query.ts</span></div>
                  <div style="padding-left:1.25rem"><span style="color:#3f3f46">├─</span> <span style="color:#71717a">action.ts</span></div>
                  <div style="padding-left:1.25rem"><span style="color:#3f3f46">├─</span> <span style="color:#71717a">page.tsx</span></div>
                  <div style="padding-left:1.25rem"><span style="color:#3f3f46">└─</span> <span style="color:#a1a1aa;font-weight:500">meta.ts</span></div>
                </div>
              </div>
            </div>
            <!-- F1 Database -->
            <div class="fy-bento" style="grid-column:span 4;background:white;border:1px solid #e4e4e7;padding:1.75rem;display:flex;flex-direction:column;gap:0.75rem">
              <div style="width:2rem;height:2rem;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#fafafa">
                <svg width="15" height="15" fill="none" stroke="#71717a" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/></svg>
              </div>
              <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;letter-spacing:-0.02em;margin:0">F1 Database</h3>
              <p style="font-size:0.8125rem;color:#71717a;line-height:1.65;margin:0">Zero-config JSON store. No connection strings, no migrations. Replace with Prisma or Drizzle when you scale.</p>
            </div>
            <!-- Browser Runtime -->
            <div class="fy-bento-dark" style="grid-column:span 4;background:#09090b;border:1px solid #27272a;padding:1.75rem;display:flex;flex-direction:column;gap:0.75rem">
              <div style="width:2rem;height:2rem;border:1px solid #27272a;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#111113">
                <svg width="15" height="15" fill="none" stroke="#a1a1aa" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 style="font-size:0.9375rem;font-weight:600;color:white;letter-spacing:-0.02em;margin:0">Browser Runtime</h3>
              <p style="font-size:0.8125rem;color:#71717a;line-height:1.65;margin:0">window.fiyuu — reactive state, server actions, partial renders. No build step required.</p>
              <div style="border:1px solid #1c1c1f;background:#060608;padding:0.5rem 0.875rem;font-family:monospace;font-size:0.75rem;margin-top:auto;color:#52525b">
                <span style="color:#818cf8">window</span>.<span style="color:#38bdf8">fiyuu</span>.<span style="color:#c084fc">action</span>(path, data)
              </div>
            </div>
            <!-- GEA Components -->
            <div class="fy-bento" style="grid-column:span 3;background:#fafafa;border:1px solid #e4e4e7;padding:1.75rem;display:flex;flex-direction:column;gap:0.75rem">
              <div style="width:2rem;height:2rem;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="15" height="15" fill="none" stroke="#71717a" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
              </div>
              <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;letter-spacing:-0.02em;margin:0">GEA Components</h3>
              <p style="font-size:0.8125rem;color:#71717a;line-height:1.65;margin:0">Class-based SSR components with <code style="font-family:monospace;font-size:0.75rem;background:#ebebeb;padding:0.1em 0.3em">html</code> tagged templates. No VDOM overhead.</p>
            </div>
            <!-- Typed Middleware -->
            <div class="fy-bento" style="grid-column:span 3;background:white;border:1px solid #e4e4e7;padding:1.75rem;display:flex;flex-direction:column;gap:0.75rem">
              <div style="width:2rem;height:2rem;border:1px solid #e4e4e7;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#fafafa">
                <svg width="15" height="15" fill="none" stroke="#71717a" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;letter-spacing:-0.02em;margin:0">Typed Middleware</h3>
              <p style="font-size:0.8125rem;color:#71717a;line-height:1.65;margin:0"><code style="font-family:monospace;font-size:0.75rem;background:#f4f4f5;padding:0.1em 0.3em">defineMiddleware</code> — auth guards, redirects, header injection. Fully statically checked.</p>
            </div>
            <!-- Dev Console -->
            <div class="fy-bento" style="grid-column:span 6;background:#f0fdf4;border:1px solid #bbf7d0;padding:1.75rem;display:flex;align-items:center;gap:1.5rem">
              <div style="width:2.5rem;height:2.5rem;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:white">
                <svg width="16" height="16" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h3 style="font-size:0.9375rem;font-weight:600;color:#166534;letter-spacing:-0.02em;margin:0 0 0.375rem">Developer Console</h3>
                <p style="font-size:0.8125rem;color:#15803d;line-height:1.6;margin:0">Live reload, route graph, per-request tracing. Enabled automatically in <code style="font-family:monospace;font-size:0.75rem;background:white;padding:0.1em 0.35em;border:1px solid #bbf7d0">dev</code> mode.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- TERMINAL DEMO — create-fiyuu-app                       -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="background:#09090b;border-top:1px solid #1c1c1f">
          <div style="max-width:72rem;margin:0 auto;padding:5rem 1.5rem">

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center">

              <!-- Left: copy -->
              <div>
                <p style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:#3f3f46;margin-bottom:0.625rem">Get started</p>
                <h2 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;color:white;letter-spacing:-0.04em;line-height:1.1;margin-bottom:1.25rem">
                  From zero to running<br/>in under 10 seconds.
                </h2>
                <p style="font-size:0.9375rem;color:#52525b;line-height:1.75;margin-bottom:2rem;max-width:36ch">
                  One command scaffolds your entire project. Route contracts, auth, database, middleware — all wired up and ready to extend.
                </p>
                <div style="display:flex;flex-direction:column;gap:0.875rem">
                  <div style="display:flex;align-items:baseline;gap:0.875rem">
                    <span style="font-family:monospace;font-size:0.75rem;font-weight:700;color:#3f3f46;min-width:1.5rem">01</span>
                    <div>
                      <p style="font-size:0.875rem;font-weight:600;color:#a1a1aa;margin:0 0 0.125rem">Scaffold</p>
                      <p style="font-size:0.8125rem;color:#52525b;margin:0">Run <code style="font-family:monospace;font-size:0.75rem;background:#111113;color:#a1a1aa;padding:0.1em 0.4em;border:1px solid #1c1c1f">npm create fiyuu-app</code> and answer two questions.</p>
                    </div>
                  </div>
                  <div style="display:flex;align-items:baseline;gap:0.875rem">
                    <span style="font-family:monospace;font-size:0.75rem;font-weight:700;color:#3f3f46;min-width:1.5rem">02</span>
                    <div>
                      <p style="font-size:0.875rem;font-weight:600;color:#a1a1aa;margin:0 0 0.125rem">Run</p>
                      <p style="font-size:0.8125rem;color:#52525b;margin:0">Start the dev server — routes are discovered automatically.</p>
                    </div>
                  </div>
                  <div style="display:flex;align-items:baseline;gap:0.875rem">
                    <span style="font-family:monospace;font-size:0.75rem;font-weight:700;color:#3f3f46;min-width:1.5rem">03</span>
                    <div>
                      <p style="font-size:0.875rem;font-weight:600;color:#a1a1aa;margin:0 0 0.125rem">Build</p>
                      <p style="font-size:0.8125rem;color:#52525b;margin:0">Add route contracts. The framework types everything end-to-end.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: live terminal -->
              <div>
                <!-- Terminal window chrome -->
                <div style="border:1px solid #1c1c1f;background:#060608;overflow:hidden">
                  <!-- Title bar -->
                  <div style="padding:0.625rem 1rem;border-bottom:1px solid #111113;display:flex;align-items:center;gap:0.5rem;background:#0a0a0c">
                    <div style="width:10px;height:10px;background:#3f3f46"></div>
                    <div style="width:10px;height:10px;background:#3f3f46"></div>
                    <div style="width:10px;height:10px;background:#3f3f46"></div>
                    <span style="margin-left:0.75rem;font-family:monospace;font-size:0.6875rem;color:#3f3f46">zsh — fiyuu-demo</span>
                    <!-- Live indicator -->
                    <div style="margin-left:auto;display:flex;align-items:center;gap:0.375rem">
                      <span class="fy-pulse" style="width:6px;height:6px;background:#22c55e;display:inline-block"></span>
                      <span style="font-size:0.625rem;font-family:monospace;color:#22c55e;text-transform:uppercase;letter-spacing:0.06em">live</span>
                    </div>
                  </div>
                  <!-- Terminal body -->
                  <div id="fy-terminal" style="padding:1.25rem 1.25rem 1.5rem;font-family:monospace;font-size:0.8rem;line-height:1.8;min-height:20rem;color:#a1a1aa;position:relative">
                    <!-- Lines injected by JS -->
                    <span id="fy-cursor" class="fy-cursor" style="display:inline-block;width:8px;height:1em;background:#a1a1aa;vertical-align:text-bottom;position:absolute;bottom:1.5rem;left:1.25rem"></span>
                  </div>
                </div>
                <!-- Replay button -->
                <button id="fy-replay" onclick="startTerminalDemo()"
                  style="margin-top:0.75rem;display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:#52525b;background:transparent;border:none;cursor:pointer;font-family:monospace;padding:0;transition:color 0.12s"
                  onmouseover="this.style.color='#a1a1aa'" onmouseout="this.style.color='#52525b'">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  replay demo
                </button>
              </div>

            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- CODE SHOWCASE                                           -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="background:#09090b;border-top:1px solid #1c1c1f;border-bottom:1px solid #1c1c1f">
          <div style="max-width:72rem;margin:0 auto;padding:4.5rem 1.5rem">
            <p style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:#3f3f46;margin-bottom:0.5rem">Route contract — 5 files, fully typed</p>
            <h2 style="font-size:1.625rem;font-weight:700;color:white;letter-spacing:-0.03em;margin-bottom:3rem">Build faster with contracts.</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#1c1c1f">
              <div style="background:#070709;padding:1.75rem">
                <p style="font-family:monospace;font-size:0.6875rem;color:#3f3f46;margin-bottom:1rem;letter-spacing:0.02em">app/posts/query.ts</p>
                <pre style="margin:0;font-family:monospace;font-size:0.8125rem;line-height:1.75;overflow-x:auto"><code><span style="color:#c084fc">import</span> <span style="color:#e4e4e7">{ defineQuery }</span> <span style="color:#c084fc">from</span> <span style="color:#86efac">"@fiyuu/core/client"</span><span style="color:#3f3f46">;</span>

<span style="color:#c084fc">export const</span> <span style="color:#7dd3fc">query</span> <span style="color:#e4e4e7">= defineQuery({</span>
  <span style="color:#71717a">description:</span> <span style="color:#86efac">"Fetch all posts"</span><span style="color:#3f3f46">,</span>
  <span style="color:#71717a">input:</span>  <span style="color:#fbbf24">z</span><span style="color:#e4e4e7">.object({}),</span>
  <span style="color:#71717a">output:</span> <span style="color:#fbbf24">z</span><span style="color:#e4e4e7">.object({</span>
    <span style="color:#71717a">posts:</span> <span style="color:#fbbf24">z</span><span style="color:#e4e4e7">.array(PostSchema),</span>
  <span style="color:#e4e4e7">}),</span>
<span style="color:#e4e4e7">});</span>

<span style="color:#c084fc">export async function</span> <span style="color:#7dd3fc">execute</span><span style="color:#e4e4e7">() {</span>
  <span style="color:#c084fc">const</span> <span style="color:#e4e4e7">db =</span> <span style="color:#c084fc">await</span> <span style="color:#7dd3fc">readDb</span><span style="color:#e4e4e7">();</span>
  <span style="color:#c084fc">return</span> <span style="color:#e4e4e7">{ posts: db.posts };</span>
<span style="color:#e4e4e7">}</span></code></pre>
              </div>
              <div style="background:#070709;padding:1.75rem">
                <p style="font-family:monospace;font-size:0.6875rem;color:#3f3f46;margin-bottom:1rem;letter-spacing:0.02em">app/posts/page.tsx</p>
                <pre style="margin:0;font-family:monospace;font-size:0.8125rem;line-height:1.75;overflow-x:auto"><code><span style="color:#c084fc">import</span> <span style="color:#e4e4e7">{ Component }</span> <span style="color:#c084fc">from</span> <span style="color:#86efac">"@geajs/core"</span><span style="color:#3f3f46">;</span>
<span style="color:#c084fc">import</span> <span style="color:#e4e4e7">{ definePage, html,</span>
         <span style="color:#e4e4e7">type PageProps }</span> <span style="color:#c084fc">from</span> <span style="color:#86efac">"@fiyuu/core/client"</span><span style="color:#3f3f46">;</span>
<span style="color:#c084fc">import type</span> <span style="color:#e4e4e7">{ query }</span> <span style="color:#c084fc">from</span> <span style="color:#86efac">"./query.js"</span><span style="color:#3f3f46">;</span>

<span style="color:#c084fc">type</span> <span style="color:#fbbf24">Data</span> <span style="color:#e4e4e7">= InferQueryOutput&lt;</span><span style="color:#c084fc">typeof</span> <span style="color:#7dd3fc">query</span><span style="color:#e4e4e7">&gt;;</span>

<span style="color:#c084fc">export default class</span> <span style="color:#fbbf24">PostsPage</span>
  <span style="color:#c084fc">extends</span> <span style="color:#fbbf24">Component</span><span style="color:#e4e4e7">&lt;</span><span style="color:#fbbf24">PageProps</span><span style="color:#e4e4e7">&lt;</span><span style="color:#fbbf24">Data</span><span style="color:#e4e4e7">&gt;&gt; {</span>
  <span style="color:#7dd3fc">template</span><span style="color:#e4e4e7">({ data } =</span> <span style="color:#c084fc">this</span><span style="color:#e4e4e7">.props) {</span>
    <span style="color:#c084fc">return</span> <span style="color:#fbbf24">html</span><span style="color:#86efac">\`&lt;ul&gt;...&lt;/ul&gt;\`</span><span style="color:#3f3f46">;</span>
  <span style="color:#e4e4e7">}</span>
<span style="color:#e4e4e7">}</span></code></pre>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- WHY FIYUU                                               -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="max-width:72rem;margin:0 auto;padding:5rem 1.5rem">
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:5rem;align-items:start">
            <div>
              <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:0.5rem">The name</p>
              <h2 style="font-size:1.625rem;font-weight:700;color:#18181b;letter-spacing:-0.03em;margin-bottom:1rem">Why "Fiyuu"?</h2>
              <p style="font-size:0.875rem;color:#71717a;line-height:1.7">The name captures the framework's intent: fast, deliberate, and minimal. Each part reflects a core design principle.</p>
            </div>
            <div style="border:1px solid #e4e4e7">
              <div style="display:flex;align-items:flex-start;gap:1.25rem;padding:1.375rem 1.75rem;border-bottom:1px solid #e4e4e7">
                <span style="font-family:monospace;font-size:0.6875rem;font-weight:700;color:#71717a;background:#f4f4f5;padding:0.2em 0.5em;flex-shrink:0;margin-top:0.125rem">F</span>
                <div>
                  <p style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0 0 0.375rem;letter-spacing:-0.02em">Feature-first architecture</p>
                  <p style="font-size:0.8125rem;color:#71717a;line-height:1.7;margin:0">Every route is a self-contained contract. Schema, query, action, page, and meta live together — isolated, testable, and replaceable independently.</p>
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:1.25rem;padding:1.375rem 1.75rem;border-bottom:1px solid #e4e4e7">
                <span style="font-family:monospace;font-size:0.6875rem;font-weight:700;color:#71717a;background:#f4f4f5;padding:0.2em 0.5em;flex-shrink:0;margin-top:0.125rem">1</span>
                <div>
                  <p style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0 0 0.375rem;letter-spacing:-0.02em">F1 — first-lap performance</p>
                  <p style="font-size:0.8125rem;color:#71717a;line-height:1.7;margin:0">Built-in F1 database requires zero configuration. From zero to a working data layer in one file. Replace it with Prisma or Drizzle when the time comes.</p>
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:1.25rem;padding:1.375rem 1.75rem">
                <span style="font-family:monospace;font-size:0.6875rem;font-weight:700;color:#71717a;background:#f4f4f5;padding:0.2em 0.5em;flex-shrink:0;margin-top:0.125rem">uu</span>
                <div>
                  <p style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0 0 0.375rem;letter-spacing:-0.02em">Unified — server and client</p>
                  <p style="font-size:0.8125rem;color:#71717a;line-height:1.7;margin:0">The same contract that shapes the server query also types the page component and the browser runtime. One source of truth — no duplication, no drift.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- COMPARISON                                              -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="border-top:1px solid #e4e4e7;background:#fafafa">
          <div style="max-width:72rem;margin:0 auto;padding:5rem 1.5rem">
            <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:0.5rem">Comparison</p>
            <h2 style="font-size:1.625rem;font-weight:700;color:#18181b;letter-spacing:-0.03em;margin-bottom:0.5rem">Fiyuu vs. the ecosystem</h2>
            <p style="font-size:0.875rem;color:#71717a;margin-bottom:2.5rem">Side-by-side against React, Next.js, Vue, Nuxt, Astro, and SvelteKit.</p>
            <div style="border:1px solid #e4e4e7;overflow:hidden;background:white">
              <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-family:'Inter',system-ui,sans-serif">
                  <thead>
                    <tr style="border-bottom:1px solid #e4e4e7;background:#f9f9f9">
                      <th style="text-align:left;padding:0.6rem 1rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;min-width:150px;border-right:1px solid #f4f4f5">Feature</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:700;color:#18181b;text-transform:uppercase;letter-spacing:0.07em;background:rgba(0,0,0,0.025);border-right:1px solid #ebebeb">Fiyuu</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;border-right:1px solid #f4f4f5">React</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;border-right:1px solid #f4f4f5">Next.js</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;border-right:1px solid #f4f4f5">Vue</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;border-right:1px solid #f4f4f5">Nuxt</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;border-right:1px solid #f4f4f5">Astro</th>
                      <th style="text-align:center;padding:0.6rem 0.875rem;font-size:0.625rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em">Svelte</th>
                    </tr>
                  </thead>
                  <tbody>${tableRows}</tbody>
                </table>
              </div>
            </div>
            <p style="margin-top:0.75rem;font-size:0.75rem;color:#a1a1aa">Partial = achievable without framework enforcement. Comparison based on Fiyuu v${escapeHtml(version)}.</p>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════ -->
        <!-- CTA                                                     -->
        <!-- ═══════════════════════════════════════════════════════ -->
        <section style="background:#09090b;border-top:1px solid #1c1c1f">
          <div style="max-width:72rem;margin:0 auto;padding:6rem 1.5rem;text-align:center">
            <p style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#3f3f46;margin-bottom:1rem">Start building</p>
            <h2 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;color:white;letter-spacing:-0.05em;line-height:0.95;margin-bottom:1.25rem">
              Build the future<br/>with Fiyuu.
            </h2>
            <p style="font-size:0.9375rem;color:#52525b;margin-bottom:2.5rem;max-width:36ch;margin-left:auto;margin-right:auto;line-height:1.75">
              The documentation covers everything from your first route to production deployment.
            </p>
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0.75rem">
              <a href="/docs/getting-started"
                style="display:inline-flex;align-items:center;gap:0.5rem;background:white;color:#09090b;padding:0.75rem 1.75rem;font-size:0.875rem;font-weight:600;text-decoration:none;transition:background 0.15s;letter-spacing:-0.01em"
                onmouseover="this.style.background='#f4f4f5'" onmouseout="this.style.background='white'">
                Read the documentation
              </a>
              <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noopener"
                style="display:inline-flex;align-items:center;gap:0.5rem;border:1px solid #27272a;color:#71717a;padding:0.75rem 1.75rem;font-size:0.875rem;font-weight:500;text-decoration:none;transition:border-color 0.15s,color 0.15s;letter-spacing:-0.01em"
                onmouseover="this.style.borderColor='#52525b';this.style.color='#e4e4e7'" onmouseout="this.style.borderColor='#27272a';this.style.color='#71717a'">
                ${GITHUB_ICON} View on GitHub
              </a>
            </div>
          </div>
        </section>

      </main>

      <!-- ── Terminal demo script ───────────────────────────────── -->
      <script>
        const STEPS = ${stepsJson};

        const COLOR = {
          cmd:     '#e4e4e7',
          info:    '#71717a',
          success: '#22c55e',
          brand:   '#818cf8',
          route:   '#38bdf8',
          ready:   '#22c55e',
          blank:   '',
        };

        const PREFIX = {
          cmd:     '<span style="color:#3f3f46;user-select:none">$ </span>',
          info:    '',
          success: '',
          brand:   '',
          route:   '',
          ready:   '',
          blank:   '',
        };

        let timers = [];

        function clearTimers() {
          timers.forEach(clearTimeout);
          timers = [];
        }

        function startTerminalDemo() {
          clearTimers();
          const term = document.getElementById('fy-terminal');
          const cursor = document.getElementById('fy-cursor');
          if (!term || !cursor) return;
          term.innerHTML = '';
          term.appendChild(cursor);

          STEPS.forEach((step) => {
            const t = setTimeout(() => {
              if (step.type === 'blank') {
                const br = document.createElement('div');
                br.style.height = '0.4rem';
                term.insertBefore(br, cursor);
                return;
              }
              const line = document.createElement('div');
              line.className = 'fy-term-line';
              line.style.color = COLOR[step.type] || '#a1a1aa';
              line.innerHTML = (PREFIX[step.type] || '') + escapeText(step.text);
              term.insertBefore(line, cursor);
              cursor.style.display = 'none';
              // Show cursor after last step
              if (step === STEPS[STEPS.length - 1]) {
                setTimeout(() => { cursor.style.display = 'inline-block'; }, 300);
              }
            }, step.delay);
            timers.push(t);
          });
        }

        function escapeText(str) {
          return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        // Auto-start when terminal is visible
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              startTerminalDemo();
              observer.disconnect();
            }
          });
        }, { threshold: 0.3 });

        const termEl = document.getElementById('fy-terminal');
        if (termEl) observer.observe(termEl);

        window.startTerminalDemo = startTerminalDemo;
      </script>
    `;
  }
}
