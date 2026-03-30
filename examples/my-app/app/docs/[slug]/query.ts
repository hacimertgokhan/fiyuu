import { z } from "zod";
import { defineQuery, type QueryContext } from "@fiyuu/core/client";
import { readDb } from "../../../lib/db.js";

export const query = defineQuery({
  description: "Fetch a single doc page by slug, plus prev/next navigation.",
  input: z.object({ slug: z.string().optional() }),
  output: z.object({
    doc: z
      .object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        excerpt: z.string(),
        content: z.string(),
        category: z.string(),
        updatedAt: z.number(),
      })
      .nullable(),
    prev: z.object({ slug: z.string(), title: z.string() }).nullable(),
    next: z.object({ slug: z.string(), title: z.string() }).nullable(),
    allDocs: z.array(z.object({ slug: z.string(), title: z.string(), category: z.string() })),
  }),
});

export async function execute({ params }: QueryContext) {
  const db = await readDb();
  const published = db.docs
    .filter((d) => d.published)
    .sort((a, b) => {
      const catOrder = ["getting-started", "core-concepts", "reference"];
      const ca = catOrder.indexOf(a.category);
      const cb = catOrder.indexOf(b.category);
      return ca !== cb ? ca - cb : a.order - b.order;
    });

  const slug = params.slug ?? "";
  const idx = published.findIndex((d) => d.slug === slug);
  const doc = published[idx] ?? null;

  return {
    doc: doc
      ? {
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          excerpt: doc.excerpt,
          content: doc.content,
          category: doc.category,
          updatedAt: doc.updatedAt,
        }
      : null,
    prev: idx > 0 ? { slug: published[idx - 1].slug, title: published[idx - 1].title } : null,
    next: idx < published.length - 1 ? { slug: published[idx + 1].slug, title: published[idx + 1].title } : null,
    allDocs: published.map(({ slug, title, category }) => ({ slug, title, category })),
  };
}
