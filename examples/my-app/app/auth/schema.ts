import { z } from "zod";

export const input = z.object({
  kind: z.enum(["login", "register", "logout"]),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(2).optional(),
  sessionId: z.string().optional(),
});

export const output = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  message: z.string().optional(),
});
