import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps, responsiveWrapperScript } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap");

        :root {
          --font-sans: "Inter", system-ui, -apple-system, sans-serif;
          --font-serif: "Merriweather", Georgia, serif;

          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --border: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --accent: #2563eb;
          --accent-hover: #1d4ed8;
          --accent-light: #dbeafe;
          --success: #16a34a;
          --danger: #dc2626;

          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.07);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.1);
          --radius: 12px;
          --radius-sm: 8px;
          --radius-xs: 6px;
        }

        [data-theme="dark"] {
          --bg-primary: #0b1120;
          --bg-secondary: #111827;
          --bg-tertiary: #1e293b;
          --border: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --accent: #3b82f6;
          --accent-hover: #60a5fa;
          --accent-light: #1e3a5f;

          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.6;
        }

        ::selection {
          background: rgba(37, 99, 235, 0.2);
          color: var(--text-primary);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-secondary); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

        a, button, input, textarea { transition: all 0.15s ease; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .animate-fade-in { animation: fadeIn 0.35s ease-out; }
        .animate-slide-up { animation: slideUp 0.35s ease-out both; }
      </style>

      <div id="app" class="min-h-screen flex flex-col">
        ${children}
      </div>

      ${responsiveWrapperScript()}

      <script>
        (function() {
          var saved = localStorage.getItem("fiyuu-theme");
          var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          var theme = saved || (prefersDark ? "dark" : "light");
          document.documentElement.setAttribute("data-theme", theme);

          document.addEventListener("DOMContentLoaded", function() {
            var toggle = document.getElementById("theme-toggle");
            if (toggle) {
              toggle.addEventListener("click", function() {
                var current = document.documentElement.getAttribute("data-theme");
                var next = current === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem("fiyuu-theme", next);
              });
            }
          });
        })();
      </script>
    `;
  }
}
