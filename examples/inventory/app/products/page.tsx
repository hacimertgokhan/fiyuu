import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import type { query } from "./query.js";
import { For, If, scopedStyles } from "../../lib/pure-framework.js";
import { defaultUnit, formatMoney } from "../../lib/inventory-flat-store.js";

type ProductsData = InferQueryOutput<typeof query>;
type ProductItem = ProductsData["products"][number];

export const page = definePage({ intent: "Products listing with add/edit controls" });

const productsStyles = scopedStyles("products-page", `
  :scope .add-form {
    display: none;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  :scope .add-form.show {
    display: block;
  }

  :scope .form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 768px) {
    :scope .form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  :scope .form-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.375rem;
  }

  :scope .form-input {
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

  :scope .form-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  :scope .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
    justify-content: flex-end;
  }
`);

function stockBadge(product: ProductItem): string {
  let badgeClass = "badge badge-success";

  if (product.quantity === 0) {
    badgeClass = "badge badge-danger";
  } else if (product.quantity <= product.minStock) {
    badgeClass = "badge badge-warning";
  }

  return html`<span class="${badgeClass}">${product.quantity} ${product.unit}</span>`;
}

function productRow(product: ProductItem): string {
  return html`
    <tr data-fiyuu-debug-tag="products-row">
      <td style="font-weight:600;color:var(--text-primary);">${product.name}</td>
      <td><code style="font-size:0.75rem;background:var(--bg-primary);padding:2px 6px;border-radius:4px;">${product.sku}</code></td>
      <td>${product.category}</td>
      <td style="font-weight:500;">${formatMoney(product.price)}</td>
      <td>${stockBadge(product)}</td>
      <td>
        <div style="display:flex;gap:0.5rem;">
          <button class="btn btn-ghost btn-sm" onclick="editProduct('${product.id}')">Duzenle</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.id}')">Sil</button>
        </div>
      </td>
    </tr>
  `;
}

export default class ProductsPage extends Component<PageProps<ProductsData>> {
  template({ data }: PageProps<ProductsData> = this.props) {
    const products = data?.products ?? [];
    const categories = data?.categories ?? [];

    return html`
      ${productsStyles.style}

      <div class="${productsStyles.scopeClass}" data-fiyuu-debug-tag="products-page">
        <div class="page-header animate-fade-in">
          <div>
            <h1 class="page-title">Urunler</h1>
            <p class="page-subtitle">${products.length} urun listeleniyor</p>
            ${If({
              condition: categories.length > 0,
              then: () => html`<p class="page-subtitle" style="margin-top:0.5rem;">Kategoriler: ${categories.join(", ")}</p>`,
            })}
          </div>
          <button class="btn btn-primary" onclick="toggleForm()">+ Yeni Urun</button>
        </div>

        <div id="add-form" class="add-form animate-slide-up" data-fiyuu-debug-tag="add-form">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Yeni Urun Ekle</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Urun Adi</label>
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
            <button class="btn btn-ghost" onclick="toggleForm()">Iptal</button>
            <button class="btn btn-primary" id="save-btn" onclick="saveProduct()">Kaydet</button>
          </div>
        </div>

        <div class="card animate-slide-up" style="animation-delay:100ms;animation-fill-mode:both;" data-fiyuu-debug-tag="products-table">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Urun</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Islemler</th>
                </tr>
              </thead>
              <tbody>
                ${For({
                  each: products,
                  render: (product) => productRow(product),
                  empty: () => html`<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Henuz urun yok</td></tr>`,
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script>
        (function() {
          var listeners = [];
          var state = {
            formOpen: false,
            saving: false,
          };

          function notify() {
            for (var i = 0; i < listeners.length; i += 1) {
              listeners[i](state);
            }
          }

          var store = {
            get: function() {
              return state;
            },
            patch: function(next) {
              state = Object.assign({}, state, next);
              notify();
            },
            subscribe: function(listener) {
              listeners.push(listener);
              return function() {
                listeners = listeners.filter(function(item) {
                  return item !== listener;
                });
              };
            },
          };

          function formElement() {
            return document.getElementById("add-form");
          }

          function saveButton() {
            return document.getElementById("save-btn");
          }

          function render(next) {
            var form = formElement();
            var saveBtn = saveButton();
            if (form) {
              form.classList.toggle("show", Boolean(next.formOpen));
            }
            if (saveBtn) {
              saveBtn.disabled = Boolean(next.saving);
            }
          }

          store.subscribe(render);
          render(store.get());

          function readValue(id) {
            var input = document.getElementById(id);
            if (!input) return "";
            return input.value;
          }

          function parseNumber(id, fallback) {
            var parsed = Number(readValue(id));
            if (Number.isFinite(parsed)) {
              return parsed;
            }
            return fallback;
          }

          async function refreshPage() {
            var nonce = Date.now();
            await fiyuu.router.navigate("/products?refresh=" + nonce);
          }

          window.toggleForm = function toggleForm() {
            var current = store.get();
            store.patch({ formOpen: !current.formOpen });
          };

          window.saveProduct = async function saveProduct() {
            var name = readValue("f-name");
            if (!name) {
              alert("Urun adi gerekli");
              return;
            }

            var data = {
              action: "add",
              name: name,
              sku: readValue("f-sku"),
              category: readValue("f-category"),
              price: parseNumber("f-price", 0),
              quantity: parseNumber("f-quantity", 0),
              minStock: parseNumber("f-minstock", 5),
              unit: "${defaultUnit()}",
            };

            store.patch({ saving: true });

            try {
              var result = await fiyuu.action("/products", data);
              if (result && result.success) {
                await refreshPage();
                return;
              }
              alert("Kayit basarisiz oldu");
            } catch (error) {
              console.error(error);
              alert("Hata olustu");
            } finally {
              store.patch({ saving: false, formOpen: false });
            }
          };

          window.editProduct = async function editProduct(id) {
            var qty = prompt("Yeni stok adedi:");
            if (qty === null) {
              return;
            }

            var quantity = Number(qty);
            if (!Number.isFinite(quantity)) {
              alert("Gecerli bir sayi gir");
              return;
            }

            await fiyuu.action("/products", {
              action: "update",
              id: id,
              quantity: quantity,
            });

            await refreshPage();
          };

          window.deleteProduct = async function deleteProduct(id) {
            if (!confirm("Bu urunu silmek istediginizden emin misiniz?")) {
              return;
            }

            await fiyuu.action("/products", {
              action: "update",
              id: id,
              quantity: 0,
            });

            await refreshPage();
          };
        })();
      </script>
    `;
  }
}
