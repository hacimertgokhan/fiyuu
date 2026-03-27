import { z } from "zod";
import { defineQuery } from "fiyuu/client";
import { listRequests } from "../../server/f1/index.js";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    requests: z.array(
      z.object({
        id: z.string(),
        route: z.string(),
        method: z.string(),
        source: z.string(),
      }),
    ),
  }),
  description: "Loads request records from the F1 starter store",
});

export async function execute() {
  return {
    requests: await listRequests(),
  };
}
