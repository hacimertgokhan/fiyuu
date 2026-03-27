import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  users: z.array(z.object({ id: z.string(), username: z.string(), role: z.string() })),
  sessions: z.array(z.object({ id: z.string(), userId: z.string(), status: z.string() })),
  hint: z.object({ username: z.string(), password: z.string() }),
});

export const description = "Loads starter auth data from the F1 store";
