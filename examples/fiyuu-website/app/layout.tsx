/**
 * Root Layout - Intent-Based
 */

import { defineLayout, html } from "@fiyuu/core";

export default defineLayout({
  name: "default",
  
  wrapper: ({ head, body }) => html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
        ${head}
        <style>
          :root {
            --bg: #09090b;
            --bg-elevated: #111114;
            --border: #27272a;
            --border-subtle: #1a1a1e;
            --text: #fafafa;
            --text-secondary: #9ca3af;
            --text-muted: #52525b;
            --text-dim: #3f3f46;
            --accent: #f59e0b;
            --accent-soft: rgba(245, 158, 11, 0.08);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            background: var(--bg);
            color: var(--text);
            font-family: 'DM Sans', sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          .nav-link {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            transition: color 0.2s;
          }
          .nav-link:hover { color: var(--text); }
          .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: var(--accent);
            color: #09090b;
            font-weight: 600;
            font-size: 14px;
            border-radius: 2px;
            text-decoration: none;
            transition: all 0.25s ease;
          }
          .btn-primary:hover {
            background: #fbbf24;
            transform: translateY(-1px);
            box-shadow: 0 8px 32px rgba(245, 158, 11, 0.25);
          }
          .btn-ghost {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: transparent;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            border-radius: 2px;
            text-decoration: none;
            border: 1px solid var(--border);
            transition: all 0.25s ease;
          }
          .btn-ghost:hover {
            border-color: var(--border);
            color: var(--text);
            background: rgba(255,255,255,0.05);
          }
          .bp-card {
            background: var(--bg-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: 2px;
            transition: all 0.35s ease;
          }
          .bp-card:hover {
            border-color: var(--border);
            background: #18181c;
            transform: translateY(-2px);
          }
          .code-frame {
            background: var(--bg-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: 2px;
            overflow: hidden;
          }
          .code-frame-body {
            padding: 20px;
          }
          .code-frame-body pre {
            margin: 0;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            line-height: 1.75;
            color: var(--text-secondary);
          }
          .bp-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .bp-table thead th {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 0 20px 16px 0;
            text-align: left;
            border-bottom: 1px solid var(--border);
          }
          .bp-table tbody td {
            padding: 14px 20px 14px 0;
            border-bottom: 1px solid var(--border-subtle);
            color: var(--text-secondary);
          }
          .bp-border {
            border: 1px solid var(--border);
            position: relative;
          }
        </style>
      </head>
      <body>
        ${body}
      </body>
    </html>
  `,
});
