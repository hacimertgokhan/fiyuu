import { Component } from "@geajs/core";
import { escapeHtml, html } from "@fiyuu/core/client";

type ErrorData = {
  message?: string;
  route?: string;
  method?: string;
  stack?: string;
};

export default class ErrorPage extends Component<{ data?: ErrorData }> {
  template({ data }: { data?: ErrorData } = this.props) {
    const stack = data?.stack
      ? html`<pre class="mt-4 overflow-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)] p-4 text-xs leading-6 text-[color:var(--text-secondary)]">${escapeHtml(data.stack)}</pre>`
      : "";

    return html`
      <main class="min-h-screen px-5 py-10 sm:px-8">
        <section class="mx-auto max-w-2xl rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)]/65 p-6 sm:p-8">
          <p class="text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">500</p>
          <h1 class="mt-3 text-3xl font-black text-[color:var(--text-primary)] sm:text-4xl">Uygulama hatası oluştu</h1>
          <p class="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">${escapeHtml(data?.message ?? "Beklenmeyen bir hata oluştu.")}</p>
          <div class="mt-6 grid gap-3 text-sm text-[color:var(--text-secondary)] sm:grid-cols-2">
            <p><span class="text-[color:var(--text-muted)]">Route:</span> ${escapeHtml(data?.route ?? "/")}</p>
            <p><span class="text-[color:var(--text-muted)]">Method:</span> ${escapeHtml(data?.method ?? "GET")}</p>
          </div>
          <a href="/" class="mt-8 inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-2.5 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
            Ana sayfaya don
          </a>
          ${stack}
        </section>
      </main>
    `;
  }
}
