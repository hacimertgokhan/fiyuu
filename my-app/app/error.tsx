import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type ErrorData = {
  message?: string;
  route?: string;
  method?: string;
  stack?: string;
};

export default class ErrorPage extends Component<{ data?: ErrorData }> {
  template({ data }: { data?: ErrorData } = this.props) {
    const stack = data?.stack ? html`<pre class="mt-4 overflow-auto rounded-xl border border-[#8f5f5f]/20 bg-[#2a1717] p-3 text-xs text-[#ffe9e9]">${escapeHtml(data.stack)}</pre>` : "";
    return html`
      <main class="min-h-screen w-full px-5 py-8 text-[#3d2b2b]">
        <section class="w-full rounded-2xl border border-[#8f5f5f]/24 bg-[#f7ece7] p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[#8f5f5f]">500</p>
          <h1 class="mt-3 text-3xl font-semibold text-[#3a2020]">Application error</h1>
          <p class="mt-3 text-sm text-[#684545]">${escapeHtml(data?.message ?? "Unknown error")}</p>
          <p class="mt-4 text-sm text-[#684545]">Route: ${escapeHtml(data?.route ?? "/")}</p>
          <p class="mt-1 text-sm text-[#684545]">Method: ${escapeHtml(data?.method ?? "GET")}</p>
          ${stack}
        </section>
      </main>
    `;
  }
}
