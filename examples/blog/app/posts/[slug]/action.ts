import { z } from "zod";
import { defineAction } from "@fiyuu/core/client";

export const action = defineAction({
  input: z.object({
    postSlug: z.string(),
    author: z.string().min(1).max(50),
    text: z.string().min(1).max(1000),
  }),
  output: z.object({ success: z.boolean(), message: z.string() }),
  description: "Add a comment to a blog post",
});

export async function execute(input: Record<string, unknown>) {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const { postSlug, author, text } = input as { postSlug: string; author: string; text: string };

  const commentsTable = db.table("comments");
  commentsTable.insert({
    postSlug,
    author,
    text,
    createdAt: Date.now(),
  });

  return { success: true, message: "Yorum eklendi!" };
}
