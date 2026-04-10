/**
 * app/structure/page.ts → Route: /structure
 */

import { definePage, html } from "@fiyuu/core";

export default definePage({
  render: () => html`
    <div style="max-width:1200px; margin:0 auto; padding:100px 24px;">
      <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:24px;">Project Structure</h1>
      
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px; margin-top:48px;">
        <div style="padding:24px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:2px;">
          <h3 style="color:var(--accent); font-size:14px; margin-bottom:12px;">page.ts</h3>
          <p style="font-size:13px; color:var(--text-secondary);">Page component with load and render functions</p>
        </div>
        <div style="padding:24px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:2px;">
          <h3 style="color:var(--accent); font-size:14px; margin-bottom:12px;">layout.ts</h3>
          <p style="font-size:13px; color:var(--text-secondary);">Root layout wrapping all pages</p>
        </div>
        <div style="padding:24px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:2px;">
          <h3 style="color:var(--accent); font-size:14px; margin-bottom:12px;">providers/</h3>
          <p style="font-size:13px; color:var(--text-secondary);">Context providers for global state</p>
        </div>
      </div>
    </div>
  `,
  seo: {
    meta: {
      title: "Project Structure | Fiyuu",
      description: "Standard Fiyuu project structure and file conventions.",
    },
  },
});
