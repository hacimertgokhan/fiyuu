import { defineLayout, html, raw } from "@fiyuu/core";

export default defineLayout({
  name: "root",

  wrapper: ({ head, body }) => html`
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap");

      :root {
        --font-sans: "Merriweather", Georgia, serif;
        --font-display: "Merriweather", Georgia, serif;
        --bg-primary: #0a0a0b;
        --bg-secondary: #131316;
        --bg-elevated: #1a1a1e;
        --border: #27272a;
        --border-subtle: #1f1f23;
        --text-primary: #f4f4f5;
        --text-secondary: #a1a1aa;
        --text-muted: #71717a;
        --accent: #e07a5f;
        --accent-soft: rgba(224,122,95,0.15);
        --accent-glow: rgba(224,122,95,0.4);
      }

      * { box-sizing: border-box; padding: 0; margin: 0; }
      html { scroll-behavior: smooth; }
      html body {
        background: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        font-family: var(--font-sans) !important;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        line-height: 1.7;
      }
      ::selection { background: rgba(224,122,95,0.25); }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: var(--bg-primary); }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

      .section-container { max-width: 64rem; margin: 0 auto; padding: 0 1.25rem; }
      @media (min-width: 640px) { .section-container { padding: 0 2rem; } }

      #hero { padding-top: clamp(2rem, 5vw, 4.5rem); padding-bottom: clamp(1.5rem, 3vw, 2.75rem); }
      #about, #experience, #projects { padding-top: clamp(1.75rem, 3.5vw, 3.25rem); padding-bottom: clamp(1.75rem, 3.5vw, 3.25rem); }

      .section-title {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.9rem;
      }

      h1, h2, h3 {
        font-family: var(--font-display);
        letter-spacing: -0.025em;
      }

      .card {
        border-radius: 1rem;
        border: 1px solid var(--border);
        padding: 1.25rem;
        background: var(--bg-secondary);
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      @media (min-width: 640px) { .card { padding: 1.5rem; } }
      .card:hover { transform: translateY(-2px); border-color: var(--accent); }

      .accent-border-top { position: relative; }
      .accent-border-top::before {
        content: "";
        position: absolute;
        left: 0; top: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--accent), transparent);
        opacity: 0.8;
      }

      .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 0.75rem;
        border: 1px solid var(--border);
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: var(--bg-elevated);
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .btn-icon:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-soft);
      }

      .chip {
        display: inline-flex;
        align-items: center;
        border-radius: 9999px;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--bg-elevated);
        color: var(--text-secondary);
        border: 1px solid var(--border-subtle);
      }

      .chip-accent {
        display: inline-flex;
        align-items: center;
        border-radius: 9999px;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--accent-soft);
        color: var(--accent);
        border: 1px solid rgba(224,122,95,0.2);
      }

      .stat-item {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        border-radius: 0.75rem;
        padding: 0.625rem 1rem;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
      }

      .text-gradient {
        background: linear-gradient(135deg, var(--accent) 0%, #f4a261 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .link-hover { color: var(--accent); text-decoration: none; transition: opacity 0.2s; }
      .link-hover:hover { opacity: 0.8; }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }

      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
      .animate-slide-in-left { animation: slideInLeft 0.4s ease-out forwards; }

      .floating-nav {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        left: calc(50% - 32rem - 5rem);
        z-index: 40;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .float-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 9999px;
        border: 1px solid var(--border);
        color: var(--text-muted);
        background: var(--bg-elevated);
        transition: all 0.2s ease;
        cursor: pointer;
        text-decoration: none;
      }
      .float-item:hover { border-color: var(--accent); color: var(--accent); }
      .float-item[data-active="true"] {
        background: var(--accent);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 4px 20px rgba(224,122,95,0.3);
      }

      .mobile-toolbar {
        position: sticky;
        top: 0;
        z-index: 35;
        border-bottom: 1px solid var(--border);
        background: rgba(10,10,11,0.85);
        backdrop-filter: blur(16px);
      }
      .mobile-toolbar-scroll {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.75rem 1rem 0.35rem;
        scrollbar-width: none;
      }
      .mobile-toolbar-scroll::-webkit-scrollbar { display: none; }
      .mobile-toolbar-link, .toolbar-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.25rem;
        border-radius: 9999px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .mobile-toolbar-link { padding: 0 0.875rem; }
      .mobile-toolbar-link:hover, .toolbar-toggle:hover { border-color: var(--accent); color: var(--accent); }
      .mobile-toolbar-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        padding: 0 1rem 0.75rem;
      }
      .toolbar-toggle { gap: 0.4rem; padding: 0 0.875rem; }

      .experience-timeline {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1.35rem;
      }
      .experience-timeline::before {
        content: "";
        position: absolute;
        left: 1.25rem;
        top: 0.5rem;
        bottom: 0.5rem;
        width: 1px;
        background: linear-gradient(180deg, transparent, var(--border) 10%, var(--border) 90%, transparent);
      }
      .experience-item {
        position: relative;
        display: grid;
        grid-template-columns: 2.5rem 1fr;
        gap: 1rem;
        align-items: start;
      }
      .experience-dot {
        width: 0.625rem;
        height: 0.625rem;
        border-radius: 9999px;
        background: var(--accent);
        border: 2px solid var(--bg-primary);
        margin-top: 0.375rem;
        justify-self: center;
        box-shadow: 0 0 0 3px rgba(224,122,95,0.15);
      }
      .experience-content {
          padding: 1.2rem;
          border-radius: 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
      }

      .project-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
      .project-tab {
        border: 1px solid var(--border);
        border-radius: 9999px;
          padding: 0.4rem 0.9rem;
        background: var(--bg-elevated);
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .project-tab:hover { border-color: var(--accent); color: var(--accent); }
      .project-tab[data-active="true"] {
        border-color: transparent;
        background: var(--accent);
        color: #fff;
      }

      .projects-stage {
        overflow: visible;
        padding-right: 0;
      }

      .project-pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }

      .project-page-button {
        min-width: 2.4rem;
        height: 2.4rem;
        border-radius: 9999px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        color: var(--text-muted);
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .project-page-button:hover {
        border-color: var(--accent);
        color: var(--accent);
      }

      .project-page-button[data-active="true"] {
        border-color: transparent;
        background: var(--accent);
        color: #fff;
      }

      .hero-section {
        position: relative;
        border-radius: 1.75rem;
        border: 1px solid var(--border);
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        overflow: hidden;
      }
      .hero-section::before {
        content: "";
        position: absolute;
        top: -50%;
        right: -20%;
        width: 60%;
        height: 200%;
        background: radial-gradient(circle, rgba(224,122,95,0.08) 0%, transparent 70%);
        pointer-events: none;
      }

      @media (max-width: 1279px) { .floating-nav { display: none; } }
      @media (max-width: 767px) {
        .experience-timeline::before { left: 0.75rem; }
        .experience-item { grid-template-columns: 1.5rem 1fr; gap: 0.75rem; }
          .project-tabs { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
        .project-tabs::-webkit-scrollbar { display: none; }
        .project-tab { flex: 0 0 auto; }
          .project-pagination { margin-top: 1.25rem; }
      }
    </style>

    ${head ? raw(head) : ""}
    ${body ? raw(body) : ""}

    <script>
      (() => {
        const theme = localStorage.getItem("portfolio-theme") || "light";
        if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
      })();
    </script>
  `,
});
