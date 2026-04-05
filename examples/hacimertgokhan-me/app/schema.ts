import { z } from "zod";

export const input = z.object({});

export const experienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  techStack: z.array(z.string()),
});

export const projectSchema = z.object({
  name: z.string(),
  summary: z.object({
    tr: z.string(),
    en: z.string(),
  }),
  category: z.enum(["IDE", "Database Engine", "SaaS", "B2B"]),
  stack: z.array(z.string()),
  liveUrl: z.string(),
  githubUrl: z.string(),
});

export const githubStatsSchema = z.object({
  stars: z.number(),
  forks: z.number(),
  commits: z.number(),
});

export const output = z.object({
  fullName: z.string(),
  title: z.object({
    tr: z.string(),
    en: z.string(),
  }),
  location: z.object({
    tr: z.string(),
    en: z.string(),
  }),
  about: z.object({
    tr: z.array(z.string()),
    en: z.array(z.string()),
  }),
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  githubStats: githubStatsSchema,
  contacts: z.object({
    email: z.string(),
    github: z.string(),
    linkedin: z.string(),
  }),
});

export type GithubStats = z.infer<typeof githubStatsSchema>;
export type PortfolioOutput = z.infer<typeof output>;
