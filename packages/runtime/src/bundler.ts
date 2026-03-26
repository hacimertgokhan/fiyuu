import { promises as fs } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import type { FeatureRecord } from "@fiyuu/core";

export interface ClientAsset {
  route: string;
  feature: string;
  render: "ssr" | "csr";
  bundleFile: string;
  publicPath: string;
}

export async function bundleClient(features: FeatureRecord[], outputDirectory: string): Promise<ClientAsset[]> {
  await fs.mkdir(outputDirectory, { recursive: true });

  const pageFeatures = features.filter((feature) => feature.files["page.tsx"]);
  const assets = await Promise.all(
    pageFeatures.map(async (feature) => {
      const safeFeatureName = feature.feature.length > 0 ? feature.feature.replaceAll("/", "_") : "home";
      const bundleName = `${safeFeatureName}.js`;
      const bundleFile = path.join(outputDirectory, bundleName);
      const pageFile = feature.files["page.tsx"]!;

      await build({
        stdin: {
          contents: createClientEntry(pageFile),
          resolveDir: process.cwd(),
          sourcefile: `${feature.feature}-client.tsx`,
          loader: "tsx",
        },
        bundle: true,
        format: "esm",
        jsx: "automatic",
        minify: true,
        outfile: bundleFile,
        platform: "browser",
        sourcemap: false,
        target: ["es2022"],
      });

      return {
        route: feature.route,
        feature: feature.feature,
        render: feature.render,
        bundleFile,
        publicPath: `/__fiyuu/client/${bundleName}`,
      } satisfies ClientAsset;
    }),
  );

  return assets;
}

function createClientEntry(pageFile: string): string {
  return `
    import React from "react";
    import { createRoot, hydrateRoot } from "react-dom/client";
    import Page from ${JSON.stringify(pageFile)};

    const data = window.__FIYUU_DATA__ ?? null;
    const route = window.__FIYUU_ROUTE__ ?? "/";
    const intent = window.__FIYUU_INTENT__ ?? "";
    const render = window.__FIYUU_RENDER__ ?? "ssr";
    const rootElement = document.getElementById("app");
    const element = React.createElement(Page, { data, route, intent, render });

    if (rootElement) {
      if (render === "ssr" && rootElement.childNodes.length > 0) {
        hydrateRoot(rootElement, element);
      } else {
        createRoot(rootElement).render(element);
      }
    }
  `;
}
