import { z } from "zod";

export const input = z.object({});
export const output = z.object({
  posts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string(),
      authorId: z.string(),
      published: z.boolean(),
      createdAt: z.number(),
    }),
  ),
  total: z.number(),
});
