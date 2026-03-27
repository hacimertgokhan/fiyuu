import { z } from "zod";
import { defineQuery } from "fiyuu/client";
import { listRecentPublishedPosts } from "../server/f1/index.js";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
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
  }),
  description: "Loads blog highlights and recent posts for home",
});

export async function execute() {
  const recent = await listRecentPublishedPosts(3);
  return {
    highlights: [
      { title: "F1-backed", body: "Auth, profile, admin, and posts are stored in F1." },
      { title: "Modal auth", body: "Sign in and sign up stay in the layout, not separate pages." },
      { title: "Simple routes", body: "Home, blog, profile, and admin each keep focused responsibilities." },
    ],
    recentPosts: recent.map((entry) => ({
      id: entry.id,
      title: entry.title,
      excerpt: entry.excerpt,
      authorName: entry.author.name,
    })),
  };
}
