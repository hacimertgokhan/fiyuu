import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  requests: z.array(
    z.object({
      id: z.string(),
      route: z.string(),
      method: z.string(),
      source: z.string(),
    }),
  ),
});

export const description = "Loads request records from the F1 starter store";
