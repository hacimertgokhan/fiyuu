import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Fiyuu framework landing page — modern deterministic design" });

export default class HomePage extends Component<PageProps> {
  template() {
    const iconBrain = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7Z"/><path stroke-linecap="round" d="M9 21h6M10 17v4M14 17v4"/></svg>`);
    const iconFile = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path stroke-linecap="round" d="M15 2v5h5M9 13h6M9 17h3"/></svg>`);
    const iconZap = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`);
    const iconDatabase = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><ellipse cx="12" cy="5" rx="9" ry="3"/><path stroke-linecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path stroke-linecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`);
    const iconSignal = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M2 20h.01M6 16v4M10 12v8M14 8v12M18 4v16M22 2v18"/></svg>`);
    const iconSearch = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m16 16 5 5"/></svg>`);
    const iconShield = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/></svg>`);
    const iconRocket = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`);
    const iconGithub = raw(`<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z"/></svg>`);
    const iconArrow = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>`);
    const iconCheck = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`);
    const iconFolder = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"/></svg>`);
    const iconLayers = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`);
    const iconSend = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7Z"/></svg>`);

    const features = [
      { icon: iconBrain.value, title: "AI-Native Project Context", desc: "Auto-generate project graphs and AI docs with fiyuu sync. Copilot, Cursor, and every LLM understands your structure." },
      { icon: iconFile.value, title: "Deterministic Contracts", desc: "Fixed file conventions: page.tsx, query.ts, action.ts, schema.ts, meta.ts. Every route follows the same rules. No hidden behavior." },
      { icon: iconZap.value, title: "Spring Boot Style Decorators", desc: "@Controller, @Service, @Repository, @Guard, @Scheduled — enterprise patterns made simple. Dependency injection included." },
      { icon: iconDatabase.value, title: "Advanced F1 DB", desc: "Indexing, transactions, migrations, relations. SQL-like API with zero setup. Perfect for prototypes and data-heavy apps." },
      { icon: iconSignal.value, title: "Real-Time Channels", desc: "WebSocket rooms, NATS integration. Auth on upgrade, message routing, reconnection — all built-in." },
      { icon: iconSearch.value, title: "Integrated Components", desc: "FiyuuImage, FiyuuVideo, FiyuuLink, FiyuuHead — lazy loading, responsive, CLS-free. Zero external packages." },
      { icon: iconShield.value, title: "Type-Safe Everything", desc: "Zod schemas, DTO validation, automatic HTTP exceptions. Input validation, output typing — all in one schema." },
      { icon: iconRocket.value, title: "Always-Alive Services", desc: "Background jobs, schedulers, listeners. Not request-driven. Cron jobs, file sync, message processing — native." },
    ];

    return html`
      <!-- Navigation -->
      <nav class="fixed top-0 left-0 right-0 z-50 border-b" style="border-color: var(--border-subtle); background: rgba(9,9,11,0.85); backdrop-filter: blur(16px);">
        <div style="max-width:1200px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; height:56px;">
          <a href="/" style="text-decoration:none; display:flex; align-items:center; gap:8px;">
            <span style="font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:var(--text); letter-spacing:-0.03em;">fiyuu</span>
            <span style="font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--text-muted); letter-spacing:0.1em; text-transform:uppercase; padding:2px 6px; border:1px solid var(--border); border-radius:2px;">v0.4.1</span>
          </a>
          <div class="hidden md:flex" style="display:none; align-items:center; gap:32px;">
            <a href="/docs" class="nav-link">Docs</a>
            <a href="/architecture" class="nav-link">Architecture</a>
            <a href="/structure" class="nav-link">Structure</a>
            <a href="#start" class="nav-link">Get Started</a>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="btn-ghost" style="padding:8px 14px; font-size:11px;">
              ${iconGithub}
              <span class="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      <style>
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
          .sm\\:inline { display: inline !important; }
        }
      </style>

      <!-- ════════════════════════════════════════════ -->
      <!-- HERO -->
      <!-- ════════════════════════════════════════════ -->
      <section style="position:relative; max-width:1200px; margin:0 auto; padding:0 24px; padding-top:160px; padding-bottom:120px;">
        <div style="position:absolute; top:-40px; left:50%; transform:translateX(-50%); width:600px; height:400px; background:radial-gradient(ellipse, var(--accent-soft) 0%, transparent 70%); pointer-events:none; z-index:0;"></div>

        <div style="position:relative; z-index:1; max-width:800px;">
          <div class="reveal">
            <div style="display:inline-flex; align-items:center; gap:10px; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); letter-spacing:0.06em; padding:8px 0; border-bottom:1px solid var(--border-subtle); margin-bottom:40px;">
              <span class="pulse-line" style="display:block; width:6px; height:6px; background:var(--accent); border-radius:50%;"></span>
              AI-native fullstack framework — v0.4.1
            </div>
          </div>

          <h1 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(40px, 7vw, 80px); font-weight:800; line-height:1.05; letter-spacing:-0.03em; color:var(--text); margin-bottom:24px;">
            The framework<br />AI can actually<br /><span style="color:var(--accent);">read.</span>
          </h1>

          <p class="reveal d2" style="font-size:17px; line-height:1.7; color:var(--text-secondary); max-width:520px; margin-bottom:40px;">
            Deterministic file contracts. Machine-readable project structures.
            Built for teams that ship with AI — not against it.
          </p>

          <div class="reveal d3" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
            <a href="#start" class="btn-primary">
              Get Started
              ${iconArrow}
            </a>
            <a href="#features" class="btn-ghost">
              How It Works
            </a>
          </div>
        </div>

        <div style="position:absolute; bottom:40px; right:24px; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-dim); letter-spacing:0.08em; text-align:right; line-height:1.8;">
          <div>lat 41.0082° N</div>
          <div>lon 28.9784° E</div>
          <div style="color:var(--accent); opacity:0.4;">fiyuu.work</div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- FILE STRUCTURE VISUAL -->
      <!-- ════════════════════════════════════════════ -->
      <section style="max-width:1200px; margin:0 auto; padding:0 24px 100px;">
        <div class="bp-border" style="background:var(--bg-elevated); padding:32px; border-radius:2px;">
          <div class="section-label">File Structure</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1px; background:var(--border-subtle); border:1px solid var(--border-subtle); border-radius:2px; overflow:hidden;">
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--text-muted); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">Route</div>
              <div style="color:var(--text);">app/</div>
              <div style="color:var(--text-muted); padding-left:16px;">[slug]/</div>
            </div>
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--accent); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">View</div>
              <div style="color:var(--text);">page.tsx</div>
              <div style="color:var(--text-muted); font-size:10px; margin-top:4px;">User interface</div>
            </div>
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--accent); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">Data</div>
              <div style="color:var(--text);">query.ts</div>
              <div style="color:var(--text-muted); font-size:10px; margin-top:4px;">Server queries</div>
            </div>
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--accent); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">Action</div>
              <div style="color:var(--text);">action.ts</div>
              <div style="color:var(--text-muted); font-size:10px; margin-top:4px;">Server mutations</div>
            </div>
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--accent); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">Contract</div>
              <div style="color:var(--text);">schema.ts</div>
              <div style="color:var(--text-muted); font-size:10px; margin-top:4px;">Zod types</div>
            </div>
            <div style="background:var(--bg-elevated); padding:20px; font-family:'JetBrains Mono',monospace; font-size:12px;">
              <div style="color:var(--accent); font-size:10px; margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase;">Meta</div>
              <div style="color:var(--text);">meta.ts</div>
              <div style="color:var(--text-muted); font-size:10px; margin-top:4px;">SEO, render mode</div>
            </div>
          </div>
          <div style="margin-top:16px; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-dim); letter-spacing:0.04em;">
            Every route follows the same structure. Predictable. Readable. Understandable by AI.
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- FEATURES -->
      <!-- ════════════════════════════════════════════ -->
      <section id="features" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
        <div class="section-label reveal">Features</div>
        <h2 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 44px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:12px;">
          Everything you need,<br /><span style="color:var(--accent);">nothing you don't.</span>
        </h2>
        <p class="reveal d2" style="color:var(--text-secondary); font-size:15px; max-width:480px; margin-bottom:56px; line-height:1.7;">
          Built-in database, real-time communication, AI context, type-safe contracts — all in a single framework.
        </p>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1px; background:var(--border-subtle); border:1px solid var(--border-subtle); border-radius:2px; overflow:hidden;">
          ${raw(features.map((f, i) => `
            <div class="bp-card" style="padding:28px; background:var(--bg-elevated);">
              <div class="feat-icon" style="margin-bottom:20px;">
                ${f.icon}
              </div>
              <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:8px; letter-spacing:0.01em;">${f.title}</h3>
              <p style="font-size:13px; line-height:1.65; color:var(--text-secondary);">${f.desc}</p>
            </div>
          `).join(""))}
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- CODE EXAMPLE -->
      <!-- ════════════════════════════════════════════ -->
      <section id="contracts" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
        <div style="display:grid; grid-template-columns:1fr; gap:48px; lg:grid-template-columns:1fr 1fr;">
          <div>
            <div class="section-label reveal">Developer Experience</div>
            <h2 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:16px;">
              Define once,<br /><span style="color:var(--accent);">use everywhere.</span>
            </h2>
            <p class="reveal d2" style="color:var(--text-secondary); font-size:15px; line-height:1.7; margin-bottom:32px;">
              Write your Zod schema once. Input validation, output typing, AI documentation — all automatic. Zero manual type duplication.
            </p>
            <div class="reveal d3" style="display:flex; flex-direction:column; gap:16px;">
              <div style="display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--text-secondary);">
                <span style="color:var(--accent); margin-top:2px;">${iconCheck}</span>
                <span>Type-safe input/output contracts</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--text-secondary);">
                <span style="color:var(--accent); margin-top:2px;">${iconCheck}</span>
                <span>Automatic AI documentation generation</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--text-secondary);">
                <span style="color:var(--accent); margin-top:2px;">${iconCheck}</span>
                <span>Zero manual type duplication</span>
              </div>
              <div style="display:flex; align-items:flex-start; gap:12px; font-size:13px; color:var(--text-secondary);">
                <span style="color:var(--accent); margin-top:2px;">${iconCheck}</span>
                <span>Runtime validation — no errors, no surprises</span>
              </div>
            </div>
          </div>

          <div class="reveal d3">
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/users/schema.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { defineQuery, z } <span class="kw">from</span> <span class="str">"@fiyuu/core"</span>;

<span class="kw">export const</span> <span class="fn">query</span> <span class="op">=</span> <span class="fn">defineQuery</span>({
  <span class="prop">input</span>: z.<span class="fn">object</span>({
    <span class="prop">page</span>: z.<span class="fn">number</span>().<span class="fn">default</span>(<span class="num">1</span>),
    <span class="prop">limit</span>: z.<span class="fn">number</span>().<span class="fn">max</span>(<span class="num">100</span>),
  }),
  <span class="prop">output</span>: z.<span class="fn">object</span>({
    <span class="prop">users</span>: z.<span class="fn">array</span>(z.<span class="fn">object</span>({
      <span class="prop">id</span>: z.<span class="fn">string</span>(),
      <span class="prop">name</span>: z.<span class="fn">string</span>(),
    })),
    <span class="prop">total</span>: z.<span class="fn">number</span>(),
  }),
  <span class="cm">// This description is auto-exported to AI docs</span>
  <span class="prop">description</span>: <span class="str">"Paginated user listing"</span>,
});</pre>
              </div>
            </div>

            <div class="code-frame" style="margin-top:12px;">
              <div class="code-frame-header">
                <span class="dot"></span>
                <span>app/users/page.tsx — types are automatic</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { query } <span class="kw">from</span> <span class="str">"./query.js"</span>;

<span class="cm">// ✅ Types inferred automatically:</span>
<span class="cm">// users: { id: string, name: string }[]</span>
<span class="cm">// total: number</span>
<span class="kw">type</span> <span class="tp">PageData</span> <span class="op">=</span> <span class="tp">InferQueryOutput</span><span class="op">&lt;</span><span class="kw">typeof</span> query<span class="op">&gt;</span>;

<span class="cm">// No more manual type writing.</span></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- HOW IT WORKS -->
      <!-- ════════════════════════════════════════════ -->
      <section style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
        <div class="section-label reveal">How It Works</div>
        <h2 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:56px;">
          Three steps, <span style="color:var(--accent);">zero ambiguity.</span>
        </h2>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1px; background:var(--border-subtle); border:1px solid var(--border-subtle); border-radius:2px; overflow:hidden;">
          <div class="bp-card corner-marks" style="padding:36px 32px; background:var(--bg-elevated);">
            <div style="color:var(--accent); margin-bottom:24px;">${iconFolder}</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); letter-spacing:0.1em; margin-bottom:12px;">STEP 01</div>
            <h3 style="font-size:18px; font-weight:600; color:var(--text); margin-bottom:12px;">File Contracts</h3>
            <p style="font-size:13px; line-height:1.7; color:var(--text-secondary);">
              page.tsx, query.ts, action.ts, schema.ts, meta.ts — every route has the same immutable contract. File structure declares intent.
            </p>
          </div>

          <div class="bp-card corner-marks" style="padding:36px 32px; background:var(--bg-elevated);">
            <div style="color:var(--accent); margin-bottom:24px;">${iconLayers}</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); letter-spacing:0.1em; margin-bottom:12px;">STEP 02</div>
            <h3 style="font-size:18px; font-weight:600; color:var(--text); margin-bottom:12px;">Graph Export</h3>
            <p style="font-size:13px; line-height:1.7; color:var(--text-secondary);">
              <code style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent);">fiyuu sync</code> → graph.json + AI docs. Your project structure becomes machine-readable.
            </p>
          </div>

          <div class="bp-card corner-marks" style="padding:36px 32px; background:var(--bg-elevated);">
            <div style="color:var(--accent); margin-bottom:24px;">${iconSend}</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); letter-spacing:0.1em; margin-bottom:12px;">STEP 03</div>
            <h3 style="font-size:18px; font-weight:600; color:var(--text); margin-bottom:12px;">Ship with AI</h3>
            <p style="font-size:13px; line-height:1.7; color:var(--text-secondary);">
              Copilot, Cursor, LLMs — they all work from the same trusted context. No guessing, no assumptions.
            </p>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- COMPARISON TABLE -->
      <!-- ════════════════════════════════════════════ -->
      <section id="compare" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
        <div class="section-label reveal">Comparison</div>
        <h2 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:48px;">
          Where Fiyuu <span style="color:var(--accent);">differs.</span>
        </h2>

        <div class="reveal d2" style="overflow-x:auto;">
          <table class="bp-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th style="color:var(--accent);">Fiyuu</th>
                <th>Next.js</th>
                <th>Astro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AI project graph</td>
                <td class="check">yes</td>
                <td class="cross">—</td>
                <td class="cross">—</td>
              </tr>
              <tr>
                <td>Deterministic contracts</td>
                <td class="check">yes</td>
                <td class="partial">partial</td>
                <td class="partial">partial</td>
              </tr>
              <tr>
                <td>AI docs export</td>
                <td class="check">yes</td>
                <td class="cross">—</td>
                <td class="cross">—</td>
              </tr>
              <tr>
                <td>Background services</td>
                <td class="check">yes</td>
                <td class="cross">—</td>
                <td class="cross">—</td>
              </tr>
              <tr>
                <td>Built-in database</td>
                <td class="check">yes</td>
                <td class="cross">—</td>
                <td class="cross">—</td>
              </tr>
              <tr>
                <td>Real-time channels</td>
                <td class="check">yes</td>
                <td class="partial">ext. pkg</td>
                <td class="partial">ext. pkg</td>
              </tr>
              <tr>
                <td>Ecosystem maturity</td>
                <td class="partial">early</td>
                <td class="check">mature</td>
                <td class="check">mature</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- GET STARTED -->
      <!-- ════════════════════════════════════════════ -->
      <section id="start" style="max-width:1200px; margin:0 auto; padding:80px 24px 100px;">
        <div class="bp-border" style="background:var(--bg-elevated); padding:48px 40px; border-radius:2px;">
          <div class="section-label reveal">Quick Start</div>
          <h2 class="reveal d1" style="font-family:'Bricolage Grotesque',sans-serif; font-size:clamp(28px, 4vw, 40px); font-weight:800; line-height:1.15; color:var(--text); margin-bottom:48px;">
            Up and running in <span style="color:var(--accent);">30 seconds.</span>
          </h2>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:32px;">
            <div class="reveal d2">
              <div class="step-num">01</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Create a project</h3>
              <div class="code-frame">
                <div class="code-frame-body" style="padding:16px;">
                  <pre style="font-size:13px; color:var(--accent);">npm create fiyuu-app@latest my-app</pre>
                </div>
              </div>
            </div>

            <div class="reveal d3">
              <div class="step-num">02</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Install dependencies</h3>
              <div class="code-frame">
                <div class="code-frame-body" style="padding:16px;">
                  <pre style="font-size:13px; color:var(--accent);">cd my-app && npm install</pre>
                </div>
              </div>
            </div>

            <div class="reveal d4">
              <div class="step-num">03</div>
              <h3 style="font-size:16px; font-weight:600; color:var(--text); margin:12px 0 16px;">Start developing</h3>
              <div class="code-frame">
                <div class="code-frame-body" style="padding:16px;">
                  <pre style="font-size:13px; color:var(--accent);">npm run dev</pre>
                </div>
              </div>
            </div>
          </div>

          <div class="reveal d5" style="margin-top:48px; text-align:center;">
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="btn-primary">
              Start Building
              ${iconArrow}
            </a>
          </div>
        </div>
      </section>

      <!-- ════════════════════════════════════════════ -->
      <!-- FOOTER -->
      <!-- ════════════════════════════════════════════ -->
      <footer style="border-top:1px solid var(--border-subtle); padding:40px 24px;">
        <div style="max-width:1200px; margin:0 auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:var(--text); letter-spacing:-0.03em;">fiyuu</span>
            <span style="font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--text-dim); letter-spacing:0.1em;">v0.4.1</span>
          </div>
          <p style="font-size:12px; color:var(--text-muted);">
            Built by Hacı Mert Gökhan — <a href="https://hacimertgokhan.com" target="_blank" rel="noreferrer" style="color:var(--text-secondary); text-decoration:none; border-bottom:1px solid var(--border); transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-secondary)'">hacimertgokhan.com</a>
          </p>
          <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" style="color:var(--text-muted); transition:color 0.2s; display:flex; align-items:center;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-muted)'">
            ${iconGithub}
          </a>
        </div>
      </footer>
    `;
  }
}
