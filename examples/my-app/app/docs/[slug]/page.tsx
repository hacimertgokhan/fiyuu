import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import { formatDate } from "../../../lib/ui.js";
import type { query } from "./query.js";

type DocData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Render a single documentation article with sidebar nav" });

const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  "core-concepts": "Core Concepts",
  reference: "Reference",
};

const CATEGORY_ACCENT: Record<string, string> = {
  "getting-started": "#22c55e",
  "core-concepts": "#818cf8",
  reference: "#f59e0b",
};

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function estimateReadMinutes(raw: string): number {
  const words = raw.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function renderInline(raw: string): string {
  const codeSpans: string[] = [];
  let text = escapeHtml(raw).replace(/`([^`]+)`/g, (_, code) => {
    const token = `__FY_CODE_${codeSpans.length}__`;
    codeSpans.push(`<code style="font-family:monospace;font-size:0.8125rem;background:#f4f4f5;color:#18181b;padding:0.125em 0.375em;border:1px solid #e4e4e7">${code}</code>`);
    return token;
  });

  text = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong style=\"font-weight:700;color:#27272a\">$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#18181b;text-decoration:underline;text-underline-offset:2px">$1</a>');

  return text.replace(/__FY_CODE_(\d+)__/g, (_, i) => codeSpans[Number(i)] ?? "");
}

function collectHeadings(raw: string): Array<{ level: 2 | 3; title: string; id: string }> {
  const used = new Map<string, number>();
  const out: Array<{ level: 2 | 3; title: string; id: string }> = [];

  for (const line of raw.split("\n")) {
    const level = line.startsWith("## ") ? 2 : line.startsWith("### ") ? 3 : null;
    if (!level) continue;
    const title = line.slice(level + 1).trim();
    const base = slugifyHeading(title) || "section";
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    out.push({ level, title, id: count === 1 ? base : `${base}-${count}` });
  }

  return out;
}

function renderContent(raw: string): string {
  const lines = raw.split("\n");
  let out = "";
  let inCode = false;
  let codeBuffer = "";
  const listItems: string[] = [];
  const usedHeadingIds = new Map<string, number>();

  const flushList = () => {
    if (listItems.length === 0) return;
    out += `<ul style="margin:0 0 1.1rem 1.1rem;padding:0;color:#52525b">${listItems
      .map((item) => `<li style="font-size:0.9375rem;line-height:1.8;margin-bottom:0.375rem">${renderInline(item)}</li>`)
      .join("")}</ul>`;
    listItems.length = 0;
  };

  const headingId = (title: string) => {
    const base = slugifyHeading(title) || "section";
    const count = (usedHeadingIds.get(base) ?? 0) + 1;
    usedHeadingIds.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        flushList();
        inCode = true;
        codeBuffer = "";
      } else {
        inCode = false;
        out += `<div style="background:#09090b;border:1px solid #1c1c1f;padding:1.25rem 1.5rem;margin:1.25rem 0;overflow-x:auto">
          <pre style="margin:0;font-family:monospace;font-size:0.8125rem;line-height:1.75;color:#a1a1aa">${escapeHtml(codeBuffer.trimEnd())}</pre>
        </div>`;
        codeBuffer = "";
      }
      continue;
    }
    if (inCode) { codeBuffer += line + "\n"; continue; }

    if (line.startsWith("### ")) {
      flushList();
      const title = line.slice(4).trim();
      out += `<h3 id="${headingId(title)}" style="font-size:1rem;font-weight:700;color:#18181b;letter-spacing:-0.02em;margin:2rem 0 0.625rem">${escapeHtml(title)}</h3>`;
    } else if (line.startsWith("## ")) {
      flushList();
      const title = line.slice(3).trim();
      out += `<h2 id="${headingId(title)}" style="font-size:1.125rem;font-weight:700;color:#18181b;letter-spacing:-0.025em;margin:2.5rem 0 0.875rem;padding-bottom:0.625rem;border-bottom:1px solid #f4f4f5">${escapeHtml(title)}</h2>`;
    } else if (line.startsWith("# ")) {
      flushList();
      out += `<h1 style="font-size:1.5rem;font-weight:800;color:#18181b;letter-spacing:-0.03em;margin:0 0 1rem">${escapeHtml(line.slice(2))}</h1>`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
      out += `<div style="height:0.75rem"></div>`;
    } else {
      flushList();
      out += `<p style="font-size:0.9375rem;color:#52525b;line-height:1.8;margin:0 0 0.5rem">${renderInline(line)}</p>`;
    }
  }

  flushList();
  return out;
}

export default class DocPage extends Component<PageProps<DocData>> {
  template({ data }: PageProps<DocData> = this.props) {
    const { doc, prev, next, allDocs } = data ?? { doc: null, prev: null, next: null, allDocs: [] };

    if (!doc) {
      return html`
        <main style="max-width:60rem;margin:0 auto;padding:5rem 1.5rem;text-align:center;font-family:'Inter',system-ui,sans-serif">
          <p style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:#a1a1aa;margin-bottom:1rem">404</p>
          <h1 style="font-size:2rem;font-weight:800;color:#18181b;letter-spacing:-0.03em;margin-bottom:0.75rem">Page not found</h1>
          <p style="font-size:0.9375rem;color:#71717a;margin-bottom:2rem">This doc doesn't exist or hasn't been published yet.</p>
          <a href="/docs" style="font-size:0.875rem;color:#18181b;text-decoration:none;border-bottom:1px solid #18181b;padding-bottom:1px">← Back to docs</a>
        </main>
      `;
    }

    const catOrder = ["getting-started", "core-concepts", "reference"];
    const grouped = catOrder.reduce<Record<string, typeof allDocs>>((acc, cat) => {
      acc[cat] = allDocs.filter((d) => d.category === cat);
      return acc;
    }, {});

    const sidebarSections = catOrder
      .filter((cat) => grouped[cat].length > 0)
      .map((cat) => {
        const items = grouped[cat]
          .map((d) => {
            const isActive = d.slug === doc.slug;
            return `<a href="/docs/${escapeHtml(d.slug)}"
              style="display:block;padding:0.5rem 0.75rem;font-size:0.8125rem;text-decoration:none;transition:background 0.1s,color 0.1s;${isActive ? `background:#18181b;color:white;font-weight:500` : `color:#71717a`}"
              ${!isActive ? `onmouseover="this.style.background='#f4f4f5';this.style.color='#18181b'" onmouseout="this.style.background='transparent';this.style.color='#71717a'"` : ""}>
              ${escapeHtml(d.title)}
            </a>`;
          })
          .join("");

        const accent = CATEGORY_ACCENT[cat] ?? "#71717a";
        return `
          <div style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0 0.75rem;margin-bottom:0.5rem">
              <div style="width:6px;height:6px;background:${accent};flex-shrink:0"></div>
              <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#a1a1aa;margin:0">${escapeHtml(CATEGORY_LABELS[cat] ?? cat)}</p>
            </div>
            ${items}
          </div>
        `;
      })
      .join("");

    const accent = CATEGORY_ACCENT[doc.category] ?? "#71717a";
    const headings = collectHeadings(doc.content);
    const readMinutes = estimateReadMinutes(doc.content);

    const tableOfContents = headings.length
      ? headings
          .map(
            (item) => `<a href="#${item.id}" style="display:block;font-size:${item.level === 2 ? "0.75rem" : "0.7125rem"};padding:${item.level === 2 ? "0.35rem 0" : "0.25rem 0 0.25rem 0.7rem"};color:#71717a;text-decoration:none;line-height:1.5;transition:color 0.12s" onmouseover="this.style.color='#18181b'" onmouseout="this.style.color='#71717a'">${escapeHtml(item.title)}</a>`,
          )
          .join("")
      : "";

    return html`
      <style>
        .doc-shell {
          max-width: 80rem;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 14rem minmax(0, 1fr) 13rem;
          min-height: calc(100vh - 3.5rem);
        }
        .doc-sidebar {
          border-right: 1px solid #e4e4e7;
          padding: 2rem 0;
          position: sticky;
          top: 3.5rem;
          height: calc(100vh - 3.5rem);
          overflow-y: auto;
        }
        .doc-article {
          padding: 3rem 3rem 5rem;
          min-width: 0;
        }
        .doc-toc {
          border-left: 1px solid #f4f4f5;
          padding: 2rem 1rem;
          position: sticky;
          top: 3.5rem;
          height: calc(100vh - 3.5rem);
          overflow-y: auto;
        }
        @media (max-width: 1100px) {
          .doc-shell { grid-template-columns: 14rem minmax(0, 1fr); }
          .doc-toc { display: none; }
        }
        @media (max-width: 860px) {
          .doc-shell { display: block; }
          .doc-sidebar {
            position: static;
            top: auto;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e4e4e7;
            padding: 1rem 0;
          }
          .doc-article { padding: 2rem 1.25rem 3rem; }
        }
      </style>

      <div style="font-family:'Inter',system-ui,-apple-system,sans-serif">
        <div class="doc-shell">

          <!-- ── Sidebar ──────────────────────────────────────────── -->
          <aside class="doc-sidebar">
            <div style="padding:0 1rem 1.5rem">
              <a href="/docs" style="display:inline-flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:#a1a1aa;text-decoration:none;transition:color 0.12s;margin-bottom:1.5rem" onmouseover="this.style.color='#18181b'" onmouseout="this.style.color='#a1a1aa'">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                All docs
              </a>
            </div>
            ${sidebarSections}
          </aside>

          <!-- ── Article ──────────────────────────────────────────── -->
          <article class="doc-article">

            <!-- Breadcrumb -->
            <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;color:#a1a1aa;margin-bottom:2rem">
              <a href="/docs" style="color:#a1a1aa;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='#18181b'" onmouseout="this.style.color='#a1a1aa'">Docs</a>
              <span style="color:#d4d4d8">/</span>
              <span style="display:inline-flex;align-items:center;gap:0.375rem">
                <span style="width:6px;height:6px;background:${accent};display:inline-block"></span>
                <span style="color:#71717a">${escapeHtml(CATEGORY_LABELS[doc.category] ?? doc.category)}</span>
              </span>
              <span style="color:#d4d4d8">/</span>
              <span style="color:#18181b;font-weight:500">${escapeHtml(doc.title)}</span>
            </div>

            <!-- Title -->
            <h1 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:800;color:#18181b;letter-spacing:-0.04em;line-height:1.15;margin:0 0 1rem">${escapeHtml(doc.title)}</h1>
            <p style="font-size:1rem;color:#71717a;line-height:1.7;margin:0 0 2.5rem;max-width:56ch">${escapeHtml(doc.excerpt)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.625rem;font-size:0.75rem;color:#a1a1aa;font-family:monospace;margin:-1.5rem 0 2rem">
              <span style="border:1px solid #e4e4e7;padding:0.25rem 0.5rem">${readMinutes} min read</span>
              <span style="border:1px solid #e4e4e7;padding:0.25rem 0.5rem">Updated ${formatDate(doc.updatedAt)}</span>
            </div>

            <!-- Content -->
            <div style="border-top:1px solid #f4f4f5;padding-top:2rem" class="doc-content">
              ${renderContent(doc.content)}
            </div>

            <!-- Prev / Next -->
            <div style="margin-top:2rem;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e4e4e7">
              ${prev
                ? `<a href="/docs/${escapeHtml(prev.slug)}"
                    style="background:white;padding:1.25rem 1.5rem;text-decoration:none;display:flex;flex-direction:column;gap:0.375rem;transition:background 0.12s"
                    onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
                    <span style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#a1a1aa">← Previous</span>
                    <span style="font-size:0.875rem;font-weight:600;color:#18181b">${escapeHtml(prev.title)}</span>
                  </a>`
                : `<div style="background:#fafafa"></div>`}
              ${next
                ? `<a href="/docs/${escapeHtml(next.slug)}"
                    style="background:white;padding:1.25rem 1.5rem;text-decoration:none;display:flex;flex-direction:column;align-items:flex-end;gap:0.375rem;transition:background 0.12s"
                    onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
                    <span style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#a1a1aa">Next →</span>
                    <span style="font-size:0.875rem;font-weight:600;color:#18181b">${escapeHtml(next.title)}</span>
                  </a>`
                : `<div style="background:#fafafa"></div>`}
            </div>

          </article>

          <!-- ── TOC ──────────────────────────────────────────────── -->
          <aside class="doc-toc">
            ${headings.length > 0
              ? `<p style="margin:0 0 0.75rem;font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa">On this page</p>${tableOfContents}`
              : `<p style="margin:0;font-size:0.75rem;color:#a1a1aa">No sections</p>`}
          </aside>
        </div>
      </div>
    `;
  }
}
