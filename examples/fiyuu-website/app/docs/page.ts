/**
 * app/docs/page.ts → Route: /docs
 */

import { definePage, html } from "@fiyuu/core";

export default definePage({
  render: () => html`
    <div style="max-width:1200px; margin:0 auto; padding:100px 24px;">
      <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:24px;">Documentation</h1>
      <p style="font-size:17px; color:var(--text-secondary); max-width:600px; line-height:1.7;">
        Fiyuu framework documentation will be available soon. 
        For now, check the <a href="https://github.com/hacimertgokhan/fiyuu" style="color:var(--accent);">GitHub repository</a>.
      </p>
    </div>
  `,
  seo: {
    meta: {
      title: "Documentation | Fiyuu",
      description: "Fiyuu framework documentation and guides.",
    },
  },
});
