import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  description: "Portfolio data for homepage",
  input: z.object({}),
  output: z.object({
    fullName: z.string(),
    title: z.object({ tr: z.string(), en: z.string() }),
    location: z.object({ tr: z.string(), en: z.string() }),
    about: z.object({ tr: z.array(z.string()), en: z.array(z.string()) }),
    experiences: z.array(z.object({
      role: z.string(),
      company: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      techStack: z.array(z.string()),
    })),
    projects: z.array(z.object({
      name: z.string(),
      summary: z.object({ tr: z.string(), en: z.string() }),
      category: z.string(),
      stack: z.array(z.string()),
      liveUrl: z.string(),
      githubUrl: z.string(),
    })),
    contacts: z.object({
      email: z.string(),
      github: z.string(),
      linkedin: z.string(),
    }),
    githubStats: z.object({
      stars: z.number(),
      forks: z.number(),
      commits: z.number(),
    }),
  }),
});

export async function execute() {
  const file = resolve(process.cwd(), "app/data/profile.json");
  const raw = await readFile(file, "utf-8");
  const profile = JSON.parse(raw);

  return query.output.parse({
    ...profile,
    githubStats: profile.githubStats ?? { stars: 0, forks: 0, commits: 0 },
  });
}
