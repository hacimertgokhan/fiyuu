import { Component } from "@geajs/core";
import { escapeHtml, html } from "fiyuu/client";

type NotFoundData = {
  title?: string;
  route?: string;
  method?: string;
};

export default class NotFoundPage extends Component<{ data?: NotFoundData }> {
  template({ data }: { data?: NotFoundData } = this.props) {
    return html`
      <main class="min-h-screen w-full px-5 py-8 text-[#30402a]">
        <section class="w-full rounded-2xl border border-[#7a8f6b]/20 bg-[#f8f4ec] p-6">
          <p class="text-xs uppercase tracking-[0.22em] text-[#627356]">404</p>
          <h1 class="mt-3 text-3xl font-semibold text-[#24311f]">${escapeHtml(data?.title ?? "Page not found")}</h1>
          <p class="mt-3 text-sm text-[#5a6753]">The requested route is not available in this Fiyuu app.</p>
          <p class="mt-4 text-sm text-[#5a6753]">Route: ${escapeHtml(data?.route ?? "/")}</p>
          <p class="mt-1 text-sm text-[#5a6753]">Method: ${escapeHtml(data?.method ?? "GET")}</p>
        </section>
      </main>
    `;
  }
}
