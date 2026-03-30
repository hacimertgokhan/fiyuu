import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap");

        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer base {
          :root {
            --font-merriweather: "Merriweather", serif;

            --bg-primary: #FFFFFF;
            --bg-secondary: #F3F4F6;
            --border: #E5E7EB;
            --text-primary: #111827;
            --text-secondary: #4B5563;
            --text-muted: #9CA3AF;
            --accent: #ca6242;
            --accent-hover: #d97757;
          }

          [data-theme="dark"] {
            --bg-primary: #0F0F10;
            --bg-secondary: #1A1A1D;
            --border: #2A2A2E;
            --text-primary: #EAEAEA;
            --text-secondary: #A1A1AA;
            --text-muted: #6B7280;
            --accent: #D97757;
            --accent-hover: #E38B6A;
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
          font-family: var(--font-merriweather), serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }

        ::selection {
          background: rgba(217, 119, 87, 0.3);
          color: var(--text-primary);
        }

        .prose {
          color: var(--text-primary);
          max-width: none;
        }

        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          color: var(--text-primary);
          font-family: var(--font-merriweather), serif;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .prose p {
          color: var(--text-secondary);
          line-height: 1.8;
          margin-bottom: 1rem;
        }

        .prose a {
          color: var(--accent);
          text-decoration: none;
        }

        .prose a:hover {
          color: var(--accent-hover);
        }

        .prose code {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.875em;
        }

        .prose pre {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
        }

        .prose blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 1rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .prose ul,
        .prose ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
          color: var(--text-secondary);
        }

        .prose li {
          margin-bottom: 0.25rem;
          line-height: 1.8;
        }

        a,
        button {
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-in-out;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-in-out;
        }

        .floating-nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          left: calc(50% - 32rem - 4.8rem);
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .float-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 9999px;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          background: color-mix(in srgb, var(--bg-primary) 76%, var(--bg-secondary) 24%);
          transition: all 0.2s ease;
        }

        .float-item[data-active="true"] {
          width: 2.85rem;
          background: var(--accent);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 8px 22px rgba(217, 119, 87, 0.35);
          transform: translateX(4px);
        }

        .experience-card {
          position: relative;
          box-shadow: 0 10px 30px color-mix(in srgb, var(--bg-primary) 70%, #000 30% / 10%);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .experience-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px color-mix(in srgb, var(--bg-primary) 62%, #000 38% / 14%);
        }

        .experience-company {
          color: var(--text-secondary);
          letter-spacing: 0.01em;
        }

        .experience-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          padding: 0.3rem 0.62rem;
          background: color-mix(in srgb, var(--bg-primary) 84%, var(--bg-secondary) 16%);
          color: var(--text-secondary);
          font-size: 0.75rem;
          line-height: 1;
        }

        .experience-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.42rem;
        }

        .experience-zigzag {
          position: relative;
          display: grid;
          gap: 0.95rem;
        }

        .experience-zigzag::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0.6rem;
          bottom: 0.6rem;
          width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent) 22%, var(--border) 78%), transparent);
        }

        .experience-row {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 2.2rem minmax(0, 1fr);
          gap: 0.15rem;
          align-items: center;
        }

        .experience-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 0.72rem;
          height: 0.72rem;
          border-radius: 9999px;
          background: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--bg-primary) 82%, var(--accent) 18%);
          pointer-events: none;
        }

        .experience-row.is-left .experience-text {
          grid-column: 1;
          justify-self: end;
          width: min(100%, 24rem);
          text-align: right;
        }

        .experience-row.is-right .experience-text {
          grid-column: 3;
          justify-self: start;
          width: min(100%, 24rem);
          text-align: left;
        }

        .experience-row.is-left .experience-stack {
          justify-content: flex-end;
        }

        .experience-row.is-right .experience-stack {
          justify-content: flex-start;
        }

        @media (max-width: 767px) {
          .experience-zigzag::before {
            left: 0.35rem;
            transform: none;
          }

          .experience-row {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.7rem;
            justify-content: stretch;
          }

          .experience-dot {
            left: 0.35rem;
          }

          .experience-text,
          .experience-row.is-right .experience-text {
            grid-column: 2;
            width: 100%;
            justify-self: stretch;
          }
        }

        .project-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(165deg, color-mix(in srgb, var(--bg-secondary) 78%, var(--bg-primary) 22%), var(--bg-primary));
          box-shadow: 0 14px 36px color-mix(in srgb, var(--bg-primary) 65%, #000 35% / 12%);
          transition: transform 0.24s ease, box-shadow 0.24s ease;
        }

        .project-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 55%, transparent));
          opacity: 0.95;
        }

        .project-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 42px color-mix(in srgb, var(--bg-primary) 58%, #000 42% / 16%);
        }

        .project-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .projects-stage {
          height: 34rem;
          overflow-y: auto;
          padding-right: 0.2rem;
        }

        .project-tab {
          border: 1px solid var(--border);
          border-radius: 9999px;
          padding: 0.42rem 0.9rem;
          background: color-mix(in srgb, var(--bg-primary) 90%, var(--bg-secondary) 10%);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .project-tab[data-active="true"] {
          border-color: transparent;
          background: var(--accent);
          color: #fff;
          box-shadow: 0 8px 20px rgba(217, 119, 87, 0.35);
        }

        @media (max-width: 1279px) {
          .floating-nav {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .projects-stage {
            height: 28rem;
          }
        }
      </style>

      <div class="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
        ${children}
      </div>

      <script type="module">
        (() => {
          const root = document.documentElement;
          const toggle = document.getElementById("theme-toggle");
          const label = document.getElementById("theme-label");
          const storageKey = "portfolio-theme";

          const applyTheme = (theme) => {
            if (theme === "dark") {
              root.setAttribute("data-theme", "dark");
              if (label) label.textContent = "Light";
              return;
            }

            root.removeAttribute("data-theme");
            if (label) label.textContent = "Dark";
          };

          const initial = localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
          applyTheme(initial);

          toggle?.addEventListener("click", () => {
            const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const next = current === "dark" ? "light" : "dark";
            localStorage.setItem(storageKey, next);
            applyTheme(next);
          });
        })();
      </script>
    `;
  }
}
