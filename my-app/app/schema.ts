import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  highlights: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
    }),
  ),
  recentPosts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      excerpt: z.string(),
      authorName: z.string(),
    }),
  ),
});

export const description = "Loads blog highlights and recent posts for home";
