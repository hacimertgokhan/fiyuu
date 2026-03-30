import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";
import { readDb } from "../../lib/db.js";

export const query = defineQuery({
  description: "Fetch all changelog entries sorted by newest first.",
  input: z.object({}),
  output: z.object({
    entries: z.array(
      z.object({
        id: z.string(),
        version: z.string(),
        title: z.string(),
        content: z.string(),
        createdAt: z.number(),
      }),
    ),
  }),
});

export async function execute() {
  const db = await readDb();
  const entries = [...db.changelog].sort((a, b) => b.createdAt - a.createdAt);
  return { entries };
}
