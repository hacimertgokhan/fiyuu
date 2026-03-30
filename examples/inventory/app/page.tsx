import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type DashboardData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Inventory dashboard with stats and alerts" });

export default class DashboardPage extends Component<PageProps<DashboardData>> {
  template({ data }: PageProps<DashboardData> = this.props) {
    const dashboard = data ?? {
      stats: { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 },
      recentMovements: [],
      lowStockProducts: [],
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

    const iconBox = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
    const iconDollar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
    const iconAlert = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>`;
    const iconX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;

    const movementsHtml = dashboard.recentMovements
      .map(
        (m: { id: string; productName: string; type: string; quantity: number; date: number }) => html`
          <tr>
            <td style="font-weight:500;color:var(--text-primary);">${escapeHtml(m.productName)}</td>
            <td><span class="badge ${m.type === "in" ? "badge-success" : "badge-danger"}">${m.type === "in" ? "Giriş" : "Çıkış"}</span></td>
            <td style="font-weight:600;">${m.type === "in" ? "+" : "-"}${m.quantity}</td>
            <td>${new Date(m.date).toLocaleDateString("tr-TR")}</td>
          </tr>
        `,
      )
      .join("");

    const lowStockHtml = dashboard.lowStockProducts
      .map(
        (p: { id: string; name: string; sku: string; quantity: number; minStock: number; category: string }) => html`
          <tr>
            <td style="font-weight:500;color:var(--text-primary);">${escapeHtml(p.name)}</td>
            <td><code style="font-size:0.75rem;background:var(--bg-primary);padding:2px 6px;border-radius:4px;">${escapeHtml(p.sku)}</code></td>
            <td>
              <span class="badge ${p.quantity === 0 ? "badge-danger" : "badge-warning"}">
                ${p.quantity === 0 ? "Stokta yok" : `${p.quantity} / ${p.minStock}`}
              </span>
            </td>
            <td>${escapeHtml(p.category)}</td>
          </tr>
        `,
      )
      .join("");

    return html`
      <div class="animate-fade-in">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Stok durumu ve son hareketler</p>
          </div>
          <a href="/products" class="btn btn-primary">
            + Yeni Ürün
          </a>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card animate-slide-up" style="animation-delay:0ms;animation-fill-mode:both;">
            <div class="stat-label">Toplam Ürün</div>
            <div class="stat-value">${dashboard.stats.totalProducts}</div>
            <div class="stat-change up">Aktif envanter</div>
          </div>
          <div class="stat-card animate-slide-up" style="animation-delay:60ms;animation-fill-mode:both;">
            <div class="stat-label">Toplam Değer</div>
            <div class="stat-value" style="font-size:1.25rem;">${formatCurrency(dashboard.stats.totalValue)}</div>
            <div class="stat-change up">Stok değeri</div>
          </div>
          <div class="stat-card animate-slide-up" style="animation-delay:120ms;animation-fill-mode:both;">
            <div class="stat-label">Düşük Stok</div>
            <div class="stat-value" style="color:var(--warning);">${dashboard.stats.lowStockCount}</div>
            <div class="stat-change down">Minimum seviyede</div>
          </div>
          <div class="stat-card animate-slide-up" style="animation-delay:180ms;animation-fill-mode:both;">
            <div class="stat-label">Stokta Yok</div>
            <div class="stat-value" style="color:var(--danger);">${dashboard.stats.outOfStockCount}</div>
            <div class="stat-change down">Acil sipariş gerekli</div>
          </div>
        </div>

        <!-- Tables Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
          <!-- Recent Movements -->
          <div class="card animate-slide-up" style="animation-delay:240ms;animation-fill-mode:both;">
            <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary);">Son Hareketler</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Tür</th>
                    <th>Adet</th>
                    <th>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  ${movementsHtml || html`<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">Henüz hareket yok</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Low Stock Alerts -->
          <div class="card animate-slide-up" style="animation-delay:300ms;animation-fill-mode:both;">
            <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:1rem;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem;">
              ${iconAlert} Düşük Stok Uyarıları
            </h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>SKU</th>
                    <th>Stok</th>
                    <th>Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  ${lowStockHtml || html`<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">Tüm ürünler yeterli stokta</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
