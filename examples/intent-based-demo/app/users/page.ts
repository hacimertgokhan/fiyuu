/**
 * app/users/page.ts → Route: /users
 * 
 * Sade, anlaşılır, hızlı.
 * AI anlar, yazılımcı anlar.
 */

import { definePage, html, when } from "@fiyuu/core";

const db = {
  users: [
    { id: 1, name: "Ahmet", role: "admin" },
    { id: 2, name: "Ayşe", role: "user" },
    { id: 3, name: "Mehmet", role: "user" },
  ],
};

export default definePage({
  // Route YOK! Dosya path'i: app/users/page.ts → /users
  
  load: () => db.users,
  
  render: ({ data: users }) => html`
    <h1>Kullanıcılar (${users.length})</h1>
    
    ${when(
      users.length === 0,
      () => html`<p>Henüz kullanıcı yok.</p>`,
      () => html`
        <ul>
          ${users.map((u) => html`
            <li>
              <a href="/users/${u.id}">${u.name}</a>
              <span class="badge">${u.role}</span>
            </li>
          `)}
        </ul>
      `
    )}
  `,
});
