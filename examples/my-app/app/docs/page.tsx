import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type DocsData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Documentation index — browse all docs by category" });

const CATEGORY_META: Record<string, { label: string; desc: string; accent: string }> = {
  "getting-started": {
    label: "Getting Started",
    desc: "Install, configure, and ship your first Fiyuu app.",
    accent: "#22c55e",
  },
  "core-concepts": {
    label: "Core Concepts",
    desc: "Deep dives into route contracts, GEA, and the runtime.",
    accent: "#818cf8",
  },
  reference: {
    label: "Reference",
    desc: "API reference, CLI commands, and configuration options.",
    accent: "#f59e0b",
  },
};

export default class DocsPage extends Component<PageProps<DocsData>> {
  template({ data }: PageProps<DocsData> = this.props) {
    const categories = data?.byCategory ?? [];
    const total = data?.total ?? 0;

    const filterChips = categories
      .map(
        (cat) =>
          `<button type="button" class="fy-filter-chip" data-filter="${cat.key}">${cat.label} <span>${cat.docs.length}</span></button>`,
      )
      .join("");

    const categorySections = categories
      .map((cat) => {
        const catKey = cat.key;
        const meta = CATEGORY_META[catKey] ?? { label: cat.label, desc: "", accent: "#71717a" };

        const docCards = cat.docs
          .map(
            (doc) => `
              <a href="/docs/${doc.slug}"
                class="fy-doc-card"
                data-title="${doc.title}"
                data-excerpt="${doc.excerpt}"
                data-category="${doc.category}"
                style="display:block;border:1px solid #e4e4e7;padding:1.25rem 1.5rem;background:white;text-decoration:none;transition:border-color 0.12s,background 0.12s;position:relative;overflow:hidden"
                onmouseover="this.style.borderColor='#a1a1aa';this.style.background='#fafafa'"
                onmouseout="this.style.borderColor='#e4e4e7';this.style.background='white'">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
                  <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0;letter-spacing:-0.02em">${doc.title}</h3>
                  <svg width="14" height="14" fill="none" stroke="#a1a1aa" viewBox="0 0 24 24" style="flex-shrink:0"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </div>
                <p style="font-size:0.8125rem;color:#71717a;line-height:1.6;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${doc.excerpt}</p>
                <div style="position:absolute;left:0;top:0;bottom:0;width:2px;background:${meta.accent}"></div>
              </a>
            `,
          )
          .join("");

        return `
          <section class="fy-doc-section" data-category="${catKey}" style="margin-bottom:4rem">
            <div style="display:flex;align-items:center;gap:0.875rem;margin-bottom:1.75rem;padding-bottom:1rem;border-bottom:1px solid #e4e4e7">
              <div style="width:8px;height:8px;background:${meta.accent};flex-shrink:0"></div>
              <div>
                <h2 style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#71717a;margin:0 0 0.2rem">${meta.label}</h2>
                <p style="font-size:0.8125rem;color:#a1a1aa;margin:0">${meta.desc}</p>
              </div>
              <span style="margin-left:auto;font-family:monospace;font-size:0.75rem;color:#a1a1aa">${cat.docs.length} article${cat.docs.length !== 1 ? "s" : ""}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#e4e4e7">
              ${docCards}
            </div>
          </section>
        `;
      })
      .join("");

    return html`
      <style>
        @keyframes fy-fade-up {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fy-fade { animation: fy-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both; animation-delay: var(--fd,0ms); opacity:0; }
        .fy-filter-chip {
          border: 1px solid #e4e4e7;
          background: white;
          color: #52525b;
          padding: 0.45rem 0.75rem;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .fy-filter-chip span {
          font-family: monospace;
          color: #a1a1aa;
          font-size: 0.6875rem;
        }
        .fy-filter-chip.is-active {
          border-color: #18181b;
          color: #18181b;
          background: #fafafa;
        }
        @media (max-width: 900px) {
          .fy-doc-grid { grid-template-columns: 1fr !important; }
        }
      </style>

      <main style="font-family:'Inter',system-ui,-apple-system,sans-serif">

        <!-- ── Header band ──────────────────────────────────────────── -->
        <section style="background:#09090b;border-bottom:1px solid #1c1c1f">
          <div style="max-width:60rem;margin:0 auto;padding:4rem 1.5rem 3.5rem">
            <p style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:#3f3f46;margin-bottom:0.625rem">Fiyuu Framework</p>
            <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:900;color:white;letter-spacing:-0.04em;line-height:1;margin-bottom:1rem">Documentation</h1>
            <p style="font-size:0.9375rem;color:#52525b;line-height:1.6;max-width:44ch">
              ${total} articles covering route contracts, GEA components, F1 database, and more.
            </p>
          </div>
        </section>

        <!-- ── Quick links strip ────────────────────────────────────── -->
        <div style="border-bottom:1px solid #e4e4e7;background:#fafafa">
          <div style="max-width:60rem;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;gap:0;overflow-x:auto">
            <a href="/docs/getting-started" style="padding:0.875rem 1.25rem;font-size:0.8125rem;color:#71717a;text-decoration:none;white-space:nowrap;border-right:1px solid #e4e4e7;transition:color 0.12s,background 0.12s" onmouseover="this.style.color='#18181b';this.style.background='white'" onmouseout="this.style.color='#71717a';this.style.background='transparent'">Quick Start</a>
            <a href="/docs/route-contracts" style="padding:0.875rem 1.25rem;font-size:0.8125rem;color:#71717a;text-decoration:none;white-space:nowrap;border-right:1px solid #e4e4e7;transition:color 0.12s,background 0.12s" onmouseover="this.style.color='#18181b';this.style.background='white'" onmouseout="this.style.color='#71717a';this.style.background='transparent'">Route Contracts</a>
            <a href="/docs/gea-components" style="padding:0.875rem 1.25rem;font-size:0.8125rem;color:#71717a;text-decoration:none;white-space:nowrap;border-right:1px solid #e4e4e7;transition:color 0.12s,background 0.12s" onmouseover="this.style.color='#18181b';this.style.background='white'" onmouseout="this.style.color='#71717a';this.style.background='transparent'">GEA Components</a>
            <a href="/docs/f1-database" style="padding:0.875rem 1.25rem;font-size:0.8125rem;color:#71717a;text-decoration:none;white-space:nowrap;border-right:1px solid #e4e4e7;transition:color 0.12s,background 0.12s" onmouseover="this.style.color='#18181b';this.style.background='white'" onmouseout="this.style.color='#71717a';this.style.background='transparent'">F1 Database</a>
            <a href="/docs/cli-reference" style="padding:0.875rem 1.25rem;font-size:0.8125rem;color:#71717a;text-decoration:none;white-space:nowrap;transition:color 0.12s,background 0.12s" onmouseover="this.style.color='#18181b';this.style.background='white'" onmouseout="this.style.color='#71717a';this.style.background='transparent'">CLI Reference</a>
          </div>
        </div>

        <!-- ── Search and filters ───────────────────────────────────── -->
        <div style="border-bottom:1px solid #e4e4e7;background:white">
          <div style="max-width:60rem;margin:0 auto;padding:1.125rem 1.5rem;display:flex;flex-wrap:wrap;gap:0.625rem;align-items:center">
            <input
              id="docs-search"
              type="search"
              placeholder="Search docs..."
              style="flex:1;min-width:14rem;border:1px solid #e4e4e7;padding:0.55rem 0.75rem;font-size:0.8125rem;outline:none"
              onfocus="this.style.borderColor='#71717a'"
              onblur="this.style.borderColor='#e4e4e7'"
            />
            <button type="button" id="docs-filter-all" class="fy-filter-chip is-active" data-filter="all">All docs <span>${total}</span></button>
            ${filterChips}
          </div>
        </div>

        <!-- ── Category sections ────────────────────────────────────── -->
        <div style="max-width:60rem;margin:0 auto;padding:3.5rem 1.5rem 5rem">
          ${categories.length > 0
            ? categorySections
            : `<div style="padding:5rem 0;text-align:center;color:#a1a1aa;font-size:0.875rem">No docs published yet.</div>`
          }
          <div id="docs-empty" style="display:none;padding:4rem 0;text-align:center;color:#a1a1aa;font-size:0.875rem">No docs match this filter.</div>
        </div>

        <script type="module">
          (function () {
            const search = document.getElementById("docs-search");
            const chips = Array.from(document.querySelectorAll(".fy-filter-chip"));
            const cards = Array.from(document.querySelectorAll(".fy-doc-card"));
            const sections = Array.from(document.querySelectorAll(".fy-doc-section"));
            const empty = document.getElementById("docs-empty");

            if (!search || cards.length === 0) return;

            let activeFilter = "all";

            const applyFilters = () => {
              const term = String(search.value || "").trim().toLowerCase();
              let visibleCardCount = 0;

              for (const card of cards) {
                const title = String(card.getAttribute("data-title") || "").toLowerCase();
                const excerpt = String(card.getAttribute("data-excerpt") || "").toLowerCase();
                const category = String(card.getAttribute("data-category") || "");
                const matchesTerm = term === "" || title.includes(term) || excerpt.includes(term);
                const matchesFilter = activeFilter === "all" || category === activeFilter;
                const isVisible = matchesTerm && matchesFilter;
                card.style.display = isVisible ? "block" : "none";
                if (isVisible) visibleCardCount += 1;
              }

              for (const section of sections) {
                const sectionCards = Array.from(section.querySelectorAll(".fy-doc-card"));
                const visible = sectionCards.some((card) => card.style.display !== "none");
                section.style.display = visible ? "block" : "none";
              }

              if (empty) empty.style.display = visibleCardCount === 0 ? "block" : "none";
            };

            search.addEventListener("input", applyFilters);

            for (const chip of chips) {
              chip.addEventListener("click", () => {
                activeFilter = String(chip.getAttribute("data-filter") || "all");
                for (const item of chips) item.classList.remove("is-active");
                chip.classList.add("is-active");
                applyFilters();
              });
            }

            applyFilters();
          })();
        </script>

      </main>
    `;
  }
}
