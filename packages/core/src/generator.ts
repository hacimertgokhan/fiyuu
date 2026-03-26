import { promises as fs } from "node:fs";
import path from "node:path";

const PAGE_TEMPLATE = `import { definePage, type PageProps } from "fiyuu/client";

export const page = definePage({
  intent: "{{intent}}",
});

export default function Page({ intent }: PageProps) {
  return (
    <main style={{ padding: "48px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ margin: 0, fontSize: "40px" }}>{{title}}</h1>
      <p style={{ marginTop: "12px", color: "#4b5b4c" }}>{intent}</p>
    </main>
  );
}
`;

const ACTION_TEMPLATE = `import { z } from "zod";
import { defineAction } from "fiyuu/client";

export const action = defineAction({
  input: z.object({}),
  output: z.object({ success: z.boolean() }),
  description: "{{description}}",
});
`;

const QUERY_TEMPLATE = `import { z } from "zod";
import { defineQuery } from "fiyuu/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({}),
  description: "{{description}}",
});

export async function execute() {
  return {};
}
`;

const SCHEMA_TEMPLATE = `import { z } from "zod";

export const input = z.object({});

export const output = z.object({
  success: z.boolean(),
});

export const description = "{{description}}";
`;

const META_TEMPLATE = `import { defineMeta } from "fiyuu/client";

export default defineMeta({
  intent: "{{intent}}",
  title: "{{title}}",
  render: "ssr",
});
`;

export async function generatePageFeature(appDirectory: string, featureName: string): Promise<string[]> {
  const featureDirectory = path.join(appDirectory, featureName);
  await fs.mkdir(featureDirectory, { recursive: true });

  const title = titleCase(featureName);
  const intent = `${title} page for user-facing interactions`;
  const description = `Fetches data for ${title}`;
  const files = [
    ["page.tsx", PAGE_TEMPLATE],
    ["query.ts", QUERY_TEMPLATE],
    ["schema.ts", SCHEMA_TEMPLATE],
    ["meta.ts", META_TEMPLATE],
  ] as const;

  await Promise.all(
    files.map(([fileName, template]) =>
      fs.writeFile(path.join(featureDirectory, fileName), hydrate(template, { title, intent, description })),
    ),
  );

  return files.map(([fileName]) => path.join(featureDirectory, fileName));
}

export async function generateActionFeature(appDirectory: string, featureName: string): Promise<string[]> {
  const featureDirectory = path.join(appDirectory, featureName);
  await fs.mkdir(featureDirectory, { recursive: true });

  const title = titleCase(featureName);
  const intent = `${title} workflow for server-side mutations`;
  const description = `Performs ${title} mutation`;
  const files = [
    ["action.ts", ACTION_TEMPLATE],
    ["schema.ts", SCHEMA_TEMPLATE],
    ["meta.ts", META_TEMPLATE],
  ] as const;

  await Promise.all(
    files.map(([fileName, template]) =>
      fs.writeFile(path.join(featureDirectory, fileName), hydrate(template, { title, intent, description })),
    ),
  );

  return files.map(([fileName]) => path.join(featureDirectory, fileName));
}

function hydrate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce((content, [key, value]) => content.replaceAll(`{{${key}}}`, value), template);
}

function titleCase(value: string): string {
  return value
    .split(/[\/-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
