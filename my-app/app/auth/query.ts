import { z } from "zod";
import { defineQuery } from "fiyuu/client";
import { listSessions, listUsers } from "../../server/f1/index.js";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    users: z.array(z.object({ id: z.string(), username: z.string(), role: z.string() })),
    sessions: z.array(z.object({ id: z.string(), userId: z.string(), status: z.string() })),
    hint: z.object({ username: z.string(), password: z.string() }),
  }),
  description: "Loads starter auth data from the F1 store",
});

export async function execute() {
  return {
    users: await listUsers(),
    sessions: await listSessions(),
    hint: { username: "founder", password: "fiyuu123" },
  };
}
