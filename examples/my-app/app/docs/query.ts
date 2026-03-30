import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";
import { readDb } from "../../lib/db.js";

const DocItem = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: z.string(),
  order: z.number(),
});

export const query = defineQuery({
  description: "Fetch all published docs grouped by category.",
  input: z.object({}),
  output: z.object({
    byCategory: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        docs: z.array(DocItem),
      }),
    ),
    total: z.number(),
  }),
});

const CATEGORY_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  "core-concepts": "Core Concepts",
  reference: "Reference",
};

const CATEGORY_ORDER = ["getting-started", "core-concepts", "reference"];

export async function execute() {
  const db = await readDb();
  const published = db.docs.filter((d) => d.published);

  const map = new Map<string, typeof published>();
  for (const doc of published) {
    if (!map.has(doc.category)) map.set(doc.category, []);
    map.get(doc.category)!.push(doc);
  }

  // Sort docs within each category by order
  for (const [, docs] of map) {
    docs.sort((a, b) => a.order - b.order);
  }

  const byCategory = CATEGORY_ORDER.filter((k) => map.has(k)).map((key) => ({
    key,
    label: CATEGORY_LABELS[key] ?? key,
    docs: (map.get(key) ?? []).map(({ id, slug, title, excerpt, category, order }) => ({
      id,
      slug,
      title,
      excerpt,
      category,
      order,
    })),
  }));

  return { byCategory, total: published.length };
}
