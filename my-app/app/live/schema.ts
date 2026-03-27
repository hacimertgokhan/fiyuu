import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  initialCount: z.number(),
  channel: z.string(),
});

export const description = "Loads starter websocket metadata for the live counter route";
