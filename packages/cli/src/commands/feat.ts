import path from "node:path";
import { c, existsSync, fs, log } from "../shared.js";
import { sync } from "./sync.js";

export async function handleFeatureCommand(rootDirectory: string, appDirectory: string, args: string[]): Promise<void> {
  const [name, state] = args;

  if (!name || name === "list") {
    const features = await readFeatureState(rootDirectory);
    console.log(`\n${c.bold}${c.cyan}Fiyuu Features${c.reset}`);
    log("socket", features.socket ? `${c.green}on${c.reset}` : `${c.gray}off${c.reset}`);
    return;
  }

  if (name !== "socket") {
    throw new Error("Only `socket` is currently supported. Use `fiyuu feat list`.");
  }

  if (state !== "on" && state !== "off") {
    throw new Error("Use `fiyuu feat socket on` or `fiyuu feat socket off`.");
  }

  if (state === "on") {
    await enableSocketFeature(appDirectory);
  } else {
    await disableSocketFeature(appDirectory);
  }

  await updateSocketConfigFlags(path.join(rootDirectory, "fiyuu.config.ts"), state === "on");

  const nextState = await readFeatureState(rootDirectory);
  nextState.socket = state === "on";
  await writeFeatureState(rootDirectory, nextState);
  await sync(rootDirectory, appDirectory);

  log("socket", state === "on" ? `${c.green}enabled${c.reset}` : `${c.gray}disabled${c.reset}`);
}

// ── Feature state persistence ─────────────────────────────────────────────────

async function readFeatureState(rootDirectory: string): Promise<{ socket: boolean }> {
  const filePath = path.join(rootDirectory, ".fiyuu", "features.json");
  if (!existsSync(filePath)) return { socket: false };
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as { socket?: boolean };
    return { socket: Boolean(parsed.socket) };
  } catch {
    return { socket: false };
  }
}

async function writeFeatureState(rootDirectory: string, state: { socket: boolean }): Promise<void> {
  const filePath = path.join(rootDirectory, ".fiyuu", "features.json");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`);
}

// ── Socket config helpers ─────────────────────────────────────────────────────

async function updateSocketConfigFlags(configPath: string, enabled: boolean): Promise<void> {
  if (!existsSync(configPath)) return;
  const source = await fs.readFile(configPath, "utf8");
  const v = enabled ? "true" : "false";
  const updated = source
    .replace(/(fullstack\s*:\s*\{[\s\S]*?sockets\s*:\s*)(true|false)/m, `$1${v}`)
    .replace(/(websocket\s*:\s*\{[\s\S]*?enabled\s*:\s*)(true|false)/m, `$1${v}`)
    .replace(/(realtimeCounter\s*:\s*)(true|false)/m, `$1${v}`);
  if (updated !== source) await fs.writeFile(configPath, updated);
}

async function enableSocketFeature(appDirectory: string): Promise<void> {
  await writeIfMissing(path.join(appDirectory, "..", "server", "socket.ts"), socketServerTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "meta.ts"), socketMetaTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "schema.ts"), socketSchemaTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "query.ts"), socketQueryTemplate());
  await writeIfMissing(path.join(appDirectory, "live", "page.tsx"), socketPageTemplate());
}

async function disableSocketFeature(appDirectory: string): Promise<void> {
  const files = [
    path.join(appDirectory, "..", "server", "socket.ts"),
    path.join(appDirectory, "live", "meta.ts"),
    path.join(appDirectory, "live", "schema.ts"),
    path.join(appDirectory, "live", "query.ts"),
    path.join(appDirectory, "live", "page.tsx"),
  ];
  for (const filePath of files) {
    if (existsSync(filePath)) await fs.rm(filePath);
  }
  const liveDir = path.join(appDirectory, "live");
  if (existsSync(liveDir)) {
    const entries = await fs.readdir(liveDir);
    if (entries.length === 0) await fs.rmdir(liveDir);
  }
}

async function writeIfMissing(filePath: string, content: string): Promise<void> {
  if (existsSync(filePath)) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

// ── Socket file templates ─────────────────────────────────────────────────────

function socketServerTemplate(): string {
  return `import type { WebSocket } from "ws";

export function registerSocketServer() {
  return {
    namespace: "updates",
    events: ["counter:tick", "socket:echo"],
    onConnect(socket: WebSocket) {
      socket.send(JSON.stringify({ type: "socket:connected", channel: "updates" }));
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        socket.send(JSON.stringify({ type: "counter:tick", count }));
      }, 1000);
      socket.on("close", () => clearInterval(interval));
    },
    onMessage(socket: WebSocket, message: string) {
      socket.send(JSON.stringify({ type: "socket:echo", message }));
    },
  };
}
`;
}

function socketMetaTemplate(): string {
  return `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "Live socket route",
  title: "Live",
  render: "ssr",
  seo: {
    title: "Live",
    description: "Real-time socket connection page",
  },
});
`;
}

function socketSchemaTemplate(): string {
  return `import { z } from "zod";

export const input = z.object({});
export const output = z.object({ message: z.string() });
`;
}

function socketQueryTemplate(): string {
  return `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({ message: z.string() }),
  description: "Socket route bootstrap",
});

export async function execute() {
  return { message: "Socket feature enabled" };
}
`;
}

function socketPageTemplate(): string {
  return `import { Component } from "@geajs/core";
import { definePage, html, escapeHtml, type PageProps } from "fiyuu/client";

type LiveData = { message: string };

export const page = definePage({ intent: "Live socket page" });

export default class LivePage extends Component<PageProps<LiveData>> {
  template({ data }: PageProps<LiveData> = this.props) {
    return html\`
      <main class="min-h-screen px-6 py-10">
        <h1 class="text-3xl font-semibold">Live Socket</h1>
        <p class="mt-4">\${escapeHtml(data?.message ?? "Ready")}</p>
        <div class="mt-6 text-sm">Status: <span id="fiyuu-live-status">connecting</span></div>
        <div class="mt-2 text-4xl font-semibold" id="fiyuu-live-count">0</div>
      </main>
      <script type="module">
        const count = document.getElementById('fiyuu-live-count');
        const status = document.getElementById('fiyuu-live-status');
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        const socket = new WebSocket(protocol + '://' + location.host + '/__fiyuu/ws');
        const fail = () => { if (status) status.textContent = 'unavailable'; };
        const timeout = setTimeout(fail, 3500);
        socket.addEventListener('open', () => { clearTimeout(timeout); if (status) status.textContent = 'connected'; });
        socket.addEventListener('error', () => { clearTimeout(timeout); fail(); });
        socket.addEventListener('close', () => { if (status && status.textContent !== 'unavailable') status.textContent = 'closed'; });
        socket.addEventListener('message', (event) => {
          try {
            const p = JSON.parse(event.data);
            if (p?.type === 'counter:tick' && count) count.textContent = String(p.count);
          } catch {}
        });
      </script>
    \`;
  }
}
`;
}
