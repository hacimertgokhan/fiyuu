import { z } from "zod";
import { defineQuery, type QueryContext } from "@fiyuu/core/client";
import { readDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";

export const query = defineQuery({
  description: "Fetch all docs (published + drafts) and changelog for the dashboard.",
  input: z.object({}),
  output: z.object({
    docs: z.array(
      z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        excerpt: z.string(),
        category: z.string(),
        published: z.boolean(),
        updatedAt: z.number(),
      }),
    ),
    changelog: z.array(
      z.object({
        id: z.string(),
        version: z.string(),
        title: z.string(),
        createdAt: z.number(),
      }),
    ),
    user: z.object({ name: z.string(), email: z.string(), role: z.string() }).nullable(),
    stats: z.object({
      total: z.number(),
      published: z.number(),
      drafts: z.number(),
      changelogEntries: z.number(),
    }),
  }),
});

export async function execute({ request }: QueryContext) {
  const db = await readDb();
  const user = await getSessionUser(request);

  const docs = db.docs
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, slug, title, excerpt, category, published, updatedAt }) => ({
      id, slug, title, excerpt, category, published, updatedAt,
    }));

  const changelog = db.changelog
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ id, version, title, createdAt }) => ({ id, version, title, createdAt }));

  return {
    docs,
    changelog,
    user: user ? { name: user.name, email: user.email, role: user.role } : null,
    stats: {
      total: docs.length,
      published: docs.filter((d) => d.published).length,
      drafts: docs.filter((d) => !d.published).length,
      changelogEntries: changelog.length,
    },
  };
}
