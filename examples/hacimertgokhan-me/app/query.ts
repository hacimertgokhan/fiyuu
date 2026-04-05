import { readFile } from "node:fs/promises";
import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";
import { input, output, type GithubStats } from "./schema.js";

type GithubRepo = {
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
};

let githubCache: { at: number; value: GithubStats } | null = null;

async function fetchGithubStats(username: string): Promise<GithubStats> {
  const now = Date.now();
  if (githubCache && now - githubCache.at < 1000 * 60 * 30) {
    return githubCache.value;
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "fiyuu-portfolio",
  };

  const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, { headers });
  const repos = reposResponse.ok ? ((await reposResponse.json()) as GithubRepo[]) : [];
  const ownRepos = repos.filter((repo) => !repo.fork);

  const stars = ownRepos.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0);
  const forks = ownRepos.reduce((sum, repo) => sum + (repo.forks_count ?? 0), 0);

  let commits = 0;
  try {
    const commitsResponse = await fetch(`https://api.github.com/search/commits?q=author:${encodeURIComponent(username)}&per_page=1`, {
      headers: {
        ...headers,
        Accept: "application/vnd.github.cloak-preview+json",
      },
    });

    if (commitsResponse.ok) {
      const body = (await commitsResponse.json()) as { total_count?: number };
      commits = body.total_count ?? 0;
    }
  } catch {
    commits = 0;
  }

  const value = { stars, forks, commits };
  githubCache = { at: now, value };
  return value;
}

export const query = defineQuery({
  description: "Portfolyo verilerini profile.json dosyasından yükler.",
  input,
  output,
});

export async function execute() {
  const file = new URL("../data/profile.json", import.meta.url);
  const raw = await readFile(file, "utf-8");
  const profile = JSON.parse(raw) as Omit<z.infer<typeof output>, "githubStats">;
  const githubStats = await fetchGithubStats("hacimertgokhan");
  return output.parse({ ...profile, githubStats });
}
