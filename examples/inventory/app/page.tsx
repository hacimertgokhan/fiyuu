import { definePage, html, component, when, each, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";
import { formatMoney, inventoryFlatStore } from "../lib/inventory-flat-store.js";

type DashboardData = InferQueryOutput<typeof query>;
type Movement = DashboardData["recentMovements"][number];
type Product = DashboardData["lowStockProducts"][number];

export const page = definePage({ intent: "Inventory dashboard with declarative control tags" });

type BadgeVariant = "success" | "warning" | "danger" | "info";

const Badge = component<{ text: string; variant?: BadgeVariant }>(
  ({ text, variant = "info" }) => html`<span class="badge badge-${variant}">${text}</span>`,
);

const StatCard = component<{ label: string; value: string | number; change?: string; tone?: string }>(
  ({ label, value, change, tone }) => html`
    <div class="stat-card">
      <div class="stat-label">${label}</div>
      <div class="stat-value" style="${tone ? `color:${tone}` : ""}">${value}</div>
      ${when(change, () => html`<div class="stat-change">${change}</div>`)}
    </div>
  `,
);

function fallbackData(): DashboardData {
  return {
    stats: { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 },
    recentMovements: [],
    lowStockProducts: [],
  };
}

const DashboardPage = component<{ data?: DashboardData }>(({ data }) => {
  const dashboard = data ?? fallbackData();
  const flatState = inventoryFlatStore.get();

  return html`
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Stok durumu ve son hareketler</p>
        </div>
        <a href="/products" class="btn btn-primary">+ Yeni Ürün</a>
      </div>

      <div class="stats-grid">
        ${StatCard({ label: "Toplam Ürün", value: dashboard.stats.totalProducts, change: "Aktif envanter" })}
        ${StatCard({ label: "Toplam Değer", value: formatMoney(dashboard.stats.totalValue), change: "Stok değeri" })}
        ${StatCard({ label: "Düşük Stok", value: dashboard.stats.lowStockCount, change: flatState.lowStockThresholdLabel, tone: "var(--warning)" })}
        ${StatCard({ label: "Stokta Yok", value: dashboard.stats.outOfStockCount, change: "Acil sipariş gerekli", tone: "var(--danger)" })}
      </div>

      <div class="dashboard-panels">
        <div class="card">
          <h3 class="card-title">Son Hareketler</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr><th>Ürün</th><th>Tür</th><th>Adet</th><th>Tarih</th></tr>
              </thead>
              <tbody>
                ${each(dashboard.recentMovements, (m) => {
                  const isIn = m.type === "in";
                  const date = new Date(m.date).toLocaleDateString("tr-TR");
                  return html`
                    <tr>
                      <td style="font-weight:500;">${m.productName}</td>
                      <td>${Badge({ text: isIn ? "Giriş" : "Çıkış", variant: isIn ? "success" : "danger" })}</td>
                      <td style="font-weight:600;">${isIn ? "+" : "-"}${m.quantity}</td>
                      <td>${date}</td>
                    </tr>
                  `;
                })}
                ${when(dashboard.recentMovements.length === 0, () => html`
                  <tr><td colspan="4"><div class="empty-state">Henüz hareket yok</div></td></tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">Düşük Stok Uyarıları</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr><th>Ürün</th><th>SKU</th><th>Stok</th><th>Kategori</th></tr>
              </thead>
              <tbody>
                ${each(dashboard.lowStockProducts, (p) => html`
                  <tr>
                    <td style="font-weight:500;">${p.name}</td>
                    <td><code>${p.sku}</code></td>
                    <td>
                      ${Badge({
                        text: p.quantity === 0 ? "Stokta yok" : `${p.quantity} / ${p.minStock}`,
                        variant: p.quantity === 0 ? "danger" : "warning",
                      })}
                    </td>
                    <td>${p.category}</td>
                  </tr>
                `)}
                ${when(dashboard.lowStockProducts.length === 0, () => html`
                  <tr><td colspan="4"><div class="empty-state">Tüm ürünler yeterli stokta</div></td></tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
});

export default DashboardPage;
