import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";
import { readDb } from "../lib/db.js";

export const query = defineQuery({
  description: "Fetch doc and changelog counts for the landing page.",
  input: z.object({}),
  output: z.object({
    docCount: z.number(),
    latestVersion: z.string(),
    categories: z.array(z.object({ name: z.string(), count: z.number() })),
  }),
});

export async function execute() {
  const db = await readDb();
  const published = db.docs.filter((d) => d.published);

  const catMap = new Map<string, number>();
  for (const doc of published) {
    catMap.set(doc.category, (catMap.get(doc.category) ?? 0) + 1);
  }

  const categoryLabels: Record<string, string> = {
    "getting-started": "Getting Started",
    "core-concepts": "Core Concepts",
    reference: "Reference",
  };

  return {
    docCount: published.length,
    latestVersion: db.changelog[0]?.version ?? "0.1.0",
    categories: [...catMap.entries()].map(([name, count]) => ({
      name: categoryLabels[name] ?? name,
      count,
    })),
  };
}
