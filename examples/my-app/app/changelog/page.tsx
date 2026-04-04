import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import { formatDate } from "../../lib/ui.js";
import type { query } from "./query.js";

type ChangelogData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Changelog — version history and release notes" });

function renderContent(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      if (line.trim() === "") return `<div style="height:0.5rem"></div>`;
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return `<div style="display:flex;align-items:baseline;gap:0.75rem;margin-bottom:0.375rem">
          <span style="width:3px;height:3px;background:#71717a;flex-shrink:0;display:inline-block;margin-top:0.5rem"></span>
          <span style="font-size:0.875rem;color:#52525b;line-height:1.7">${line.slice(2)}</span>
        </div>`;
      }
      return `<p style="font-size:0.875rem;color:#52525b;line-height:1.7;margin:0 0 0.375rem">${line}</p>`;
    })
    .join("");
}

export default class ChangelogPage extends Component<PageProps<ChangelogData>> {
  template({ data }: PageProps<ChangelogData> = this.props) {
    const entries = data?.entries ?? [];

    const entryItems = entries
      .map(
        (entry, i) => `
          <div class="fy-entry" style="display:grid;grid-template-columns:10rem 1fr;gap:3rem;padding:3rem 0;${i < entries.length - 1 ? "border-bottom:1px solid #e4e4e7;" : ""}">

            <!-- Left: version + date -->
            <div style="padding-top:0.25rem">
              <div style="font-family:monospace;font-size:0.6875rem;font-weight:700;letter-spacing:0.06em;background:#09090b;color:white;display:inline-block;padding:0.25rem 0.625rem;margin-bottom:0.75rem">
                v${entry.version}
              </div>
              <p style="font-size:0.75rem;color:#a1a1aa;font-family:monospace">${formatDate(entry.createdAt)}</p>
            </div>

            <!-- Right: title + content -->
            <div>
              <h2 style="font-size:1.125rem;font-weight:700;color:#18181b;letter-spacing:-0.025em;margin:0 0 1.25rem">${entry.title}</h2>
              <div>${renderContent(entry.content)}</div>
            </div>

          </div>
        `,
      )
      .join("");

    return html`
      <style>
        @keyframes fy-fade-up {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fy-fade { animation: fy-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both; animation-delay: var(--fd,0ms); opacity:0; }
        @media (max-width: 780px) {
          .fy-entry { grid-template-columns: 1fr !important; gap: 1rem !important; }
        }
      </style>

      <main style="font-family:'Inter',system-ui,-apple-system,sans-serif">

        <!-- ── Header band ──────────────────────────────────────────── -->
        <section style="background:#09090b;border-bottom:1px solid #1c1c1f">
          <div style="max-width:60rem;margin:0 auto;padding:4rem 1.5rem 3.5rem">
            <p class="fy-fade" style="--fd:0ms;font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.09em;color:#3f3f46;margin-bottom:0.625rem">Release Notes</p>
            <h1 class="fy-fade" style="--fd:80ms;font-size:clamp(2rem,5vw,3rem);font-weight:900;color:white;letter-spacing:-0.04em;line-height:1;margin-bottom:1rem">Changelog</h1>
            <p class="fy-fade" style="--fd:160ms;font-size:0.9375rem;color:#52525b;line-height:1.6;max-width:44ch">
              Every significant change, improvement, and fix — documented by version.
            </p>
          </div>
        </section>

        <!-- ── Entries ─────────────────────────────────────────────── -->
        <div style="max-width:60rem;margin:0 auto;padding:0 1.5rem 6rem">

          ${entries.length > 0
            ? `<div>${entryItems}</div>`
            : `<div style="padding:5rem 0;text-align:center;color:#a1a1aa;font-size:0.875rem">No changelog entries yet.</div>`
          }

        </div>
      </main>
    `;
  }
}
