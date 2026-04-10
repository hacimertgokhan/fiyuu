# Fiyuu Frontend Skill

## Overview

Fiyuu frontend, HTML template literals üzerine kurulu, JSX ceremony'si olmayan, hızlı ve AI-friendly bir sistem sunar.

## Template Literal Syntax

```typescript
import { definePage, html, when } from "@fiyuu/core";

export default definePage({
  render: ({ data }) => html`
    <div class="container">
      <h1>${data.title}</h1>
      ${when(data.items.length > 0,
        () => html`<ul>${data.items.map(i => html`<li>${i}</li>`)}</ul>`,
        () => html`<p>No items</p>`
      )}
    </div>
  `,
});
```

## Components

### Server Component

```typescript
// components/UserCard.ts
import { defineComponent, html } from "@fiyuu/core";
import { z } from "zod";

export default defineComponent({
  name: "UserCard",
  props: {
    schema: z.object({ name: z.string(), role: z.string() }),
  },
  serverRender: ({ name, role }) => html`
    <div class="user-card">
      <h3>${name}</h3>
      <span class="badge">${role}</span>
    </div>
  `,
  styles: `
    .user-card { padding: 1rem; border: 1px solid #ddd; }
    .badge { background: #007bff; color: white; padding: 2px 8px; }
  `,
});
```

### Client Island (Hydration)

```typescript
import { defineComponent, html } from "@fiyuu/core";

export default defineComponent({
  name: "Counter",
  island: "visible", // visible | load | idle | interaction
  serverRender: () => html`<button class="counter">0</button>`,
  clientScript: `
    document.querySelectorAll('.counter').forEach(btn => {
      let count = 0;
      btn.addEventListener('click', () => {
        btn.textContent = ++count;
      });
    });
  `,
});
```

## Layouts

```typescript
// app/layout.ts
import { defineLayout, html } from "@fiyuu/core";

export default defineLayout({
  name: "default",
  wrapper: ({ head, body }) => html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${head}
      </head>
      <body>
        <nav>Navigation</nav>
        <main>${body}</main>
        <footer>Footer</footer>
      </body>
    </html>
  `,
});
```

## Styling

### Inline Styles

```typescript
html`<div style="color: red; font-size: 16px;">Content</div>`
```

### CSS Variables (Design System)

```typescript
// layout.ts içinde
html`
  <style>
    :root {
      --primary: #007bff;
      --text: #1a1a1a;
      --bg: #ffffff;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
      padding: 0.5rem 1rem;
    }
  </style>
  ${children}
`
```

### Tailwind Support

```typescript
// fiyuu.config.ts
export default {
  css: {
    tailwind: true,
  },
};
```

## Conditional Rendering

```typescript
import { when, match } from "@fiyuu/core";

// Simple condition
${when(condition, () => html`<p>Yes</p>`, () => html`<p>No</p>`)}

// Match pattern (loading/error/success)
${match(result, {
  loading: () => html`<p>Loading...</p>`,
  error: (e) => html`<p>Error: ${e.message}</p>`,
  success: (data) => html`<div>${data}</div>`,
  empty: () => html`<p>No data</p>`,
})}
```

## Lists & Loops

```typescript
html`
  <ul>
    ${items.map((item, index) => html`
      <li key="${item.id}" class="${index % 2 === 0 ? 'even' : 'odd'}">
        ${item.name}
      </li>
    `).join('')}
  </ul>
`
```

## Best Practices

1. **Key attribute**: Listelerde her zaman key kullan
2. **Escape**: html`` otomatik escape eder, raw`` kullanma
3. **Island Architecture**: Interaktif olmayan kısımlar server'da kalsın
4. **CSS**: Component-level CSS kullan, global'den kaçın
