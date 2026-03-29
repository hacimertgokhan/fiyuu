# Latest Benchmark Scorecard

Generated at: 2026-03-28T10:08:28.865Z

## Environment

- Platform: darwin 25.2.0
- CPU: Apple M4
- CPU cores: 10
- Memory: 24.0 GB

## Summary

Status: success

| Metric | Value |
| --- | --- |
| Build time (s) | 0.39 |
| Sync time (s) | 0.26 |
| Doctor errors | 0 |
| Doctor warnings | 4 |
| SSR routes measured | 4 |
| SSR avg over routes (ms) | 0.95 |
| SSR p95 avg over routes (ms) | 1.07 |
| SSR max p95 (ms) | 1.52 |
| Client bundle total (KB) | 71.49 |

## Command Exit Codes

| Command | Exit code |
| --- | --- |
| Cold build | 0 |
| SSR benchmark | 0 |
| AI context sync | 0 |
| Doctor checks | 0 |

## Commands

1) npm run build
2) npm run benchmark:gea
3) /opt/homebrew/Cellar/node/25.8.0/bin/node /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/node_modules/fiyuu/bin/fiyuu.mjs sync
4) /opt/homebrew/Cellar/node/25.8.0/bin/node /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/node_modules/fiyuu/bin/fiyuu.mjs doctor

## Raw Output: Build

```text
> my-app@0.1.0 build
> node ./node_modules/fiyuu/bin/fiyuu.mjs build


Fiyuu Build
app → /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/app
step 1/3 → syncing project graph
graph → synced → /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/.fiyuu/graph.json
routes → 4
features → 4
ai docs → PROJECT.md, PATHS.md, STATES.md, FEATURES.md, WARNINGS.md, SKILLS.md, EXECUTION.md, INTERVENTIONS.md, DOCTOR.md
step 2/3 → bundling client assets
step 3/3 → writing runtime manifest
done → artifacts ready — run fiyuu start (port 4050)
```

## Raw Output: Benchmark

```text
> fiyuu@0.1.0 benchmark:gea
> tsx scripts/benchmark-gea-runtime.ts


Fiyuu Production Server
- URL: http://localhost:4180
- Mode: START
- Port: 4180
- WebSocket: ws://localhost:4180/__fiyuu/ws

Fiyuu Gea Runtime Benchmark
- App: /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/app
- Routes: 4
- URL: http://localhost:4180
- Warmup: 3 / Measured: 20
- Bundles: 1 files, 71.49 KB total

Route metrics (ms)
- route | avg | p50 | p95 | min | max
- / | 1.06 | 0.98 | 1.25 | 0.85 | 1.34
- /auth | 0.82 | 0.81 | 0.90 | 0.76 | 1.05
- /live | 0.56 | 0.56 | 0.60 | 0.49 | 0.66
- /requests | 1.38 | 1.34 | 1.52 | 1.29 | 1.82
```

## Raw Output: Sync

```text
graph → synced → /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/.fiyuu/graph.json
routes → 4
features → 4
ai docs → PROJECT.md, PATHS.md, STATES.md, FEATURES.md, WARNINGS.md, SKILLS.md, EXECUTION.md, INTERVENTIONS.md, DOCTOR.md
```

## Raw Output: Doctor

```text
Fiyuu Doctor
app → /Users/hacimertgokhan/WebstormProjects/fiyuu/my-app/app
status → 0 error(s), 4 warning(s)
  warn  [seo-description-word-count]  app/meta.ts
         Route / SEO description has 7 words; recommended range is 12-28 words.
  warn  [seo-description-word-count]  app/auth/meta.ts
         Route /auth SEO description has 9 words; recommended range is 12-28 words.
  warn  [seo-description-word-count]  app/live/meta.ts
         Route /live SEO description has 6 words; recommended range is 12-28 words.
  warn  [seo-description-word-count]  app/requests/meta.ts
         Route /requests SEO description has 8 words; recommended range is 12-28 words.

  Fix listed files, then rerun fiyuu doctor
  Or run fiyuu doctor --fix for safe automatic fixes.
```
