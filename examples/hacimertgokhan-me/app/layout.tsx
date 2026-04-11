/**
 * Portfolio Layout - Intent-Based
 */

import { defineLayout, html } from "@fiyuu/core";

export default defineLayout({
  name: "default",
  
  wrapper: ({ head, body }) => html`
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet">
        ${head}
        <style>
          :root {
            --font-merriweather: "Merriweather", serif;
            --bg-primary: #FFFFFF;
            --bg-secondary: #F3F4F6;
            --border: #E5E7EB;
            --text-primary: #111827;
            --text-secondary: #4B5563;
            --text-muted: #9CA3AF;
            --accent: #ca6242;
          }
          [data-theme="dark"] {
            --bg-primary: #0F0F10;
            --bg-secondary: #1A1A1D;
            --border: #2A2A2E;
            --text-primary: #EAEAEA;
            --text-secondary: #A1A1AA;
            --text-muted: #6B7280;
            --accent: #D97757;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: var(--font-merriweather), serif;
            -webkit-font-smoothing: antialiased;
          }
          ::selection {
            background: rgba(217, 119, 87, 0.3);
            color: var(--text-primary);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @media (max-width: 1279px) {
            #floatbar { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${body}
        <script>
          (() => {
            const theme = localStorage.getItem("theme") || "light";
            if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
          })();
        </script>
      </body>
    </html>
  `,
});
