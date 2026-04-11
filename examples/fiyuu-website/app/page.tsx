/**
 * app/page.ts → Route: /
 * 
 * Fiyuu Landing Page - Intent-Based
 */

import { definePage, html, when, memoAsync } from "@fiyuu/core";

// SVG Icons (inline for zero deps)
const iconBrain = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7Z"/><path stroke-linecap="round" d="M9 21h6M10 17v4M14 17v4"/></svg>`;
const iconFile = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path stroke-linecap="round" d="M15 2v5h5M9 13h6M9 17h3"/></svg>`;
const iconZap = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`;
const iconDatabase = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><ellipse cx="12" cy="5" rx="9" ry="3"/><path stroke-linecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path stroke-linecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`;
const iconSignal = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M2 20h.01M6 16v4M10 12v8M14 8v12M18 4v16M22 2v18"/></svg>`;
const iconSearch = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m16 16 5 5"/></svg>`;
const iconShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path stroke-linecap="round" d="m9 12 2 2 4-4"/></svg>`;
const iconRocket = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path stroke-linecap="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path stroke-linecap="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`;
const iconGithub = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z"/></svg>`;
const iconArrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>`;
const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

// Memoized data loading
const getFeatures = memoAsync(async () => [
  { icon: iconBrain, title: "AI-Native Project Context", desc: "Auto-generate project graphs and AI docs with fiyuu sync. Copilot, Cursor, and every LLM understands your structure." },
  { icon: iconFile, title: "Deterministic Contracts", desc: "Fixed file conventions: page.tsx, query.ts, action.ts, schema.ts, meta.ts. Every route follows the same rules." },
  { icon: iconZap, title: "Spring Boot Style Decorators", desc: "@Controller, @Service, @Repository, @Guard, @Scheduled — enterprise patterns made simple." },
  { icon: iconDatabase, title: "Advanced F1 DB", desc: "Indexing, transactions, migrations, relations. SQL-like API with zero setup." },
  { icon: iconSignal, title: "Real-Time Channels", desc: "WebSocket rooms, NATS integration. Auth on upgrade, message routing, reconnection — all built-in." },
  { icon: iconSearch, title: "Integrated Components", desc: "FiyuuImage, FiyuuVideo, FiyuuLink, FiyuuHead — lazy loading, responsive, CLS-free." },
  { icon: iconShield, title: "Type-Safe Everything", desc: "Zod schemas, DTO validation, automatic HTTP exceptions. Input validation, output typing — all in one schema." },
  { icon: iconRocket, title: "Always-Alive Services", desc: "Background jobs, schedulers, listeners. Not request-driven. Cron jobs, file sync, message processing — native." },
], { ttl: 3600, tags: ["content"] });

export default definePage({
  // Route: / (dosya path'inden)
  
  load: () => getFeatures(),
  
  render: ({ data: features }) => html`
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 border-b" style="border-color: var(--border-subtle); background: rgba(9,9,11,0.85); backdrop-filter: blur(16px);">
      <div style="max-width:1200px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; height:56px;">
        <a href="/" style="text-decoration:none; display:flex; align-items:center; gap:8px;">
          <span style="font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:var(--text); letter-spacing:-0.03em;">fiyuu</span>
          <span style="font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--text-muted); letter-spacing:0.1em; text-transform:uppercase; padding:2px 6px; border:1px solid var(--border); border-radius:2px;">v0.5.0</span>
        </a>
        <div style="display:flex; align-items:center; gap:32px;">
          <a href="/docs" class="nav-link">Docs</a>
          <a href="/architecture" class="nav-link">Architecture</a>
          <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" class="btn-ghost" style="padding:8px 14px; font-size:11px;">${iconGithub} GitHub</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section style="position:relative; max-width:1200px; margin:0 auto; padding:160px 24px 120px;">
      <div style="position:absolute; top:-40px; left:50%; transform:translateX(-50%); width:600px; height:400px; background:radial-gradient(ellipse, var(--accent-soft) 0%, transparent 70%); pointer-events:none; z-index:0;"></div>
      
      <div style="position:relative; z-index:1; max-width:800px;">
        <div style="display:inline-flex; align-items:center; gap:10px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); letter-spacing:0.06em; padding:8px 0; border-bottom:1px solid var(--border-subtle); margin-bottom:40px;">
          <span style="display:block; width:6px; height:6px; background:var(--accent); border-radius:50%;"></span>
          AI-native fullstack framework — v0.5.0
        </div>
        
        <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(40px, 7vw, 80px); font-weight:800; line-height:1.05; letter-spacing:-0.03em; color:var(--text); margin-bottom:24px;">
          The framework<br />AI can actually<br /><span style="color:var(--accent);">read.</span>
        </h1>
        
        <p style="font-size:17px; line-height:1.7; color:var(--text-secondary); max-width:520px; margin-bottom:40px;">
          Deterministic file contracts. Machine-readable project structures.
          Built for teams that ship with AI — not against it.
        </p>
        
        <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
          <a href="#start" class="btn-primary">Get Started ${iconArrow}</a>
          <a href="#features" class="btn-ghost">How It Works</a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
      <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 44px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:56px;">
        Everything you need,<br /><span style="color:var(--accent);">nothing you don't.</span>
      </h2>
      
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1px; background:var(--border-subtle); border:1px solid var(--border-subtle); border-radius:2px; overflow:hidden;">
        ${features.map((f) => html`
          <div class="bp-card" style="padding:28px; background:var(--bg-elevated);">
            <div style="margin-bottom:20px; color:var(--accent);">${f.icon}</div>
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:8px; letter-spacing:0.01em;">${f.title}</h3>
            <p style="font-size:13px; line-height:1.65; color:var(--text-secondary);">${f.desc}</p>
          </div>
        `).join("")}
      </div>
    </section>

    <!-- Benchmark -->
    <section id="benchmark" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
      <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:48px;">
        Numbers that <span style="color:var(--accent);">speak.</span>
      </h2>
      
      <div style="overflow-x:auto; margin-bottom:24px;">
        <table class="bp-table">
          <thead>
            <tr>
              <th style="text-align:left;">Metric</th>
              <th style="color:var(--accent); text-align:center;">Fiyuu</th>
              <th style="text-align:center;">Next.js 15</th>
              <th style="text-align:center;">Astro 5</th>
              <th style="text-align:center;">Nuxt 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight:500;">Cold Build Time</td>
              <td style="text-align:center; color:var(--accent); font-weight:600;">0.39s</td>
              <td style="text-align:center;">4.2s</td>
              <td style="text-align:center;">2.8s</td>
              <td style="text-align:center;">6.5s</td>
            </tr>
            <tr>
              <td style="font-weight:500;">SSR p95 Latency</td>
              <td style="text-align:center; color:var(--accent); font-weight:600;">1.07ms</td>
              <td style="text-align:center;">12ms</td>
              <td style="text-align:center;">3ms</td>
              <td style="text-align:center;">18ms</td>
            </tr>
            <tr>
              <td style="font-weight:500;">Dev Server Start</td>
              <td style="text-align:center; color:var(--accent); font-weight:600;">&lt;100ms</td>
              <td style="text-align:center;">2.1s</td>
              <td style="text-align:center;">800ms</td>
              <td style="text-align:center;">3.2s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Quick Start -->
    <section id="start" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
      <div class="bp-border" style="background:var(--bg-elevated); padding:48px 40px; border-radius:2px;">
        <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:48px;">
          Up and running in <span style="color:var(--accent);">30 seconds.</span>
        </h2>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:32px;">
          <div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:700; color:var(--accent-soft); line-height:1; -webkit-text-stroke:1px var(--accent); opacity:0.3;">01</div>
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Create a project</h3>
            <div class="code-frame"><div class="code-frame-body" style="padding:16px;"><pre style="font-size:13px; color:var(--accent);">npm create fiyuu-app@latest my-app</pre></div></div>
          </div>
          
          <div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:700; color:var(--accent-soft); line-height:1; -webkit-text-stroke:1px var(--accent); opacity:0.3;">02</div>
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Install dependencies</h3>
            <div class="code-frame"><div class="code-frame-body" style="padding:16px;"><pre style="font-size:13px; color:var(--accent);">cd my-app && npm install</pre></div></div>
          </div>
          
          <div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:32px; font-weight:700; color:var(--accent-soft); line-height:1; -webkit-text-stroke:1px var(--accent); opacity:0.3;">03</div>
            <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Start developing</h3>
            <div class="code-frame"><div class="code-frame-body" style="padding:16px;"><pre style="font-size:13px; color:var(--accent);">npm run dev</pre></div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer style="border-top:1px solid var(--border-subtle); padding:40px 24px;">
      <div style="max-width:1200px; margin:0 auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:var(--text); letter-spacing:-0.03em;">fiyuu</span>
          <span style="font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--text-dim); letter-spacing:0.1em;">v0.5.0</span>
        </div>
        <p style="font-size:12px; color:var(--text-muted);">
          Built by Hacı Mert Gökhan — <a href="https://hacimertgokhan.com" target="_blank" style="color:var(--text-secondary); text-decoration:none;">hacimertgokhan.com</a>
        </p>
      </div>
    </footer>
  `,
  
  // SEO - Content'den dinamik
  seo: {
    meta: {
      title: "Fiyuu — The Framework AI Can Actually Read",
      description: "Deterministic file contracts. Machine-readable project structures. Built for teams that ship with AI.",
      og: { type: "website" },
    },
    auto: {
      titleSelector: "h1",
      descSelector: "p",
    },
    sitemap: {
      priority: 1.0,
      changefreq: "weekly",
    },
  },
  
  // Cache
  cache: {
    revalidate: 3600,
    tags: ["homepage"],
  },
});
