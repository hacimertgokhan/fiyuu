import { Component } from "@geajs/core";
import { definePage, html, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Detailed structure guide for fiyuu-website" });

export default class StructurePage extends Component<PageProps> {
  template() {
    return html`
      <div style="max-width:1200px; margin:0 auto; padding:120px 24px;">
        <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:24px;">
          Detailed Structure Guide
        </h1>
        <p style="font-size:16px; color:var(--text-secondary); max-width:700px; line-height:1.7; margin-bottom:60px;">
          Learn the structure, conventions, and best practices for organizing pages, components, and styles in a Fiyuu website.
        </p>

        <!-- App Directory Structure -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            App Directory Structure
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Complete File Tree</h3>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>app/ directory</span>
              </div>
              <div class="code-frame-body">
                <pre>app/
├── layout.tsx              # Root layout - defines global styles, fonts, CSS variables
├── layout.meta.ts          # Layout metadata (optional)
├── page.tsx                # Homepage (/)
├── meta.ts                 # Homepage metadata - title, description, SEO
│
├── docs/
│   ├── page.tsx            # Documentation hub (/docs)
│   └── meta.ts
│
├── architecture/
│   ├── page.tsx            # Architecture guide (/architecture)
│   └── meta.ts
│
├── structure/
│   ├── page.tsx            # This page (/structure)
│   └── meta.ts
│
└── [optional-routes]/
    ├── page.tsx
    └── meta.ts</pre>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Route Mapping</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              Fiyuu uses file-based routing. Each folder under <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">app/</span> becomes a URL route.
            </p>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <thead>
                <tr style="border-bottom:1px solid var(--border);">
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">File Path</th>
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">URL Route</th>
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">app/page.tsx</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">/</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Homepage</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">app/docs/page.tsx</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">/docs</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Docs hub</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">app/architecture/page.tsx</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">/architecture</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Architecture guide</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">app/structure/page.tsx</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">/structure</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Structure guide</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Layout Files -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Layout Files
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">layout.tsx</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              Root layout that wraps all pages. Contains global styles, CSS variables, font imports, and base HTML structure. Renders <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">children</span> prop with the page content.
            </p>
            <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px; margin-bottom:20px;">
              <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">Responsibilities</h4>
              <ul style="list-style:none; padding:0; display:grid; gap:8px;">
                <li style="display:flex; gap:8px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
                  <span style="color:var(--accent); font-weight:600; flex-shrink:0;">▪</span>
                  <span>Imports Bricolage Grotesque, JetBrains Mono, DM Sans fonts from Google Fonts</span>
                </li>
                <li style="display:flex; gap:8px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
                  <span style="color:var(--accent); font-weight:600; flex-shrink:0;">▪</span>
                  <span>Defines 30+ CSS variables for colors, spacing, and theming</span>
                </li>
                <li style="display:flex; gap:8px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
                  <span style="color:var(--accent); font-weight:600; flex-shrink:0;">▪</span>
                  <span>Exports component classes: .bp-card, .code-frame, .btn-primary, .nav-link, etc.</span>
                </li>
                <li style="display:flex; gap:8px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
                  <span style="color:var(--accent); font-weight:600; flex-shrink:0;">▪</span>
                  <span>Configures grid background and noise overlay effects</span>
                </li>
                <li style="display:flex; gap:8px; align-items:flex-start; font-size:13px; color:var(--text-secondary);">
                  <span style="color:var(--accent); font-weight:600; flex-shrink:0;">▪</span>
                  <span>Sets base HTML, body, and element styles</span>
                </li>
              </ul>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">layout.meta.ts (Optional)</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:20px; line-height:1.8;">
              Optional file for layout-level metadata. Can define default meta values inherited by all pages.
            </p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>layout.meta.ts</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">export const</span> meta = {
  siteName: <span class="str">"Fiyuu Website"</span>,
  domain: <span class="str">"fiyuu.example.com"</span>,
  <span class="cm">// Pages can override these</span>
};</pre>
              </div>
            </div>
          </div>
        </section>

        <!-- Page Files -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Page Files
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">page.tsx Requirements</h3>
            <div style="display:grid; gap:20px;">
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">1. Import Required</h4>
                <code style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-secondary); display:block; padding:12px; background:var(--bg); border-radius:2px; line-height:1.6; overflow-x:auto;"><span style="color:#c084fc;">import</span> { Component } <span style="color:#c084fc;">from</span> <span style="color:#f59e0b;">"@geajs/core"</span>;</code>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">2. definePage() Export</h4>
                <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Call definePage() with an intent description (used by Fiyuu AI):</p>
                <code style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-secondary); display:block; padding:12px; background:var(--bg); border-radius:2px; overflow-x:auto;"><span style="color:#c084fc;">export const</span> page = <span style="color:#60a5fa;">definePage</span>({ intent: <span style="color:#f59e0b;">"Purpose of this page"</span> });</code>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">3. Default Class Export</h4>
                <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Class name should describe the page. Extend <span style="color:var(--accent);">Component&lt;PageProps&gt;</span>:</p>
                <code style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-secondary); display:block; padding:12px; background:var(--bg); border-radius:2px; overflow-x:auto;"><span style="color:#c084fc;">export default class</span> DocsPage <span style="color:#c084fc;">extends</span> Component&lt;PageProps&gt; {}</code>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">4. Template Method</h4>
                <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">Must have a <span style="color:var(--accent);">template()</span> method returning HTML string:</p>
                <code style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-secondary); display:block; padding:12px; background:var(--bg); border-radius:2px; overflow-x:auto; line-height:1.6;"><span style="color:#60a5fa;">template</span>() { <span style="color:#c084fc;">return</span> html\`...\`; }</code>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">meta.ts Requirements</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              Metadata file for SEO and rendering configuration. Must export <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">meta</span> object.
            </p>
            <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
              <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; font-weight:600;">Required Fields</h4>
              <div style="display:grid; gap:12px;">
                <div style="display:grid; grid-template-columns:200px 1fr; gap:16px; font-size:13px;">
                  <span style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-weight:600;">title</span>
                  <span style="color:var(--text-secondary);">Page title for browser tab and SEO. Format: "Page Name | Fiyuu Website"</span>
                </div>
                <div style="display:grid; grid-template-columns:200px 1fr; gap:16px; font-size:13px;">
                  <span style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-weight:600;">description</span>
                  <span style="color:var(--text-secondary);">Meta description for search engines (50-160 chars)</span>
                </div>
                <div style="display:grid; grid-template-columns:200px 1fr; gap:16px; font-size:13px;">
                  <span style="color:var(--accent); font-family:'JetBrains Mono',monospace; font-weight:600;">render</span>
                  <span style="color:var(--text-secondary);">"server" (SSR) or "client" (CSR) or "hybrid"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Best Practices -->
        <section style="margin-bottom:100px;">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Best Practices
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Styling</h3>
            <ul style="list-style:none; padding:0; display:grid; gap:12px;">
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Use <span style="color:var(--accent);">var(--text)</span>, <span style="color:var(--accent);">var(--accent)</span>, <span style="color:var(--accent);">var(--border)</span> CSS variables</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Wrap content in max-width container: <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">max-width:1200px</span></div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Apply padding: <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">padding:120px 24px</span> for vertical rhythm</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Use <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">.bp-card</span> for component showcases and <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">.code-frame</span> for code blocks</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Use Bricolage Grotesque for <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">&lt;h1&gt;</span>, <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">&lt;h2&gt;</span> headlines</div>
              </li>
            </ul>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">File Organization</h3>
            <ul style="list-style:none; padding:0; display:grid; gap:12px;">
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">One folder per route. Both <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">page.tsx</span> and <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">meta.ts</span> required</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Keep page components simple - focus on structure and styling</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Name pages semantically (e.g., DocsPage, ArchitecturePage, not PageComponent)</div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="color:#34d399; font-weight:600; flex-shrink:0;">✓</span>
                <div style="font-size:13px; color:var(--text-secondary);">Meta titles should follow format: "Page Name | Fiyuu Website"</div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    `;
  }
}
