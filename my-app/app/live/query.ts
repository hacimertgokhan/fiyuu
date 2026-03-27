import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    initialCount: z.number(),
    channel: z.string(),
  }),
  description: "Loads starter websocket metadata for the live counter route",
});

export async function execute() {
  return {
    initialCount: 0,
    channel: "updates",
  };
}
