import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  input: z.object({
    slug: z.string(),
  }),
  output: z.object({
    post: z.object({
      slug: z.string(),
      title: z.string(),
      content: z.string(),
      author: z.string(),
      date: z.string(),
      tags: z.array(z.string()),
      readTime: z.number(),
      coverColor: z.string(),
      views: z.number(),
    }),
    comments: z.array(z.object({
      id: z.string(),
      author: z.string(),
      text: z.string(),
      createdAt: z.number(),
    })),
    relatedPosts: z.array(z.object({
      slug: z.string(),
      title: z.string(),
      excerpt: z.string(),
      coverColor: z.string(),
    })),
  }),
  description: "Single blog post query with comments and related posts",
});

export async function execute({ params }: { params: Record<string, string> }) {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const slug = params.slug || "";
  const postsTable = db.table("posts");

  // Find the post
  const post = postsTable.findOne({ slug }) as unknown as {
    slug: string; title: string; content: string; author: string;
    date: string; tags: string[]; readTime: number; coverColor: string; views: number;
  } | undefined;

  if (!post) {
    return {
      post: { slug: "", title: "Post not found", content: "", author: "", date: "", tags: [], readTime: 0, coverColor: "#999", views: 0 },
      comments: [],
      relatedPosts: [],
    };
  }

  // Increment view count
  postsTable.update((post as any)._id, { views: (post.views || 0) + 1 });

  // Get comments
  const allComments = db.table("comments").find({ postSlug: slug }) as unknown as Array<{
    _id: string; author: string; text: string; createdAt: number;
  }>;
  const comments = allComments
    .map(c => ({ id: c._id, author: c.author, text: c.text, createdAt: c.createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt);

  // Related posts (same tags)
  const allPosts = postsTable.find({}) as unknown as Array<{
    slug: string; title: string; excerpt: string; coverColor: string; tags: string[];
  }>;
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 2)
    .map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, coverColor: p.coverColor }));

  return {
    post: {
      slug: post.slug,
      title: post.title,
      content: post.content,
      author: post.author,
      date: post.date,
      tags: post.tags,
      readTime: post.readTime,
      coverColor: post.coverColor,
      views: post.views + 1,
    },
    comments,
    relatedPosts,
  };
}
