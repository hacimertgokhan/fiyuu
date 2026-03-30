import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

export default class RootLayout extends Component<LayoutProps> {
  template({ children }: LayoutProps = this.props) {
    return html`
      <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

        @layer base {
          :root {
            --font-sans: "Inter", system-ui, sans-serif;
            --bg-primary: #F8FAFC;
            --bg-card: #FFFFFF;
            --bg-sidebar: #0F172A;
            --border: #E2E8F0;
            --text-primary: #0F172A;
            --text-secondary: #475569;
            --text-muted: #94A3B8;
            --text-sidebar: #CBD5E1;
            --accent: #2563EB;
            --accent-hover: #1D4ED8;
            --success: #16A34A;
            --success-bg: #F0FDF4;
            --warning: #F59E0B;
            --warning-bg: #FFFBEB;
            --danger: #DC2626;
            --danger-bg: #FEF2F2;
            --info: #0EA5E9;
            --info-bg: #F0F9FF;
          }
        }

        * { box-sizing: border-box; padding: 0; margin: 0; }
        body {
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }
        ::selection { background: rgba(37,99,235,0.2); }
        a, button, input, select { transition: all 0.15s ease; }

        .app-layout { display: flex; min-height: 100vh; }
        .sidebar {
          width: 240px;
          background: var(--bg-sidebar);
          color: var(--text-sidebar);
          padding: 1.5rem 0;
          flex-shrink: 0;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 100;
        }
        .sidebar-logo {
          padding: 0 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .sidebar-logo-icon {
          width: 32px;
          height: 32px;
          background: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
        }
        .sidebar-logo-text {
          font-weight: 700;
          font-size: 1rem;
          color: white;
        }
        .sidebar-section {
          padding: 0.75rem 1.25rem 0.375rem;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 1.25rem;
          color: var(--text-sidebar);
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 500;
          border-left: 3px solid transparent;
        }
        .sidebar-link:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
        .sidebar-link.active {
          background: rgba(37,99,235,0.15);
          color: white;
          border-left-color: var(--accent);
        }
        .sidebar-badge {
          margin-left: auto;
          background: var(--danger);
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.375rem;
          border-radius: 999px;
        }

        .main-content {
          flex: 1;
          margin-left: 240px;
          padding: 1.5rem 2rem;
          min-height: 100vh;
        }
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .page-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: var(--font-sans);
        }
        .btn-primary { background: var(--accent); color: white; }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-success { background: var(--success); color: white; }
        .btn-danger { background: var(--danger); color: white; }
        .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
        }
        .stat-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-top: 0.375rem; }
        .stat-change { font-size: 0.75rem; font-weight: 600; margin-top: 0.25rem; }
        .stat-change.up { color: var(--success); }
        .stat-change.down { color: var(--danger); }

        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          background: var(--bg-primary);
        }
        td {
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
        }
        tr:hover td { background: var(--bg-primary); }

        .badge {
          display: inline-flex;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 600;
        }
        .badge-success { background: var(--success-bg); color: var(--success); }
        .badge-warning { background: var(--warning-bg); color: var(--warning); }
        .badge-danger { background: var(--danger-bg); color: var(--danger); }
        .badge-info { background: var(--info-bg); color: var(--info); }

        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-up { animation: slideUp 0.3s ease-out both; }
      </style>

      <div class="app-layout">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <div class="sidebar-logo-icon">Fi</div>
            <span class="sidebar-logo-text">Fiyuu Inventory</span>
          </div>

          <div class="sidebar-section">Ana Menü</div>
          <a href="/" class="sidebar-link active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a href="/products" class="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>
            Ürünler
          </a>
          <a href="/reports" class="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
            Raporlar
          </a>

          <div class="sidebar-section" style="margin-top:1.5rem;">Sistem</div>
          <a href="#" class="sidebar-link" id="sidebar-theme-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
            Tema
          </a>
        </aside>

        <main class="main-content">
          ${children}
        </main>
      </div>

      <script>
        (function() {
          // Real-time alerts
          var alerts = fiyuu.channel("inventory-alerts");
          alerts.on("low-stock", function(data) {
            console.log("[ALERT] Low stock:", data.product, "- Current:", data.quantity);
          });
        })();
      </script>
    `;
  }
}
