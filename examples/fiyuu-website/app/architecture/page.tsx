import { Component } from "@geajs/core";
import { definePage, html, raw, type PageProps } from "@fiyuu/core/client";

export const page = definePage({ intent: "Fiyuu website architecture guide" });

export default class ArchitecturePage extends Component<PageProps> {
  template() {
    return html`
      <div style="max-width:1200px; margin:0 auto; padding:120px 24px;">
        <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:24px;">
          Architecture & Structure
        </h1>
        <p style="font-size:16px; color:var(--text-secondary); max-width:700px; line-height:1.7; margin-bottom:60px;">
          Deep dive into how fiyuu-website is organized, styled, and structured. Perfect for understanding Fiyuu best practices.
        </p>

        <!-- Project Structure -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Project Structure
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Directory Layout</h3>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>file structure</span>
              </div>
              <div class="code-frame-body">
                <pre>fiyuu-website/
├── app/
│   ├── page.tsx                # Landing page (/)
│   ├── layout.tsx              # Root layout with global styles
│   ├── layout.meta.ts          # Layout metadata
│   ├── meta.ts                 # Root page SEO
│   ├── docs/
│   │   ├── page.tsx            # /docs - main documentation hub
│   │   └── meta.ts
│   ├── architecture/
│   │   ├── page.tsx            # /architecture - this page
│   │   └── meta.ts
│   └── structure/
│       ├── page.tsx            # /structure - detailed structure docs
│       └── meta.ts
│
├── fiyuu.config.ts             # Framework configuration
├── package.json                # Dependencies (^0.4.1)
├── tsconfig.json               # TypeScript settings
├── README.md                   # Project docs
└── .fiyuu/                     # Generated files (git-ignored)</pre>
              </div>
            </div>
          </div>

          <!-- File Organization Details -->
          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">File Organization</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              Each route folder follows Fiyuu's deterministic file structure:
            </p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">page.tsx</h4>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.7;">
                  Route component exported as <span style="color:var(--accent);">default</span>. Must use <span style="color:var(--accent);">definePage()</span> helper. Renders the route-specific UI.
                </p>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:12px; text-transform:uppercase; letter-spacing:0.05em;">meta.ts</h4>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.7;">
                  SEO metadata object. Fiyuu reads this for <span style="color:var(--accent);">title</span>, <span style="color:var(--accent);">description</span>, <span style="color:var(--accent);">render</span> mode, and other meta.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Design System & Styling -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Design System & Styling
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">CSS Variables</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              All colors and theming use CSS custom properties defined in <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">layout.tsx</span>. This enables consistent theming across all pages.
            </p>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <thead>
                <tr style="border-bottom:1px solid var(--border);">
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Variable</th>
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Purpose</th>
                  <th style="text-align:left; padding:0 20px 16px 0; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em;">Default Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--bg</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Page background</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#09090b</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--bg-elevated</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Card backgrounds</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#111114</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--bg-surface</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Surface backgrounds</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#18181c</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--text</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Primary text</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#fafafa</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--text-secondary</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Secondary text</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#9ca3af</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--accent</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Primary brand color</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#f59e0b</td>
                </tr>
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:14px 20px 14px 0; color:var(--text); font-weight:500; font-family:'JetBrains Mono',monospace; font-size:12px;">--border</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary);">Primary border</td>
                  <td style="padding:14px 20px 14px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace; font-size:11px;">#27272a</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Typography</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px;">
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; margin-bottom:8px; color:var(--accent);">Display</h4>
                <p style="font-family:'Bricolage Grotesque',sans-serif; font-size:13px; color:var(--text-secondary); line-height:1.6;">Bricolage Grotesque. Headlines, titles, emphasis.</p>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:500; margin-bottom:8px; color:var(--accent); letter-spacing:0.05em;">MONO</h4>
                <p style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-secondary); line-height:1.6;">Code, labels, metadata.</p>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; margin-bottom:8px; color:var(--accent);">Body</h4>
                <p style="font-family:'DM Sans',sans-serif; font-size:13px; color:var(--text-secondary); line-height:1.6;">DM Sans. Body text, paragraphs.</p>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Component Classes</h3>
            <div style="display:grid; gap:20px;">
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:8px; font-weight:600;">.bp-card</h4>
                <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">Elevated card with hover effects. Used for feature cards, component showcases, and content blocks.</p>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:8px; font-weight:600;">.code-frame</h4>
                <p style="font-size:13px; color:var(--text-secondary);">Code block container with syntax highlighting. Includes header with status indicator and body with pre-formatted text.</p>
              </div>
              <div style="background:var(--bg-elevated); border:1px solid var(--border-subtle); padding:20px; border-radius:2px;">
                <h4 style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--accent); margin-bottom:8px; font-weight:600;">.btn-primary / .btn-ghost</h4>
                <p style="font-size:13px; color:var(--text-secondary);">Action buttons. Primary is accent-colored with hover elevation. Ghost is outlined with subtle background.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Component Architecture -->
        <section style="margin-bottom:100px; padding-bottom:100px; border-bottom:1px solid var(--border-subtle);">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Component Architecture
          </h2>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Page Component Pattern</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              All page components extend <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">Component&lt;PageProps&gt;</span> from <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">@geajs/core</span>.
            </p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>example page component</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">import</span> { Component } <span class="kw">from</span> <span class="str">"@geajs/core"</span>;
<span class="kw">import</span> { definePage, html, <span class="kw">type</span> PageProps } <span class="kw">from</span> <span class="str">"@fiyuu/core/client"</span>;

<span class="kw">export const</span> page = <span class="fn">definePage</span>({ intent: <span class="str">"Page description"</span> });

<span class="kw">export default class</span> MyPage <span class="kw">extends</span> Component&lt;PageProps&gt; {
  <span class="fn">template</span>() {
    <span class="kw">return</span> html\`
      &lt;<span class="tp">div</span>&gt;Hello&lt;/<span class="tp">div</span>&gt;
    \`;
  }
}</pre>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:20px; text-transform:uppercase; letter-spacing:0.05em;">Styling Approach</h3>
            <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.8;">
              Inline styles + CSS variables for theming. Tailwind utilities for responsive design. No external stylesheets except global layout.
            </p>
            <ul style="list-style:none; padding:0; display:grid; gap:12px;">
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="display:flex; align-items:center; justify-content:center; width:24px; height:24px; flex-shrink:0; background:var(--accent-soft); color:var(--accent); border-radius:2px; font-size:12px; font-weight:600;">✓</span>
                <div>
                  <div style="font-weight:500; color:var(--text); font-size:13px;">Inline Styles</div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Layout, spacing, colors. Reference CSS variables.</div>
                </div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="display:flex; align-items:center; justify-content:center; width:24px; height:24px; flex-shrink:0; background:var(--accent-soft); color:var(--accent); border-radius:2px; font-size:12px; font-weight:600;">✓</span>
                <div>
                  <div style="font-weight:500; color:var(--text); font-size:13px;">Tailwind Classes</div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Responsive breakpoints (sm:, md:, lg:) and utilities.</div>
                </div>
              </li>
              <li style="display:flex; gap:12px; align-items:flex-start; padding:12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:2px;">
                <span style="display:flex; align-items:center; justify-content:center; width:24px; height:24px; flex-shrink:0; background:var(--accent-soft); color:var(--accent); border-radius:2px; font-size:12px; font-weight:600;">✓</span>
                <div>
                  <div style="font-weight:500; color:var(--text); font-size:13px;">CSS Variables</div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Always reference predefined variables instead of hardcoding colors.</div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- Fiyuu File Contracts -->
        <section style="margin-bottom:100px;">
          <h2 style="font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:700; color:var(--text); margin-bottom:32px;">
            Fiyuu Deterministic Files
          </h2>

          <p style="font-size:15px; color:var(--text-secondary); max-width:800px; margin-bottom:40px; line-height:1.8;">
            Fiyuu uses convention-based routing. Each route directory must follow these file contracts for the framework to recognize pages correctly.
          </p>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px; margin-bottom:40px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:24px; text-transform:uppercase; letter-spacing:0.05em;">page.tsx Contract</h3>
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px; line-height:1.8;">
              Defines the route component. Default export extending <span style="font-family:'JetBrains Mono',monospace; color:var(--accent);">Component</span>. Template method returns HTML.
            </p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>page.tsx contract</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">export const</span> page = <span class="fn">definePage</span>({ intent: <span class="str">"..."</span> });

<span class="kw">export default class</span> SomePage <span class="kw">extends</span> Component&lt;PageProps&gt; {
  <span class="fn">template</span>() {
    <span class="kw">return</span> html\`...\`;
  }
}</pre>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:2px; padding:32px;">
            <h3 style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:24px; text-transform:uppercase; letter-spacing:0.05em;">meta.ts Contract</h3>
            <p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px; line-height:1.8;">
              Defines page metadata. Named export object with <span style="color:var(--accent);">title</span>, <span style="color:var(--accent);">description</span>, and <span style="color:var(--accent);">render</span>.
            </p>
            <div class="code-frame">
              <div class="code-frame-header">
                <span class="dot amber"></span>
                <span>meta.ts contract</span>
              </div>
              <div class="code-frame-body">
                <pre><span class="kw">export const</span> meta = {
  title: <span class="str">"Page Title | Fiyuu Website"</span>,
  description: <span class="str">"SEO description."</span>,
  render: <span class="str">"server"</span>
};</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
