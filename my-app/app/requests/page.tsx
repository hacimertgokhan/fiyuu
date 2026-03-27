import { Component } from "@geajs/core";
import { definePage, escapeHtml, html, type PageProps } from "fiyuu/client";

type RequestsData = {
  requests: Array<{
    id: string;
    route: string;
    method: string;
    source: string;
  }>;
};

export const page = definePage({
  intent: "Request list page showing records from the F1 starter store",
});

export default class Page extends Component<PageProps<RequestsData>> {
  template({ data }: PageProps<RequestsData> = this.props) {
    const baseRequests = data?.requests ?? [];
    const rows = Array.from({ length: 400 }, (_, index) =>
      baseRequests[index % (baseRequests.length || 1)] ?? { id: "n/a", route: "/", method: "GET", source: "empty" },
    );
    const rowsHtml = rows
      .map(
        (request, index) => html`<div class="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-sm text-[#364330]"><div>${escapeHtml(request.id)}-${index}</div><div>${escapeHtml(request.route)}</div><div>${escapeHtml(request.method)}</div><div>${escapeHtml(request.source)}</div></div>`,
      )
      .join("");

    return html`
      <main class="min-h-screen bg-[#f7f3ea] px-6 py-12 text-[#31402b]">
        <div class="mx-auto max-w-6xl rounded-[2rem] border border-[#7a8f6b]/20 bg-white/70 p-8">
          <div class="text-xs uppercase tracking-[0.24em] text-[#6d805f]">F1 Example</div>
          <h1 class="mt-4 text-4xl font-semibold text-[#24311f]">Global Request List</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-[#5f6d58]">This route reads starter records from the lightweight F1 store and renders a deterministic list in Gea mode.</p>
          <div class="mt-6 rounded-2xl bg-[#edf3e7] px-4 py-4 text-sm text-[#4d5d47]">Rows rendered: ${rows.length}</div>
          <div class="mt-8 overflow-hidden rounded-3xl border border-[#7a8f6b]/15 bg-[#fcfaf5]">
            <div class="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#7a8f6b]/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-[#7a8b71]"><div>ID</div><div>Route</div><div>Method</div><div>Source</div></div>
            ${rowsHtml}
          </div>
        </div>
      </main>
    `;
  }
}
