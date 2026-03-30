import { Component } from "@geajs/core";
import { defineLayout, html, type LayoutProps } from "@fiyuu/core/client";

export const layout = defineLayout({ name: "root" });

const GITHUB_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/></svg>`;

const LOGO_DARK = `<svg width="13" height="13" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" fill="white"/><rect x="7" y="1" width="4" height="4" fill="white" opacity=".6"/><rect x="1" y="7" width="4" height="4" fill="white" opacity=".6"/><rect x="7" y="7" width="4" height="4" fill="white" opacity=".3"/></svg>`;
const LOGO_LIGHT = `<svg width="13" height="13" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" fill="#18181b"/><rect x="7" y="1" width="4" height="4" fill="#18181b" opacity=".6"/><rect x="1" y="7" width="4" height="4" fill="#18181b" opacity=".6"/><rect x="7" y="7" width="4" height="4" fill="#18181b" opacity=".3"/></svg>`;

export default class RootLayout extends Component<LayoutProps> {
  template({ children, route }: LayoutProps = this.props) {
    const isActive = (path: string) =>
      route === path || (path !== "/" && route.startsWith(path));

    const navLink = (href: string, label: string) => {
      const active = isActive(href);
      return `<a href="${href}" style="padding:0.375rem 0.75rem;font-size:0.8125rem;text-decoration:none;transition:color 0.12s;color:${active ? "#18181b" : "#71717a"};font-weight:${active ? "600" : "400"}">${label}</a>`;
    };

    const year = new Date().getFullYear();

    return html`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        body { margin: 0; }
        #nav-auth a, #nav-auth button { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      </style>

      <div style="min-height:100vh;background:white;color:#18181b;font-family:'Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased">

        <!-- ── Navigation ───────────────────────────────────────────── -->
        <header style="position:sticky;top:0;z-index:50;border-bottom:1px solid #e4e4e7;background:rgba(255,255,255,0.97);backdrop-filter:blur(8px)">
          <div style="max-width:72rem;margin:0 auto;padding:0 1.5rem;height:3.5rem;display:flex;align-items:center;justify-content:space-between">

            <a href="/" style="display:flex;align-items:center;gap:0.625rem;text-decoration:none;color:#18181b;transition:opacity 0.12s" onmouseover="this.style.opacity='0.65'" onmouseout="this.style.opacity='1'">
              <div style="width:1.75rem;height:1.75rem;background:#18181b;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                ${LOGO_DARK}
              </div>
              <span style="font-weight:600;font-size:0.875rem;letter-spacing:-0.02em">Fiyuu</span>
              <span style="font-size:0.6875rem;color:#a1a1aa;border:1px solid #e4e4e7;padding:0.125rem 0.375rem;font-family:monospace">v0.2</span>
            </a>

            <nav style="display:flex;align-items:center">
              ${navLink("/", "Home")}
              ${navLink("/docs", "Docs")}
              ${navLink("/changelog", "Changelog")}
              <span id="nav-auth" style="display:flex;align-items:center;gap:0.25rem;margin-left:0.75rem"></span>
            </nav>

          </div>
        </header>

        <div id="page-content">${children}</div>

        <!-- ── Footer ───────────────────────────────────────────────── -->
        <footer style="border-top:1px solid #e4e4e7;background:#09090b;color:#71717a">
          <div style="max-width:72rem;margin:0 auto;padding:3.5rem 1.5rem">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;padding-bottom:3rem;border-bottom:1px solid #27272a">

              <!-- Brand -->
              <div>
                <a href="/" style="display:inline-flex;align-items:center;gap:0.625rem;text-decoration:none;margin-bottom:1rem">
                  <div style="width:1.75rem;height:1.75rem;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    ${LOGO_LIGHT}
                  </div>
                  <span style="font-weight:600;font-size:0.875rem;color:white;letter-spacing:-0.02em">Fiyuu</span>
                </a>
                <p style="font-size:0.8125rem;color:#52525b;line-height:1.7;max-width:22rem">
                  AI-first fullstack TypeScript framework built on GEA. Route contracts, F1 database, zero build step.
                </p>
              </div>

              <!-- Product -->
              <div>
                <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem">Product</p>
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">
                  <li><a href="/" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Home</a></li>
                  <li><a href="/docs" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Documentation</a></li>
                  <li><a href="/changelog" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Changelog</a></li>
                  <li><a href="/docs/getting-started" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Quick Start</a></li>
                </ul>
              </div>

              <!-- Resources -->
              <div>
                <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem">Resources</p>
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">
                  <li><a href="/docs/route-contracts" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Route Contracts</a></li>
                  <li><a href="/docs/gea-components" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">GEA Components</a></li>
                  <li><a href="/docs/f1-database" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">F1 Database</a></li>
                  <li><a href="/docs/cli-reference" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">CLI Reference</a></li>
                </ul>
              </div>

              <!-- Community -->
              <div>
                <p style="font-size:0.6875rem;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem">Community</p>
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">
                  <li>
                    <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noopener" style="font-size:0.8125rem;color:#71717a;text-decoration:none;display:flex;align-items:center;gap:0.375rem;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">
                      ${GITHUB_ICON} GitHub
                    </a>
                  </li>
                  <li><a href="https://github.com/hacimertgokhan/fiyuu/issues" target="_blank" rel="noopener" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Issues</a></li>
                  <li><a href="https://github.com/hacimertgokhan/fiyuu/discussions" target="_blank" rel="noopener" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Discussions</a></li>
                  <li><a href="https://github.com/hacimertgokhan/fiyuu/releases" target="_blank" rel="noopener" style="font-size:0.8125rem;color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#71717a'">Releases</a></li>
                </ul>
              </div>

            </div>

            <div style="padding-top:1.75rem;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:0.75rem;color:#3f3f46">&copy; ${year} Fiyuu. Open source under the MIT License.</span>
              <a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noopener" style="font-size:0.75rem;color:#3f3f46;text-decoration:none;font-family:monospace;transition:color 0.12s" onmouseover="this.style.color='#71717a'" onmouseout="this.style.color='#3f3f46'">hacimertgokhan/fiyuu</a>
            </div>
          </div>
        </footer>

      </div>

      <!-- ── Client: auth-aware nav ─────────────────────────────────── -->
      <script type="module">
        (function () {
          const session = (() => {
            const m = document.cookie.match(/(?:^|;\s*)fiyuu_session=([^;]+)/);
            return m ? m[1].trim() : null;
          })();
          const nav = document.getElementById('nav-auth');
          if (!nav) return;
          const base = 'display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.75rem;font-size:0.8125rem;text-decoration:none;font-family:Inter,system-ui,sans-serif;transition:background 0.12s,color 0.12s;cursor:pointer;border:none;';
          if (session) {
            nav.innerHTML = \`
              <a href="/dashboard" style="\${base}color:#71717a;background:transparent">Dashboard</a>
              <button id="btn-logout" style="\${base}background:#18181b;color:white;font-weight:500">Sign out</button>
            \`;
            document.getElementById('btn-logout')?.addEventListener('click', async () => {
              await fiyuu.action('/auth', { kind: 'logout', sessionId: session });
              document.cookie = 'fiyuu_session=; path=/; max-age=0';
              window.location.href = '/';
            });
          } else {
            nav.innerHTML = \`<a href="https://github.com/hacimertgokhan/fiyuu" target="_blank" rel="noopener" style="\${base}background:#18181b;color:white;font-weight:500;gap:0.375rem">${GITHUB_ICON}GitHub</a>\`;
          }
        })();
      </script>
    `;
  }
}
