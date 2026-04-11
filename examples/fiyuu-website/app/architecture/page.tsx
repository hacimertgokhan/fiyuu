/**
 * app/architecture/page.ts → Route: /architecture
 */

import { definePage, html } from "@fiyuu/core";

export default definePage({
  render: () => html`
    <div style="max-width:1200px; margin:0 auto; padding:100px 24px;">
      <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:var(--text); margin-bottom:24px;">Architecture</h1>
      <p style="font-size:17px; color:var(--text-secondary); max-width:600px; line-height:1.7;">
        Fiyuu uses an intent-based architecture where file structure defines routes,
        and components are server-rendered by default with optional client hydration.
      </p>
      
      <div style="margin-top:48px; padding:32px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:2px;">
        <pre style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-secondary); line-height:1.8;">
app/
├── page.ts              → /
├── layout.ts            → Root layout
├── docs/
│   └── page.ts          → /docs
├── api/
│   └── users.ts         → /api/users
└── providers/
    └── theme.ts         → Global provider
        </pre>
      </div>
    </div>
  `,
  seo: {
    meta: {
      title: "Architecture | Fiyuu",
      description: "Understanding Fiyuu's intent-based architecture.",
    },
  },
});
