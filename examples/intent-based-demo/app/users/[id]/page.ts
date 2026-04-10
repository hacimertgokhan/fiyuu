/**
 * app/users/[id]/page.ts → Route: /users/:id
 */

import { definePage, html } from "@fiyuu/core";
import { z } from "zod";

const db = {
  users: [
    { id: 1, name: "Ahmet", email: "ahmet@example.com", role: "admin" },
    { id: 2, name: "Ayşe", email: "ayse@example.com", role: "user" },
  ],
};

export default definePage({
  // Route YOK! Dosya: app/users/[id]/page.ts → /users/:id
  
  input: {
    params: z.object({ id: z.string() }),
  },
  
  load: ({ params }) => db.users.find((u) => u.id === Number(params.id)),
  
  render: ({ data: user, error }) =>
    error || !user
      ? html`<p class="error">Kullanıcı bulunamadı</p>`
      : html`
          <article>
            <h1>${user.name}</h1>
            <p>Email: ${user.email}</p>
            <span class="badge">${user.role}</span>
          </article>
        `,
  
  meta: (user) => ({
    title: user?.name,
    description: `${user?.name} - ${user?.role}`,
  }),
});
