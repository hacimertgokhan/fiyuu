import { Component } from "@geajs/core";
import { defineLayout, html, raw, type LayoutProps } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap");

        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer base {
          :root {
            --bg-primary: #0a0a0b;
            --bg-secondary: #111113;
            --bg-tertiary: #18181b;
            --bg-card: #1c1c1f;
            --border: #27272a;
            --border-hover: #3f3f46;
            --text-primary: #fafafa;
            --text-secondary: #a1a1aa;
            --text-muted: #71717a;
            --accent: #22c55e;
            --accent-soft: rgba(34, 197, 94, 0.1);
            --accent-hover: #4ade80;
            --gradient-start: #22c55e;
            --gradient-end: #3b82f6;
          }

          [data-theme="light"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f9fafb;
            --bg-tertiary: #f3f4f6;
            --bg-card: #ffffff;
            --border: #e4e4e7;
            --border-hover: #d4d4d8;
            --text-primary: #09090b;
            --text-secondary: #52525b;
            --text-muted: #71717a;
            --accent: #16a34a;
            --accent-soft: rgba(22, 163, 74, 0.08);
            --accent-hover: #15803d;
            --gradient-start: #16a34a;
            --gradient-end: #2563eb;
          }
        }

        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.6;
        }

        ::selection {
          background: var(--accent-soft);
          color: var(--accent);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--border-hover);
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow {
          box-shadow: 0 0 60px rgba(34, 197, 94, 0.15);
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-4px);
          border-color: var(--border-hover);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .code-block {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .code-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .code-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .code-dot.red { background: #ef4444; }
        .code-dot.yellow { background: #eab308; }
        .code-dot.green { background: #22c55e; }

        .code-body {
          padding: 20px;
          overflow-x: auto;
        }

        .code-body pre {
          margin: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        .code-body .keyword { color: #c084fc; }
        .code-body .string { color: #22c55e; }
        .code-body .function { color: #60a5fa; }
        .code-body .comment { color: #52525b; font-style: italic; }
        .code-body .type { color: #f59e0b; }
        .code-body .operator { color: #a1a1aa; }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: var(--text-primary);
          font-weight: 500;
          font-size: 14px;
          border-radius: 10px;
          text-decoration: none;
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-secondary:hover {
          border-color: var(--border-hover);
          background: var(--bg-secondary);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--accent-soft);
          color: var(--accent);
          margin-bottom: 16px;
        }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-delay-100 { animation-delay: 100ms; }
        .animate-delay-200 { animation-delay: 200ms; }
        .animate-delay-300 { animation-delay: 300ms; }
        .animate-delay-400 { animation-delay: 400ms; }

        @media (max-width: 768px) {
          .code-body pre {
            font-size: 11px;
          }
        }
      </style>

      <div class="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
        ${raw(children)}
      </div>

      <script type="module">
        (() => {
          const root = document.documentElement;
          const toggle = document.getElementById("theme-toggle");
          const storageKey = "fiyuu-theme";

          const applyTheme = (theme) => {
            if (theme === "light") {
              root.setAttribute("data-theme", "light");
            } else {
              root.removeAttribute("data-theme");
            }
          };

          const initial = localStorage.getItem(storageKey) === "light" ? "light" : "dark";
          applyTheme(initial);

          toggle?.addEventListener("click", () => {
            const isLight = root.getAttribute("data-theme") === "light";
            const next = isLight ? "dark" : "light";
            localStorage.setItem(storageKey, next);
            applyTheme(next);
          });
        })();
      </script>
    `;
  }
}
