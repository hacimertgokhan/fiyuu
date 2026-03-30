import { Component } from "@geajs/core";
import { defineLayout, html, responsiveWrapperScript } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component {
  template() {
    var children = (this.props && this.props.children) || "";
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        :root {
          --font-serif: "Merriweather", Georgia, serif;
          --font-sans: "Inter", system-ui, sans-serif;
          --bg-primary: #FFFFFF;
          --bg-secondary: #F3F4F6;
          --bg-tertiary: #E5E7EB;
          --border: #E5E7EB;
          --text-primary: #111827;
          --text-secondary: #4B5563;
          --text-muted: #9CA3AF;
          --accent: #ca6242;
          --accent-hover: #d97757;
          --accent-light: rgba(202,98,66,0.08);
          --nav-bg: rgba(255, 255, 255, 0.95);
        }

        html[data-theme="dark"],
        html.dark {
          --bg-primary: #0F0F10;
          --bg-secondary: #1A1A1D;
          --bg-tertiary: #2A2A2E;
          --border: #2A2A2E;
          --text-primary: #EAEAEA;
          --text-secondary: #A1A1AA;
          --text-muted: #6B7280;
          --accent: #D97757;
          --accent-hover: #E38B6A;
          --accent-light: rgba(217,119,87,0.12);
          --nav-bg: rgba(15, 17, 32, 0.95);
        }

        * { box-sizing: border-box; padding: 0; margin: 0; }
        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-serif);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::selection { background: rgba(202,98,66,0.25); color: var(--text-primary); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-secondary); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

        a, button, input, textarea { transition: all 0.2s ease; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 0.35s ease-out; }
        .anim-up { animation: slideUp 0.4s ease-out both; }

        .onepage-nav {
          background: var(--nav-bg);
        }
      </style>

      ${children}

      ${responsiveWrapperScript()}

      <script>
        (function() {
          // Tema başlatma — DOMContentLoaded beklemeden hemen çalış
          (function initTheme() {
            try {
              var saved = localStorage.getItem("fiyuu-theme");
              var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              var theme = saved || (prefersDark ? "dark" : "light");
              document.documentElement.setAttribute("data-theme", theme);
              if (theme === "dark") document.documentElement.classList.add("dark");
            } catch(e) {}
          })();

          document.addEventListener("DOMContentLoaded", function() {
            document.querySelectorAll("[data-theme-toggle]").forEach(function(btn) {
              btn.addEventListener("click", function() {
                if (window.fiyuu && window.fiyuu.theme) {
                  window.fiyuu.theme.toggle();
                } else {
                  var cur = document.documentElement.getAttribute("data-theme");
                  var next = cur === "dark" ? "light" : "dark";
                  document.documentElement.setAttribute("data-theme", next);
                  document.documentElement.classList.toggle("dark", next === "dark");
                  try { localStorage.setItem("fiyuu-theme", next); } catch(e) {}
                }
              });
            });

            document.querySelectorAll('a[href^="#"]').forEach(function(a) {
              a.addEventListener("click", function(e) {
                e.preventDefault();
                var t = document.querySelector(this.getAttribute("href"));
                if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });

            var obs = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) { entry.target.classList.add("anim-visible"); obs.unobserve(entry.target); }
              });
            }, { threshold: 0.1 });
            document.querySelectorAll("[data-observe]").forEach(function(el) { obs.observe(el); });
          });
        })();
      </script>
    `;
  }
}
