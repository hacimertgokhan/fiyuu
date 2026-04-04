import { Component } from "@geajs/core";
import { definePage, html, type PageProps, type InferQueryOutput } from "@fiyuu/core/client";
import { timeAgo } from "../../lib/ui.js";
import type { query } from "./query.js";

type DashboardData = InferQueryOutput<typeof query>;
type Doc = DashboardData["docs"][number];
type ChangelogEntry = DashboardData["changelog"][number];

export const page = definePage({ intent: "Dashboard — manage docs and changelog entries" });

const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  "core-concepts": "Core Concepts",
  reference: "Reference",
};

const INPUT_S = "width:100%;border:1px solid #e4e4e7;background:white;padding:0.5rem 0.75rem;font-size:0.8125rem;font-family:inherit;color:#18181b;outline:none;box-sizing:border-box;transition:border-color 0.12s";
const LABEL_S = "display:block;font-size:0.75rem;font-weight:500;color:#52525b;margin-bottom:0.375rem";

export default class DashboardPage extends Component<PageProps<DashboardData>> {
  template({ data }: PageProps<DashboardData> = this.props) {
    const docs = data?.docs ?? [];
    const changelog = data?.changelog ?? [];
    const user = data?.user;
    const stats = data?.stats ?? { total: 0, published: 0, drafts: 0, changelogEntries: 0 };

    const docRow = (doc: Doc) => `
      <tr id="row-${doc.id}" style="border-bottom:1px solid #f4f4f5;transition:background 0.1s" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
        <td style="padding:0.875rem 1.25rem">
          <div style="font-size:0.875rem;font-weight:500;color:#18181b;margin-bottom:0.125rem">${doc.title}</div>
          <div style="font-size:0.75rem;color:#a1a1aa;font-family:monospace">/docs/${doc.slug}</div>
        </td>
        <td style="padding:0.875rem 1rem;font-size:0.75rem;color:#71717a;white-space:nowrap">${CATEGORY_LABELS[doc.category] ?? doc.category}</td>
        <td style="padding:0.875rem 1rem">
          <span style="font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:0.2em 0.625em;border:1px solid ${doc.published ? "#bbf7d0" : "#e4e4e7"};color:${doc.published ? "#16a34a" : "#71717a"};background:${doc.published ? "#f0fdf4" : "#fafafa"}">
            ${doc.published ? "Published" : "Draft"}
          </span>
        </td>
        <td style="padding:0.875rem 1rem;font-size:0.75rem;color:#a1a1aa;white-space:nowrap">${timeAgo(doc.updatedAt)}</td>
        <td style="padding:0.875rem 1.25rem;text-align:right">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:0.5rem">
            <a href="/docs/${doc.slug}" target="_blank"
              style="padding:0.3rem 0.625rem;font-size:0.75rem;font-weight:500;color:#52525b;border:1px solid #e4e4e7;text-decoration:none;transition:border-color 0.1s"
              onmouseover="this.style.borderColor='#a1a1aa'" onmouseout="this.style.borderColor='#e4e4e7'">View</a>
            <button onclick="toggleDoc('${doc.id}')"
              style="padding:0.3rem 0.625rem;font-size:0.75rem;font-weight:500;color:#52525b;border:1px solid #e4e4e7;background:white;cursor:pointer;font-family:inherit;transition:border-color 0.1s"
              onmouseover="this.style.borderColor='#a1a1aa'" onmouseout="this.style.borderColor='#e4e4e7'">${doc.published ? "Unpublish" : "Publish"}</button>
            <button onclick="deleteDoc('${doc.id}', '${doc.title}')"
              style="padding:0.3rem 0.625rem;font-size:0.75rem;font-weight:500;color:#dc2626;border:1px solid #fecaca;background:white;cursor:pointer;font-family:inherit;transition:border-color 0.1s"
              onmouseover="this.style.borderColor='#f87171'" onmouseout="this.style.borderColor='#fecaca'">Delete</button>
          </div>
        </td>
      </tr>
    `;

    const clRow = (entry: ChangelogEntry) => `
      <tr id="cl-row-${entry.id}" style="border-bottom:1px solid #f4f4f5;transition:background 0.1s" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='white'">
        <td style="padding:0.875rem 1.25rem;display:flex;align-items:center;gap:0.75rem">
          <span style="font-family:monospace;font-size:0.6875rem;font-weight:700;background:#09090b;color:white;padding:0.25rem 0.5rem;white-space:nowrap">v${entry.version}</span>
          <span style="font-size:0.875rem;font-weight:500;color:#18181b">${entry.title}</span>
        </td>
        <td style="padding:0.875rem 1rem;font-size:0.75rem;color:#a1a1aa;white-space:nowrap">${timeAgo(entry.createdAt)}</td>
        <td style="padding:0.875rem 1.25rem;text-align:right">
          <button onclick="deleteChangelog('${entry.id}', '${entry.version}')"
            style="padding:0.3rem 0.625rem;font-size:0.75rem;font-weight:500;color:#dc2626;border:1px solid #fecaca;background:white;cursor:pointer;font-family:inherit;transition:border-color 0.1s"
            onmouseover="this.style.borderColor='#f87171'" onmouseout="this.style.borderColor='#fecaca'">Delete</button>
        </td>
      </tr>
    `;

    return html`
      <style>
        .fy-input-dash:focus { border-color: #18181b !important; }
        .fy-input-dash::placeholder { color: #a1a1aa; }
      </style>

      <main style="font-family:'Inter',system-ui,-apple-system,sans-serif;background:#fafafa;min-height:calc(100vh - 3.5rem)">
        <div style="max-width:72rem;margin:0 auto;padding:2.5rem 1.5rem">

          <!-- ── Header ──────────────────────────────────────────── -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid #e4e4e7">
            <div>
              <h1 style="font-size:1.25rem;font-weight:700;color:#18181b;letter-spacing:-0.025em;margin:0 0 0.25rem">Dashboard</h1>
              <p style="font-size:0.8125rem;color:#a1a1aa;margin:0">
                ${user?.name ?? "—"} · <span style="font-family:monospace">${user?.email ?? ""}</span>
                <span style="margin-left:0.5rem;font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${user?.role === "admin" ? "#16a34a" : "#71717a"};border:1px solid ${user?.role === "admin" ? "#bbf7d0" : "#e4e4e7"};padding:0.1em 0.4em">${user?.role ?? ""}</span>
              </p>
            </div>
            <button onclick="document.getElementById('modal-new-doc').style.display='flex'"
              style="display:inline-flex;align-items:center;gap:0.5rem;background:#09090b;color:white;padding:0.625rem 1.125rem;font-size:0.8125rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:background 0.12s"
              onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='#09090b'">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
              New doc
            </button>
          </div>

          <!-- ── Stats ───────────────────────────────────────────── -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e4e4e7;margin-bottom:2rem">
            <div style="background:white;padding:1.25rem 1.5rem">
              <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;margin:0 0 0.375rem">Total docs</p>
              <p style="font-size:2rem;font-weight:800;color:#18181b;letter-spacing:-0.04em;margin:0;font-variant-numeric:tabular-nums">${stats.total}</p>
            </div>
            <div style="background:white;padding:1.25rem 1.5rem">
              <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;margin:0 0 0.375rem">Published</p>
              <p style="font-size:2rem;font-weight:800;color:#16a34a;letter-spacing:-0.04em;margin:0;font-variant-numeric:tabular-nums">${stats.published}</p>
            </div>
            <div style="background:white;padding:1.25rem 1.5rem">
              <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;margin:0 0 0.375rem">Drafts</p>
              <p style="font-size:2rem;font-weight:800;color:#d97706;letter-spacing:-0.04em;margin:0;font-variant-numeric:tabular-nums">${stats.drafts}</p>
            </div>
            <div style="background:white;padding:1.25rem 1.5rem">
              <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;margin:0 0 0.375rem">Changelog</p>
              <p style="font-size:2rem;font-weight:800;color:#6366f1;letter-spacing:-0.04em;margin:0;font-variant-numeric:tabular-nums">${stats.changelogEntries}</p>
            </div>
          </div>

          <!-- ── Alert ───────────────────────────────────────────── -->
          <div id="dashboard-alert" style="margin-bottom:1rem"></div>

          <!-- ── Docs table ─────────────────────────────────────── -->
          <div style="border:1px solid #e4e4e7;background:white;overflow:hidden;margin-bottom:1.5rem">
            <div style="padding:1rem 1.25rem;border-bottom:1px solid #f4f4f5;display:flex;align-items:center;justify-content:space-between;background:#fafafa">
              <h2 style="font-size:0.875rem;font-weight:600;color:#18181b;margin:0">Documentation</h2>
              <span style="font-size:0.75rem;color:#a1a1aa;font-family:monospace">${stats.total} doc${stats.total !== 1 ? "s" : ""}</span>
            </div>
            ${docs.length > 0
              ? `<table style="width:100%;border-collapse:collapse"><tbody>${docs.map(docRow).join("")}</tbody></table>`
              : `<div style="padding:3rem;text-align:center;font-size:0.875rem;color:#a1a1aa">No docs yet — create your first one.</div>`}
          </div>

          <!-- ── Changelog table ────────────────────────────────── -->
          <div style="border:1px solid #e4e4e7;background:white;overflow:hidden">
            <div style="padding:1rem 1.25rem;border-bottom:1px solid #f4f4f5;display:flex;align-items:center;justify-content:space-between;background:#fafafa">
              <h2 style="font-size:0.875rem;font-weight:600;color:#18181b;margin:0">Changelog</h2>
              <button onclick="document.getElementById('modal-new-changelog').style.display='flex'"
                style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.3rem 0.75rem;font-size:0.75rem;font-weight:500;color:#52525b;border:1px solid #e4e4e7;background:white;cursor:pointer;font-family:inherit;transition:border-color 0.1s"
                onmouseover="this.style.borderColor='#a1a1aa'" onmouseout="this.style.borderColor='#e4e4e7'">
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                Add entry
              </button>
            </div>
            ${changelog.length > 0
              ? `<table style="width:100%;border-collapse:collapse"><tbody>${changelog.map(clRow).join("")}</tbody></table>`
              : `<div style="padding:3rem;text-align:center;font-size:0.875rem;color:#a1a1aa">No changelog entries yet.</div>`}
          </div>

        </div>
      </main>

      <!-- ── New doc modal ───────────────────────────────────────── -->
      <div id="modal-new-doc" style="display:none;position:fixed;inset:0;z-index:50;align-items:center;justify-content:center;padding:1rem"
        onclick="if(event.target===this)closeModal('modal-new-doc')">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4)"></div>
        <div style="position:relative;width:100%;max-width:32rem;background:white;border:1px solid #e4e4e7;z-index:10;max-height:90vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #f4f4f5;background:#fafafa">
            <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0">New doc</h3>
            <button onclick="closeModal('modal-new-doc')" style="width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;border:1px solid #e4e4e7;background:white;cursor:pointer;color:#71717a;transition:border-color 0.1s" onmouseover="this.style.borderColor='#a1a1aa'" onmouseout="this.style.borderColor='#e4e4e7'">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem">
            <div id="doc-modal-alert"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem">
              <div>
                <label style="${LABEL_S}">Title</label>
                <input id="doc-title" placeholder="Getting Started" class="fy-input-dash" style="${INPUT_S}"/>
              </div>
              <div>
                <label style="${LABEL_S}">Slug</label>
                <input id="doc-slug" placeholder="getting-started" class="fy-input-dash" style="${INPUT_S};font-family:monospace"/>
              </div>
            </div>
            <div>
              <label style="${LABEL_S}">Category</label>
              <select id="doc-category" style="${INPUT_S}">
                <option value="getting-started">Getting Started</option>
                <option value="core-concepts">Core Concepts</option>
                <option value="reference">Reference</option>
              </select>
            </div>
            <div>
              <label style="${LABEL_S}">Excerpt</label>
              <textarea id="doc-excerpt" rows="2" placeholder="Short description…" class="fy-input-dash" style="${INPUT_S};resize:none"></textarea>
            </div>
            <div>
              <label style="${LABEL_S}">Content</label>
              <textarea id="doc-content" rows="7" placeholder="Write the doc content here (supports markdown-lite: ## h2, - list, \`\`\`code)…" class="fy-input-dash" style="${INPUT_S};resize:vertical;font-family:monospace"></textarea>
            </div>
          </div>
          <div style="padding:1rem 1.25rem;border-top:1px solid #f4f4f5;display:flex;align-items:center;justify-content:flex-end;gap:0.625rem;background:#fafafa">
            <button onclick="closeModal('modal-new-doc')" style="padding:0.5rem 1rem;font-size:0.8125rem;font-weight:500;color:#52525b;border:1px solid #e4e4e7;background:white;cursor:pointer;font-family:inherit">Cancel</button>
            <button id="btn-create-doc" onclick="createDoc()" style="padding:0.5rem 1rem;font-size:0.8125rem;font-weight:600;color:white;background:#09090b;border:none;cursor:pointer;font-family:inherit">Save as draft</button>
          </div>
        </div>
      </div>

      <!-- ── New changelog modal ────────────────────────────────── -->
      <div id="modal-new-changelog" style="display:none;position:fixed;inset:0;z-index:50;align-items:center;justify-content:center;padding:1rem"
        onclick="if(event.target===this)closeModal('modal-new-changelog')">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4)"></div>
        <div style="position:relative;width:100%;max-width:32rem;background:white;border:1px solid #e4e4e7;z-index:10">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #f4f4f5;background:#fafafa">
            <h3 style="font-size:0.9375rem;font-weight:600;color:#18181b;margin:0">New changelog entry</h3>
            <button onclick="closeModal('modal-new-changelog')" style="width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;border:1px solid #e4e4e7;background:white;cursor:pointer;color:#71717a">
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem">
            <div id="cl-modal-alert"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem">
              <div>
                <label style="${LABEL_S}">Version</label>
                <input id="cl-version" placeholder="0.3.0" class="fy-input-dash" style="${INPUT_S};font-family:monospace"/>
              </div>
              <div>
                <label style="${LABEL_S}">Title</label>
                <input id="cl-title" placeholder="Performance improvements" class="fy-input-dash" style="${INPUT_S}"/>
              </div>
            </div>
            <div>
              <label style="${LABEL_S}">Release notes</label>
              <textarea id="cl-content" rows="5" placeholder="- Added feature X&#10;- Fixed bug Y" class="fy-input-dash" style="${INPUT_S};resize:none"></textarea>
            </div>
          </div>
          <div style="padding:1rem 1.25rem;border-top:1px solid #f4f4f5;display:flex;align-items:center;justify-content:flex-end;gap:0.625rem;background:#fafafa">
            <button onclick="closeModal('modal-new-changelog')" style="padding:0.5rem 1rem;font-size:0.8125rem;font-weight:500;color:#52525b;border:1px solid #e4e4e7;background:white;cursor:pointer;font-family:inherit">Cancel</button>
            <button id="btn-create-changelog" onclick="createChangelog()" style="padding:0.5rem 1rem;font-size:0.8125rem;font-weight:600;color:white;background:#09090b;border:none;cursor:pointer;font-family:inherit">Publish entry</button>
          </div>
        </div>
      </div>

      <script type="module">
        function showAlert(id, message, type = 'success') {
          const el = document.getElementById(id);
          if (!el) return;
          if (!message) { el.innerHTML = ''; return; }
          const s = {
            success: 'background:#f0fdf4;border:1px solid #bbf7d0;color:#166534',
            error: 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626',
          };
          el.innerHTML = \`<div style="padding:0.625rem 0.875rem;font-size:0.8125rem;\${s[type]}">\${message}</div>\`;
          if (type === 'success') setTimeout(() => { el.innerHTML = ''; }, 3000);
        }

        window.closeModal = function(id) {
          document.getElementById(id).style.display = 'none';
          showAlert('doc-modal-alert', '');
          showAlert('cl-modal-alert', '');
        };

        window.createDoc = async function() {
          const title = document.getElementById('doc-title').value.trim();
          const slug = document.getElementById('doc-slug').value.trim();
          const excerpt = document.getElementById('doc-excerpt').value.trim();
          const content = document.getElementById('doc-content').value.trim();
          const category = document.getElementById('doc-category').value;
          if (!title || !slug || !excerpt || !content) { showAlert('doc-modal-alert', 'All fields are required.', 'error'); return; }
          const btn = document.getElementById('btn-create-doc');
          btn.disabled = true; btn.textContent = 'Saving…';
          const result = await fiyuu.action('/dashboard', { kind: 'create-doc', title, slug, excerpt, content, category });
          if (result.success) {
            closeModal('modal-new-doc');
            showAlert('dashboard-alert', result.message || 'Doc created!');
            setTimeout(() => window.location.reload(), 800);
          } else {
            showAlert('doc-modal-alert', result.message || 'Failed to create.', 'error');
            btn.disabled = false; btn.textContent = 'Save as draft';
          }
        };

        window.toggleDoc = async function(id) {
          const result = await fiyuu.action('/dashboard', { kind: 'toggle-doc', id });
          showAlert('dashboard-alert', result.message || 'Updated.', result.success ? 'success' : 'error');
          if (result.success) setTimeout(() => window.location.reload(), 600);
        };

        window.deleteDoc = async function(id, title) {
          if (!confirm(\`Delete "\${title}"? This cannot be undone.\`)) return;
          const result = await fiyuu.action('/dashboard', { kind: 'delete-doc', id });
          if (result.success) {
            const row = document.getElementById(\`row-\${id}\`);
            if (row) { row.style.opacity = '0'; row.style.transition = 'opacity 0.2s'; setTimeout(() => row.remove(), 200); }
            showAlert('dashboard-alert', result.message || 'Deleted.');
          } else {
            showAlert('dashboard-alert', result.message || 'Failed.', 'error');
          }
        };

        window.createChangelog = async function() {
          const version = document.getElementById('cl-version').value.trim();
          const title = document.getElementById('cl-title').value.trim();
          const content = document.getElementById('cl-content').value.trim();
          if (!version || !title || !content) { showAlert('cl-modal-alert', 'All fields are required.', 'error'); return; }
          const btn = document.getElementById('btn-create-changelog');
          btn.disabled = true; btn.textContent = 'Publishing…';
          const result = await fiyuu.action('/dashboard', { kind: 'create-changelog', version, title, content });
          if (result.success) {
            closeModal('modal-new-changelog');
            showAlert('dashboard-alert', result.message || 'Entry created!');
            setTimeout(() => window.location.reload(), 800);
          } else {
            showAlert('cl-modal-alert', result.message || 'Failed.', 'error');
            btn.disabled = false; btn.textContent = 'Publish entry';
          }
        };

        window.deleteChangelog = async function(id, version) {
          if (!confirm(\`Delete changelog v\${version}? This cannot be undone.\`)) return;
          const result = await fiyuu.action('/dashboard', { kind: 'delete-changelog', id });
          if (result.success) {
            const row = document.getElementById(\`cl-row-\${id}\`);
            if (row) { row.style.opacity = '0'; row.style.transition = 'opacity 0.2s'; setTimeout(() => row.remove(), 200); }
            showAlert('dashboard-alert', result.message || 'Deleted.');
          } else {
            showAlert('dashboard-alert', result.message || 'Failed.', 'error');
          }
        };

        document.getElementById('doc-title')?.addEventListener('input', (e) => {
          const slugEl = document.getElementById('doc-slug');
          if (!slugEl.dataset.manuallyEdited) {
            slugEl.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          }
        });
        document.getElementById('doc-slug')?.addEventListener('input', (e) => {
          e.target.dataset.manuallyEdited = '1';
        });
      </script>
    `;
  }
}
