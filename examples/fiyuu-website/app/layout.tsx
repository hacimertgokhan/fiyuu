import { Component } from "@geajs/core";
import { defineLayout, html, raw, type LayoutProps } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap");

        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer base {
          :root {
            --bg: #09090b;
            --bg-elevated: #111114;
            --bg-surface: #18181c;
            --bg-subtle: #1e1e22;
            --border: #27272a;
            --border-subtle: #1a1a1e;
            --border-hover: #3a3a40;
            --text: #fafafa;
            --text-secondary: #9ca3af;
            --text-muted: #52525b;
            --text-dim: #3f3f46;
            --accent: #f59e0b;
            --accent-soft: rgba(245, 158, 11, 0.08);
            --accent-mid: rgba(245, 158, 11, 0.15);
            --accent-bright: #fbbf24;
            --accent-glow: rgba(245, 158, 11, 0.25);
            --grid-line: rgba(255, 255, 255, 0.025);
            --grid-line-strong: rgba(255, 255, 255, 0.04);
            --noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          }
        }

        * { box-sizing: border-box; padding: 0; margin: 0; }

        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
          overflow-x: hidden;
        }

        ::selection {
          background: var(--accent-mid);
          color: var(--accent-bright);
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

        /* ── Grid Background ── */
        .grid-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px),
            linear-gradient(var(--grid-line-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-strong) 1px, transparent 1px);
          background-size:
            20px 20px,
            20px 20px,
            100px 100px,
            100px 100px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 70%);
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.4;
          background-image: var(--noise);
          background-repeat: repeat;
        }

        /* ── Typography ── */
        .font-display {
          font-family: 'Bricolage Grotesque', sans-serif;
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Crosshair ── */
        .crosshair {
          position: relative;
        }
        .crosshair::before,
        .crosshair::after {
          content: '';
          position: absolute;
          background: var(--accent);
          opacity: 0.3;
        }
        .crosshair::before {
          width: 8px;
          height: 1px;
          top: 50%;
          left: -12px;
        }
        .crosshair::after {
          width: 1px;
          height: 8px;
          left: 50%;
          top: -12px;
        }

        /* ── Section Label ── */
        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 24px;
        }
        .section-label::before {
          content: '';
          display: block;
          width: 16px;
          height: 1px;
          background: var(--accent);
        }

        /* ── Blueprint Border ── */
        .bp-border {
          border: 1px solid var(--border);
          position: relative;
        }
        .bp-border::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 16px;
          width: 24px;
          height: 1px;
          background: var(--accent);
        }

        /* ── Cards ── */
        .bp-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 2px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .bp-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-soft), transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .bp-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-surface);
          transform: translateY(-2px);
        }
        .bp-card:hover::after {
          opacity: 1;
        }

        /* ── Code Block ── */
        .code-frame {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 2px;
          overflow: hidden;
        }
        .code-frame-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-subtle);
        }
        .code-frame-header .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid var(--border);
        }
        .code-frame-header .dot.amber {
          background: var(--accent);
          border-color: var(--accent);
        }
        .code-frame-body {
          padding: 20px;
          overflow-x: auto;
        }
        .code-frame-body pre {
          margin: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          line-height: 1.75;
          color: var(--text-secondary);
        }
        .code-frame-body .kw { color: #c084fc; font-weight: 500; }
        .code-frame-body .str { color: #f59e0b; }
        .code-frame-body .fn { color: #60a5fa; }
        .code-frame-body .cm { color: #3f3f46; font-style: italic; }
        .code-frame-body .tp { color: #34d399; }
        .code-frame-body .op { color: #52525b; }
        .code-frame-body .num { color: #f472b6; }
        .code-frame-body .prop { color: #94a3b8; }

        /* ── Buttons ── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: var(--accent);
          color: #09090b;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          border-radius: 2px;
          text-decoration: none;
          transition: all 0.25s ease;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover {
          background: var(--accent-bright);
          transform: translateY(-1px);
          box-shadow: 0 8px 32px var(--accent-glow);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: transparent;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          font-weight: 400;
          font-size: 12px;
          border-radius: 2px;
          text-decoration: none;
          border: 1px solid var(--border);
          transition: all 0.25s ease;
          cursor: pointer;
          letter-spacing: 0.04em;
        }
        .btn-ghost:hover {
          border-color: var(--border-hover);
          color: var(--text);
          background: var(--bg-subtle);
        }

        /* ── Nav Link ── */
        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s ease;
          letter-spacing: 0.01em;
        }
        .nav-link:hover {
          color: var(--text);
        }

        /* ── Table ── */
        .bp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .bp-table thead th {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 20px 16px 0;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .bp-table thead th:first-child { padding-left: 0; }
        .bp-table thead th:not(:first-child) { text-align: center; }
        .bp-table tbody td {
          padding: 14px 20px 14px 0;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        .bp-table tbody td:first-child {
          padding-left: 0;
          color: var(--text);
          font-weight: 500;
        }
        .bp-table tbody td:not(:first-child) { text-align: center; }
        .bp-table tbody tr:last-child td { border-bottom: none; }
        .bp-table .check { color: var(--accent); font-weight: 600; }
        .bp-table .cross { color: var(--text-dim); }
        .bp-table .partial { color: var(--text-muted); }

        /* ── Step Number ── */
        .step-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 32px;
          font-weight: 700;
          color: var(--accent-soft);
          line-height: 1;
          -webkit-text-stroke: 1px var(--accent);
          opacity: 0.3;
        }

        /* ── Animations ── */
        @keyframes reveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal {
          animation: reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .d1 { animation-delay: 80ms; }
        .d2 { animation-delay: 160ms; }
        .d3 { animation-delay: 240ms; }
        .d4 { animation-delay: 320ms; }
        .d5 { animation-delay: 400ms; }
        .d6 { animation-delay: 480ms; }

        @keyframes pulse-line {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .pulse-line {
          animation: pulse-line 3s ease-in-out infinite;
        }

        /* ── Feature Icon ── */
        .feat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 2px;
          color: var(--accent);
          background: var(--accent-soft);
          flex-shrink: 0;
        }

        /* ── Corner Marks ── */
        .corner-marks {
          position: relative;
        }
        .corner-marks::before,
        .corner-marks::after {
          content: '+';
          position: absolute;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          line-height: 1;
        }
        .corner-marks::before { top: -14px; left: -2px; }
        .corner-marks::after { bottom: -14px; right: -2px; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .code-frame-body pre { font-size: 10.5px; }
          .step-num { font-size: 24px; }
        }
      </style>

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
            <a href="/" class="nav-link">Home</a>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noreferrer" class="btn-ghost" style="padding:8px 14px; font-size:11px;">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <style>
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
        }
      </style>

      <div class="relative min-h-screen">
        <div class="grid-bg"></div>
        <div class="noise-overlay"></div>
        <div class="relative z-10" style="padding-top:56px;">
          ${raw(children)}
        </div>
      </div>

      <!-- Footer -->
      <footer style="border-top:1px solid var(--border-subtle); background:var(--bg-elevated); padding:80px 24px;">
        <div style="max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:60px; margin-bottom:60px;">
          <div>
            <div style="font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:var(--text); margin-bottom:16px;">fiyuu</div>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.8;">The framework AI can actually read. Deterministic contracts. Machine-readable. Built for teams that ship with AI.</p>
          </div>
          <div>
            <h4 style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.1em;">Docs</h4>
            <ul style="list-style:none; padding:0;">
              <li><a href="/docs" class="nav-link" style="display:block; margin-bottom:12px;">Documentation</a></li>
              <li><a href="/architecture" class="nav-link" style="display:block; margin-bottom:12px;">Architecture</a></li>
              <li><a href="/structure" class="nav-link" style="display:block; margin-bottom:12px;">Structure</a></li>
            </ul>
          </div>
          <div>
            <h4 style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.1em;">Community</h4>
            <ul style="list-style:none; padding:0;">
              <li><a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" class="nav-link" style="display:block; margin-bottom:12px;">GitHub</a></li>
              <li><a href="https://github.com/hacimertgokhan/fiyuu/issues" target="_blank" class="nav-link" style="display:block; margin-bottom:12px;">Issues</a></li>
              <li><a href="https://github.com/hacimertgokhan/fiyuu/discussions" target="_blank" class="nav-link" style="display:block;">Discussions</a></li>
            </ul>
          </div>
        </div>
        <div style="border-top:1px solid var(--border-subtle); padding-top:40px; text-align:center; color:var(--text-muted); font-size:12px;">
          <p style="margin:0;">© 2026 Fiyuu. Built with ❤️ for AI-native development.</p>
        </div>
      </footer>
    `;
  }
}
