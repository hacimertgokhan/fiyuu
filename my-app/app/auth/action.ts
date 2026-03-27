import { z } from "zod";
import { defineAction } from "fiyuu/client";
import { signIn } from "../../server/f1/index.js";

export const action = defineAction({
  input: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  output: z.object({
    success: z.boolean(),
    message: z.string(),
    session: z.object({ id: z.string(), userId: z.string(), status: z.string() }).nullable(),
    user: z.object({ id: z.string(), username: z.string(), role: z.string() }).nullable(),
  }),
  description: "Creates a starter auth session with username and password",
});

export async function execute({ input }: { input: { username: string; password: string } }) {
  return signIn(input.username, input.password);
}
