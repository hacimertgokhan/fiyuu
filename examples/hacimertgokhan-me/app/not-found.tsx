import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "404 not found page" });

export default class NotFoundPage extends Component<PageProps> {
  template() {
    return html`
      <main class="min-h-screen flex items-center justify-center px-5">
        <div class="text-center max-w-md animate-fade-in">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-secondary)] mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-10 w-10 text-[color:var(--accent)]">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 class="text-6xl font-black text-[color:var(--text-primary)] mb-2">404</h1>
          <p class="text-lg font-semibold text-[color:var(--accent)] mb-3">Sayfa Bulunamadı</p>
          <p class="text-base text-[color:var(--text-secondary)] leading-7 mb-8">
            Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          </p>
          <a href="/" class="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-5 py-2.5 text-sm text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
            Ana Sayfaya Dön
          </a>
        </div>
      </main>
    `;
  }
}
