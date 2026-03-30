import { z } from "zod";

export const input = z.object({
  kind: z.enum(["create", "toggle", "delete"]),
  id: z.string().optional(),
  title: z.string().min(3).optional(),
  excerpt: z.string().min(10).optional(),
  content: z.string().min(20).optional(),
});

export const output = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  postId: z.string().optional(),
});
