import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Fiyuu framework ana tanitim sayfasi" });

export default class HomePage extends Component<PageProps> {
  template() {
    const iconBrain = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7Z"/><path stroke-linecap="round" d="M9 21h6M10 17v4M14 17v4"/></svg>`);
    const iconFile = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path stroke-linecap="round" d="M15 2v5h5M9 13h6M9 17h3"/></svg>`);
    const iconZap = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`);
    const iconDatabase = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path stroke-linecap="round" d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path stroke-linecap="round" d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`);
    const iconSignal = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2 20h.01M6 16v4M10 12v8M14 8v12M18 4v16M22 2v18"/></svg>`);
    const iconSearch = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m16 16 5 5"/></svg>`);
    const iconShield = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/></svg>`);
    const iconRocket = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`);
    const iconGithub = raw(`<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z"/></svg>`);
    const iconArrowRight = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>`);
    const iconCopy = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`);
    const iconCheck = raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`);

    const features = [
      { icon: iconBrain, title: "AI-Native Context", desc: "fiyuu sync ile proje grafını ve AI dokümanlarını otomatik oluştur. Copilot, Cursor ve LLM'ler kodunuzu anlasın." },
      { icon: iconFile, title: "Deterministic Contracts", desc: "Sabit dosya sözleşmeleri: page.tsx, query.ts, action.ts, schema.ts, meta.ts. Gizli davranış yok." },
      { icon: iconZap, title: "GEA-First Runtime", desc: "React-free framework katmanı. GEA component modeli ile temiz, okunabilir UI kodu." },
      { icon: iconDatabase, title: "Built-In Database", desc: "FiyuuDB ile SQL benzeri sorgular. Kurulum gerektirmez, her zaman hazir." },
      { icon: iconSignal, title: "Real-Time Channels", desc: "WebSocket ve NATS desteği. Chat, bildirim, canli güncelleme — hepsi framework içinde." },
      { icon: iconSearch, title: "Built-In Diagnostics", desc: "fiyuu doctor ile proje yapısını doğrula. Anti-pattern'leri otomatik tespit et." },
      { icon: iconShield, title: "Type-Safe Contracts", desc: "Zod ile input/output doğrulama. Schema bir kez tanımla, her yerde tip güvenliği." },
      { icon: iconRocket, title: "Background Services", desc: "Request-driven değil, always-alive. Arka plan işleri, cron job'lar, real-time sync." },
    ];

    const steps = [
      { num: "01", title: "Proje oluştur", cmd: "npm create fiyuu-app@latest my-app" },
      { num: "02", title: "Bağımlılıkları yükle", cmd: "cd my-app && npm install" },
      { num: "03", title: "Geliştirmeye başla", cmd: "npm run dev" },
    ];

    return html`
      <!-- Navigation -->
      <nav class="fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="/" class="flex items-center gap-2 text-lg font-bold">
            <span class="gradient-text text-xl font-black">fiyuu</span>
          </a>
          <div class="hidden items-center gap-6 md:flex">
            <a href="#features" class="nav-link">Features</a>
            <a href="#code" class="nav-link">Code</a>
            <a href="#comparison" class="nav-link">Compare</a>
            <a href="#start" class="nav-link">Get Started</a>
          </div>
          <div class="flex items-center gap-3">
            <button id="theme-toggle" class="rounded-lg border border-[color:var(--border)] p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]" aria-label="Temayı değiştir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
            </button>
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="rounded-lg border border-[color:var(--border)] p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
              ${iconGithub}
            </a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative mx-auto max-w-6xl px-5 pt-36 pb-24 md:pt-44 md:pb-32">
        <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,197,94,0.12),transparent)]"></div>
        <div class="mx-auto max-w-3xl text-center">
          <div class="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-secondary)] px-4 py-1.5 text-xs font-medium text-[color:var(--text-secondary)]">
            <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent)]"></span>
            v0.1.1 — AI-native fullstack framework
          </div>
          <h1 class="animate-fade-in-up animate-delay-100 mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Ship faster with<br /><span class="gradient-text">AI-native structure</span>
          </h1>
          <p class="animate-fade-in-up animate-delay-200 mx-auto mt-6 max-w-xl text-base leading-7 text-[color:var(--text-secondary)] md:text-lg">
            Deterministic project contracts. Machine-readable artifacts. Built for teams that ship with AI — not against it.
          </p>
          <div class="animate-fade-in-up animate-delay-300 mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#start" class="btn-primary">
              Get Started
              ${iconArrowRight}
            </a>
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="btn-secondary">
              ${iconGithub}
              GitHub
            </a>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section id="features" class="mx-auto max-w-6xl px-5 py-20">
        <div class="text-center">
          <div class="section-label">Features</div>
          <h2 class="text-3xl font-bold md:text-4xl">Everything you need,<br /><span class="gradient-text">nothing you don't</span></h2>
          <p class="mx-auto mt-4 max-w-lg text-[color:var(--text-secondary)]">Built-in database, realtime, AI context, type-safe contracts — all in one framework.</p>
        </div>
        <div class="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          ${raw(features.map((f, i) => `
            <div class="card-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-6">
              <div class="feature-icon">${f.icon.value}</div>
              <h3 class="text-base font-semibold">${f.title}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[color:var(--text-secondary)]">${f.desc}</p>
            </div>
          `).join(""))}
        </div>
      </section>

      <!-- Code Example -->
      <section id="code" class="mx-auto max-w-6xl px-5 py-20">
        <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div class="section-label">Developer Experience</div>
            <h2 class="text-3xl font-bold md:text-4xl">Define once,<br /><span class="gradient-text">use everywhere</span></h2>
            <p class="mt-4 text-[color:var(--text-secondary)] leading-relaxed">
              Zod schema'nızı bir kez tanımlayın. Input validation, output typing, AI docs — hepsi otomatik. Manuel type tekrarı yok.
            </p>
            <ul class="mt-6 space-y-3">
              <li class="flex items-start gap-3 text-sm text-[color:var(--text-secondary)]">
                <span class="mt-0.5 text-[color:var(--accent)]">${iconCheck}</span>
                Type-safe input/output contracts
              </li>
              <li class="flex items-start gap-3 text-sm text-[color:var(--text-secondary)]">
                <span class="mt-0.5 text-[color:var(--accent)]">${iconCheck}</span>
                Automatic AI documentation generation
              </li>
              <li class="flex items-start gap-3 text-sm text-[color:var(--text-secondary)]">
                <span class="mt-0.5 text-[color:var(--accent)]">${iconCheck}</span>
                Zero manual type duplication
              </li>
            </ul>
          </div>
          <div class="code-block glow">
            <div class="code-header">
              <span class="code-dot red"></span>
              <span class="code-dot yellow"></span>
              <span class="code-dot green"></span>
              <span class="ml-2 text-xs text-[color:var(--text-muted)]">app/users/schema.ts</span>
            </div>
            <div class="code-body">
              <pre><span class="keyword">import</span> { defineQuery, z } <span class="keyword">from</span> <span class="string">"@fiyuu/core"</span>;

<span class="keyword">export const</span> <span class="function">query</span> <span class="operator">=</span> <span class="function">defineQuery</span>({
  <span class="type">input</span>: z.<span class="function">object</span>({
    page: z.<span class="function">number</span>().<span class="function">default</span>(<span class="string">1</span>),
    limit: z.<span class="function">number</span>().<span class="function">max</span>(<span class="string">100</span>),
  }),
  <span class="type">output</span>: z.<span class="function">object</span>({
    users: z.<span class="function">array</span>(z.<span class="function">object</span>({
      id: z.<span class="function">string</span>(),
      name: z.<span class="function">string</span>(),
    })),
    total: z.<span class="function">number</span>(),
  }),
  <span class="type">description</span>: <span class="string">"List users with pagination"</span>,
});</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Architecture Diagram -->
      <section class="mx-auto max-w-6xl px-5 py-20">
        <div class="text-center">
          <div class="section-label">Architecture</div>
          <h2 class="text-3xl font-bold md:text-4xl">How it <span class="gradient-text">works</span></h2>
        </div>
        <div class="mt-12 grid gap-4 md:grid-cols-3">
          <div class="card-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-7 w-7"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"/></svg>
            </div>
            <h3 class="text-lg font-semibold">1. File Contracts</h3>
            <p class="mt-2 text-sm text-[color:var(--text-secondary)]">page.tsx, query.ts, action.ts, schema.ts, meta.ts — her route'un sabit sözleşmesi.</p>
          </div>
          <div class="card-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-7 w-7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h3 class="text-lg font-semibold">2. Graph Export</h3>
            <p class="mt-2 text-sm text-[color:var(--text-secondary)]">fiyuu sync → graph.json + AI docs. Proje yapısı makine tarafından okunabilir.</p>
          </div>
          <div class="card-hover rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-6 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-7 w-7"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7Z"/></svg>
            </div>
            <h3 class="text-lg font-semibold">3. Ship with AI</h3>
            <p class="mt-2 text-sm text-[color:var(--text-secondary)]">Copilot, Cursor, LLM'ler — hepsi aynı güvenilir bağlamdan çalışır.</p>
          </div>
        </div>
      </section>

      <!-- Comparison Table -->
      <section id="comparison" class="mx-auto max-w-6xl px-5 py-20">
        <div class="text-center">
          <div class="section-label">Comparison</div>
          <h2 class="text-3xl font-bold md:text-4xl">How Fiyuu <span class="gradient-text">compares</span></h2>
        </div>
        <div class="mt-12 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[color:var(--border)]">
                <th class="pb-4 text-left font-medium text-[color:var(--text-muted)]">Feature</th>
                <th class="pb-4 text-center font-semibold text-[color:var(--accent)]">Fiyuu</th>
                <th class="pb-4 text-center font-medium text-[color:var(--text-secondary)]">Next.js</th>
                <th class="pb-4 text-center font-medium text-[color:var(--text-secondary)]">Astro</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">AI project graph</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
              </tr>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">Deterministic contracts</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">~</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">~</td>
              </tr>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">AI docs export</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
              </tr>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">Background services</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
              </tr>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">Built-in DB</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">✗</td>
              </tr>
              <tr class="border-b border-[color:var(--border)]/50">
                <td class="py-3 text-[color:var(--text-secondary)]">Real-time channels</td>
                <td class="py-3 text-center text-[color:var(--accent)]">✓</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">External</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">External</td>
              </tr>
              <tr>
                <td class="py-3 text-[color:var(--text-secondary)]">Ecosystem maturity</td>
                <td class="py-3 text-center text-[color:var(--text-muted)]">Early</td>
                <td class="py-3 text-center text-[color:var(--accent)]">Mature</td>
                <td class="py-3 text-center text-[color:var(--accent)]">Mature</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Get Started -->
      <section id="start" class="mx-auto max-w-6xl px-5 py-20">
        <div class="rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-card)] p-8 md:p-12">
          <div class="text-center">
            <div class="section-label">Get Started</div>
            <h2 class="text-3xl font-bold md:text-4xl">Up and running in <span class="gradient-text">30 seconds</span></h2>
          </div>
          <div class="mt-10 grid gap-4 md:grid-cols-3">
            ${raw(steps.map((s) => `
              <div class="relative">
                <div class="mb-3 text-xs font-mono font-semibold text-[color:var(--accent)]">${s.num}</div>
                <h3 class="text-base font-semibold">${s.title}</h3>
                <div class="code-block mt-3">
                  <div class="code-body py-3 px-4">
                    <pre class="text-xs">${s.cmd}</pre>
                  </div>
                </div>
              </div>
            `).join(""))}
          </div>
          <div class="mt-10 text-center">
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="btn-primary text-base">
              Start Building
              ${iconArrowRight}
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-[color:var(--border)] py-10">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:flex-row">
          <div class="flex items-center gap-2">
            <span class="gradient-text text-lg font-black">fiyuu</span>
            <span class="text-xs text-[color:var(--text-muted)]">v0.1.1</span>
          </div>
          <p class="text-sm text-[color:var(--text-muted)]">
            Built with ❤️ by <a href="https://hacimertgokhan.me" target="_blank" rel="noreferrer" class="text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]">Hacı Mert Gökhan</a>
          </p>
          <div class="flex items-center gap-4">
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">
              ${iconGithub}
            </a>
          </div>
        </div>
      </footer>
    `;
  }
}
