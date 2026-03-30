import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Sign in or create a new account" });

const INPUT_STYLE = "width:100%;border:1px solid #e4e4e7;background:white;padding:0.625rem 0.875rem;font-size:0.875rem;font-family:inherit;color:#18181b;outline:none;box-sizing:border-box;transition:border-color 0.12s";
const LABEL_STYLE = "display:block;font-size:0.8125rem;font-weight:500;color:#3f3f46;margin-bottom:0.5rem";

export default class AuthPage extends Component<PageProps<null>> {
  template({ route }: PageProps<null> = this.props) {
    return html`
      <style>
        .fy-input:focus { border-color: #18181b !important; }
        .fy-input::placeholder { color: #a1a1aa; }
      </style>

      <main style="font-family:'Inter',system-ui,-apple-system,sans-serif;min-height:calc(100vh - 3.5rem);display:flex;align-items:center;justify-content:center;padding:3rem 1.5rem;background:#fafafa">

        <div style="width:100%;max-width:26rem">

          <!-- Logo mark -->
          <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:2.5rem;justify-content:center">
            <div style="width:1.75rem;height:1.75rem;background:#18181b;display:flex;align-items:center;justify-content:center">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="4" height="4" fill="white"/>
                <rect x="7" y="1" width="4" height="4" fill="white" opacity=".6"/>
                <rect x="1" y="7" width="4" height="4" fill="white" opacity=".6"/>
                <rect x="7" y="7" width="4" height="4" fill="white" opacity=".3"/>
              </svg>
            </div>
            <span style="font-weight:700;font-size:1rem;letter-spacing:-0.03em;color:#18181b">Fiyuu</span>
          </div>

          <!-- Card -->
          <div style="border:1px solid #e4e4e7;background:white;overflow:hidden">

            <!-- Tabs -->
            <div style="display:flex;border-bottom:1px solid #e4e4e7">
              <button id="tab-login" onclick="switchTab('login')"
                style="flex:1;padding:1rem;font-size:0.875rem;font-weight:600;color:#18181b;background:white;border:none;border-bottom:2px solid #18181b;cursor:pointer;font-family:inherit;transition:color 0.12s">
                Sign in
              </button>
              <button id="tab-register" onclick="switchTab('register')"
                style="flex:1;padding:1rem;font-size:0.875rem;font-weight:400;color:#a1a1aa;background:white;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;transition:color 0.12s"
                onmouseover="if(!this.classList.contains('active'))this.style.color='#71717a'"
                onmouseout="if(!this.classList.contains('active'))this.style.color='#a1a1aa'">
                Create account
              </button>
            </div>

            <!-- Login panel -->
            <div id="panel-login" style="padding:1.75rem;display:flex;flex-direction:column;gap:1rem">
              <div>
                <h1 style="font-size:1.125rem;font-weight:700;color:#18181b;letter-spacing:-0.025em;margin:0 0 0.25rem">Welcome back</h1>
                <p style="font-size:0.8125rem;color:#a1a1aa;margin:0">Sign in to access the dashboard.</p>
              </div>

              <div id="login-alert"></div>

              <form id="form-login" style="display:flex;flex-direction:column;gap:0.875rem" onsubmit="return false">
                <div>
                  <label style="${LABEL_STYLE}" for="login-email">Email</label>
                  <input id="login-email" type="email" placeholder="you@example.com" required class="fy-input" style="${INPUT_STYLE}"/>
                </div>
                <div>
                  <label style="${LABEL_STYLE}" for="login-password">Password</label>
                  <input id="login-password" type="password" placeholder="••••••••" required class="fy-input" style="${INPUT_STYLE}"/>
                </div>
                <button id="btn-login" type="button"
                  style="width:100%;padding:0.75rem;background:#18181b;color:white;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;margin-top:0.25rem;transition:background 0.12s"
                  onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='#18181b'">
                  Sign in
                </button>
              </form>

              <!-- Demo credentials -->
              <div style="border:1px solid #f4f4f5;background:#fafafa;padding:0.75rem 1rem">
                <p style="font-size:0.75rem;color:#71717a;margin:0">
                  Demo: <code style="font-family:monospace;background:#f4f4f5;padding:0.1em 0.35em;color:#18181b;border:1px solid #e4e4e7">admin@fiyuu.dev</code>
                  &nbsp;/&nbsp;
                  <code style="font-family:monospace;background:#f4f4f5;padding:0.1em 0.35em;color:#18181b;border:1px solid #e4e4e7">fiyuu123</code>
                </p>
              </div>
            </div>

            <!-- Register panel -->
            <div id="panel-register" style="padding:1.75rem;display:none;flex-direction:column;gap:1rem">
              <div>
                <h1 style="font-size:1.125rem;font-weight:700;color:#18181b;letter-spacing:-0.025em;margin:0 0 0.25rem">Create an account</h1>
                <p style="font-size:0.8125rem;color:#a1a1aa;margin:0">Join to start managing docs and changelogs.</p>
              </div>

              <div id="register-alert"></div>

              <form id="form-register" style="display:flex;flex-direction:column;gap:0.875rem" onsubmit="return false">
                <div>
                  <label style="${LABEL_STYLE}" for="reg-name">Full name</label>
                  <input id="reg-name" type="text" placeholder="Jane Smith" required class="fy-input" style="${INPUT_STYLE}"/>
                </div>
                <div>
                  <label style="${LABEL_STYLE}" for="reg-email">Email</label>
                  <input id="reg-email" type="email" placeholder="you@example.com" required class="fy-input" style="${INPUT_STYLE}"/>
                </div>
                <div>
                  <label style="${LABEL_STYLE}" for="reg-password">Password</label>
                  <input id="reg-password" type="password" placeholder="Min. 6 characters" required class="fy-input" style="${INPUT_STYLE}"/>
                </div>
                <button id="btn-register" type="button"
                  style="width:100%;padding:0.75rem;background:#18181b;color:white;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;font-family:inherit;margin-top:0.25rem;transition:background 0.12s"
                  onmouseover="this.style.background='#27272a'" onmouseout="this.style.background='#18181b'">
                  Create account
                </button>
              </form>
            </div>

          </div>

          <p style="text-align:center;font-size:0.75rem;color:#a1a1aa;margin-top:1.5rem">
            <a href="/" style="color:#71717a;text-decoration:none;transition:color 0.12s" onmouseover="this.style.color='#18181b'" onmouseout="this.style.color='#71717a'">← Back to home</a>
          </p>

        </div>
      </main>

      <script type="module">
        window.switchTab = function(tab) {
          const isLogin = tab === 'login';
          const panelLogin = document.getElementById('panel-login');
          const panelReg = document.getElementById('panel-register');
          const tabLogin = document.getElementById('tab-login');
          const tabReg = document.getElementById('tab-register');

          panelLogin.style.display = isLogin ? 'flex' : 'none';
          panelReg.style.display = isLogin ? 'none' : 'flex';

          tabLogin.style.fontWeight = isLogin ? '600' : '400';
          tabLogin.style.color = isLogin ? '#18181b' : '#a1a1aa';
          tabLogin.style.borderBottom = isLogin ? '2px solid #18181b' : '2px solid transparent';

          tabReg.style.fontWeight = isLogin ? '400' : '600';
          tabReg.style.color = isLogin ? '#a1a1aa' : '#18181b';
          tabReg.style.borderBottom = isLogin ? '2px solid transparent' : '2px solid #18181b';
        };

        function showAlert(id, message, type = 'error') {
          const el = document.getElementById(id);
          if (!el) return;
          if (!message) { el.innerHTML = ''; return; }
          const styles = {
            error: 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626',
            success: 'background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a',
          };
          el.innerHTML = \`<div style="padding:0.625rem 0.875rem;font-size:0.8125rem;\${styles[type]}">\${message}</div>\`;
        }

        document.getElementById('btn-login')?.addEventListener('click', async () => {
          const email = document.getElementById('login-email').value.trim();
          const password = document.getElementById('login-password').value;
          if (!email || !password) { showAlert('login-alert', 'Please fill in all fields.'); return; }
          const btn = document.getElementById('btn-login');
          btn.disabled = true; btn.textContent = 'Signing in…';
          const result = await fiyuu.action('/auth', { kind: 'login', email, password });
          if (result.success && result.sessionId) {
            document.cookie = \`fiyuu_session=\${result.sessionId}; path=/; SameSite=Lax; max-age=86400\`;
            const params = new URLSearchParams(window.location.search);
            window.location.href = params.get('next') || '/';
          } else {
            showAlert('login-alert', result.message || 'Login failed.');
            btn.disabled = false; btn.textContent = 'Sign in';
          }
        });

        document.getElementById('btn-register')?.addEventListener('click', async () => {
          const name = document.getElementById('reg-name').value.trim();
          const email = document.getElementById('reg-email').value.trim();
          const password = document.getElementById('reg-password').value;
          if (!name || !email || !password) { showAlert('register-alert', 'Please fill in all fields.'); return; }
          const btn = document.getElementById('btn-register');
          btn.disabled = true; btn.textContent = 'Creating account…';
          const result = await fiyuu.action('/auth', { kind: 'register', name, email, password });
          if (result.success && result.sessionId) {
            document.cookie = \`fiyuu_session=\${result.sessionId}; path=/; SameSite=Lax; max-age=86400\`;
            window.location.href = '/';
          } else {
            showAlert('register-alert', result.message || 'Registration failed.');
            btn.disabled = false; btn.textContent = 'Create account';
          }
        });
      </script>
    `;
  }
}
