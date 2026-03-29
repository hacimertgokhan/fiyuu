import { promises as fs } from "node:fs";
import path from "node:path";

const PAGE_TEMPLATE = `import { Component } from "@geajs/core";
import { definePage, html, optimizedImage, responsiveStyle, fluid, type PageProps } from "fiyuu/client";

type {{Title}}Data = Record<string, unknown>;

export const page = definePage({
  intent: "{{intent}}",
});

export default class {{Title}}Page extends Component<PageProps<{{Title}}Data>> {
  template({ data, intent }: PageProps<{{Title}}Data> = this.props) {
    // Strings interpolated into html\`\` are auto-escaped — no need for escapeHtml().
    // For pre-rendered HTML fragments, use raw() to prevent double-escaping.
    const responsive = responsiveStyle(".feature-shell", "padding:16px;max-width:100%;", {
      md: "padding:24px;",
      lg: "padding:32px;max-width:960px;margin-inline:auto;",
    });
    return html\`<main style="padding:48px;font-family:ui-sans-serif,system-ui,sans-serif">
      \${responsive}
      <section class="feature-shell">
      <h1 style="margin:0;font-size:2.5rem">{{title}}</h1>
      <p style="margin-top:12px;color:#4b5b4c;font-size:\${fluid(16, 20)}">\${intent}</p>
      \${optimizedImage({ src: "/assets/hero.jpg", alt: "{{title}}", width: 1280, height: 720, sizes: "(min-width: 1024px) 960px, 100vw" })}
      </section>
    </main>\`;
  }
}
`;

const ACTION_TEMPLATE = `import { z } from "zod";
import { defineAction } from "fiyuu/client";

export const action = defineAction({
  input: z.object({}),
  output: z.object({ success: z.boolean() }),
  description: "{{description}}",
});

export async function execute(input: Record<string, unknown>) {
  return { success: true };
}
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
  seo: {
    title: "{{title}}",
    description: "{{description}}",
  },
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
      fs.writeFile(path.join(featureDirectory, fileName), hydrate(template, { title, intent, description, Title: pascalCase(featureName) })),
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
      fs.writeFile(path.join(featureDirectory, fileName), hydrate(template, { title, intent, description, Title: pascalCase(featureName) })),
    ),
  );

  return files.map(([fileName]) => path.join(featureDirectory, fileName));
}

function hydrate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function titleCase(value: string): string {
  return value
    .split(/[\/-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function pascalCase(value: string): string {
  return value
    .split(/[\/-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}
