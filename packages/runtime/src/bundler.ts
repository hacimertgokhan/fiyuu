import { promises as fs, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { build } from "esbuild";
import type { FeatureRecord, RenderMode } from "@fiyuu/core";

export interface ClientAsset {
  route: string;
  feature: string;
  render: RenderMode;
  bundleFile: string;
  publicPath: string;
}

const buildCache = new Map<string, { signature: string; asset: ClientAsset }>();

export async function bundleClient(features: FeatureRecord[], outputDirectory: string): Promise<ClientAsset[]> {
  await fs.mkdir(outputDirectory, { recursive: true });

  const pageFeatures = features.filter((feature) => feature.files["page.tsx"] && feature.render === "csr");
  const assets = await Promise.all(
    pageFeatures.map(async (feature) => {
      const safeFeatureName = feature.feature.length > 0 ? feature.feature.replaceAll("/", "_") : "home";
      const pageFile = feature.files["page.tsx"]!;
      const layoutFiles = resolveLayoutFiles(feature, pageFile);
      const signature = await createBuildSignature([pageFile, ...layoutFiles]);
      const signatureHash = createHash("sha1").update(signature).digest("hex").slice(0, 10);
      const bundleName = `${safeFeatureName}.${signatureHash}.js`;
      const bundleFile = path.join(outputDirectory, bundleName);
      const cacheKey = feature.route;
      const publicPath = `/__fiyuu/client/${bundleName}`;
      const cached = buildCache.get(cacheKey);

      if (cached && cached.signature === signature && existsSync(cached.asset.bundleFile)) {
        return {
          ...cached.asset,
          render: feature.render,
        } satisfies ClientAsset;
      }

      await build({
        stdin: {
          contents: createClientEntry(pageFile, layoutFiles),
          resolveDir: path.dirname(pageFile),
          sourcefile: `${feature.feature}-client.tsx`,
          loader: "tsx",
        },
        bundle: true,
        format: "esm",
        jsx: "automatic",
        jsxImportSource: "@geajs/core",
        minify: true,
        outfile: bundleFile,
        platform: "browser",
        sourcemap: false,
        target: ["es2022"],
      });

      const asset = {
        route: feature.route,
        feature: feature.feature,
        render: feature.render,
        bundleFile,
        publicPath,
      } satisfies ClientAsset;

      if (cached && cached.asset.bundleFile !== asset.bundleFile && existsSync(cached.asset.bundleFile)) {
        try {
          await fs.unlink(cached.asset.bundleFile);
        } catch {
          // ignore stale artifact cleanup failures
        }
      }

      buildCache.set(cacheKey, { signature, asset });
      return asset;
    }),
  );

  return assets;
}

async function createBuildSignature(filePaths: string[]): Promise<string> {
  const signatures = await Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      return `${filePath}:${stats.size}:${Math.floor(stats.mtimeMs)}`;
    }),
  );

  return signatures.join("|");
}

function createClientEntry(pageFile: string, layoutFiles: string[]): string {
  const layoutImports = layoutFiles
    .map((layoutFile, index) => `import * as LayoutModule${index} from ${JSON.stringify(layoutFile)};`)
    .join("\n");
  const layoutWrappers = layoutFiles
    .map((_, index) => `const Layout${index} = LayoutModule${index}.default; if (Layout${index}) { const wrapped = new Layout${index}({ route, children: String(component) }); component = wrapped; }`)
    .reverse()
    .join("\n    ");

  return `
    import { Component } from "@geajs/core";
    import Page from ${JSON.stringify(pageFile)};
    ${layoutImports}

    const data = window.__FIYUU_DATA__ ?? null;
    const route = window.__FIYUU_ROUTE__ ?? "/";
    const intent = window.__FIYUU_INTENT__ ?? "";
    const render = window.__FIYUU_RENDER__ ?? "csr";
    const rootElement = document.getElementById("app");
    const pageProps = { data, route, intent, render };
    if (!(Page && Page.prototype instanceof Component)) {
      throw new Error("Fiyuu Gea mode expects page default export to extend @geajs/core Component.");
    }
    let component = new Page(pageProps);
    ${layoutWrappers}

    if (rootElement) {
      rootElement.innerHTML = "";
      component.render(rootElement);

      // Re-execute any <script> tags injected by the component.
      // innerHTML assignment does not execute scripts — this is a browser security rule.
      // We collect all script tags and recreate them so they run normally.
      const injectedScripts = rootElement.querySelectorAll("script");
      for (const oldScript of injectedScripts) {
        const newScript = document.createElement("script");
        for (const attr of oldScript.attributes) {
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      }
    }
  `;
}

function resolveLayoutFiles(feature: FeatureRecord, pageFile: string): string[] {
  const featureParts = feature.feature ? feature.feature.split("/") : [];
  const featureDirectory = path.dirname(pageFile);
  const appDirectory = featureParts.length > 0
    ? path.resolve(featureDirectory, ...Array(featureParts.length).fill(".."))
    : featureDirectory;
  const directories = [appDirectory, ...featureParts.map((_, index) => path.join(appDirectory, ...featureParts.slice(0, index + 1)))];

  return directories
    .map((directory) => path.join(directory, "layout.tsx"))
    .filter((layoutPath) => existsSync(layoutPath));
}
