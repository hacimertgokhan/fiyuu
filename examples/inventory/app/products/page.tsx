import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";

type ProductsData = InferQueryOutput<typeof query>;

export const page = definePage({ intent: "Products listing with add form" });

export default class ProductsPage extends Component<PageProps<ProductsData>> {
  template({ data }: PageProps<ProductsData> = this.props) {
    const products = data?.products ?? [];
    const categories = data?.categories ?? [];

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

    const rowsHtml = products
      .map(
        (p: { id: string; name: string; sku: string; category: string; price: number; quantity: number; minStock: number; unit: string }) => html`
          <tr>
            <td style="font-weight:600;color:var(--text-primary);">${escapeHtml(p.name)}</td>
            <td><code style="font-size:0.75rem;background:var(--bg-primary);padding:2px 6px;border-radius:4px;">${escapeHtml(p.sku)}</code></td>
            <td>${escapeHtml(p.category)}</td>
            <td style="font-weight:500;">${formatCurrency(p.price)}</td>
            <td>
              <span class="badge ${p.quantity === 0 ? "badge-danger" : p.quantity <= p.minStock ? "badge-warning" : "badge-success"}">
                ${p.quantity} ${escapeHtml(p.unit)}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:0.5rem;">
                <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')">Düzenle</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Sil</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("");

    return html`
      <style>
        .add-form {
          display: none;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .add-form.show { display: block; }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.375rem;
        }
        .form-input {
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: var(--font-sans);
          outline: none;
        }
        .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          justify-content: flex-end;
        }
      </style>

      <div class="page-header animate-fade-in">
        <div>
          <h1 class="page-title">Ürünler</h1>
          <p class="page-subtitle">${products.length} ürün listeleniyor</p>
        </div>
        <button class="btn btn-primary" onclick="toggleForm()">
          + Yeni Ürün
        </button>
      </div>

      <!-- Add Form -->
      <div id="add-form" class="add-form animate-slide-up">
        <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Yeni Ürün Ekle</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Ürün Adı</label>
            <input type="text" id="f-name" class="form-input" placeholder="MacBook Pro 16\"" />
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input type="text" id="f-sku" class="form-input" placeholder="MBP-16-001" />
          </div>
          <div class="form-group">
            <label>Kategori</label>
            <input type="text" id="f-category" class="form-input" placeholder="Electronics" />
          </div>
          <div class="form-group">
            <label>Fiyat (TL)</label>
            <input type="number" id="f-price" class="form-input" placeholder="49999" />
          </div>
          <div class="form-group">
            <label>Stok Adedi</label>
            <input type="number" id="f-quantity" class="form-input" placeholder="10" />
          </div>
          <div class="form-group">
            <label>Minimum Stok</label>
            <input type="number" id="f-minstock" class="form-input" placeholder="5" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost" onclick="toggleForm()">İptal</button>
          <button class="btn btn-primary" id="save-btn" onclick="saveProduct()">Kaydet</button>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card animate-slide-up" style="animation-delay:100ms;animation-fill-mode:both;">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Fiyat</th>
                <th>Stok</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || html`<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Henüz ürün yok</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <script>
        function toggleForm() {
          document.getElementById("add-form").classList.toggle("show");
        }

        async function saveProduct() {
          var data = {
            action: "add",
            name: document.getElementById("f-name").value,
            sku: document.getElementById("f-sku").value,
            category: document.getElementById("f-category").value,
            price: parseFloat(document.getElementById("f-price").value) || 0,
            quantity: parseInt(document.getElementById("f-quantity").value) || 0,
            minStock: parseInt(document.getElementById("f-minstock").value) || 5,
            unit: "adet",
          };
          if (!data.name) { alert("Ürün adı gerekli"); return; }

          document.getElementById("save-btn").disabled = true;
          try {
            var res = await fiyuu.action("/products", data);
            if (res && res.success) {
              location.reload();
            }
          } catch(e) {
            alert("Hata oluştu");
          } finally {
            document.getElementById("save-btn").disabled = false;
          }
        }

        async function editProduct(id) {
          // Simple edit: update quantity
          var qty = prompt("Yeni stok adedi:");
          if (qty === null) return;
          await fiyuu.action("/products", {
            action: "update",
            id: id,
            quantity: parseInt(qty) || 0,
          });
          location.reload();
        }

        async function deleteProduct(id) {
          if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
          await fiyuu.action("/products", { action: "update", id: id, quantity: 0 });
          location.reload();
        }
      </script>
    `;
  }
}
