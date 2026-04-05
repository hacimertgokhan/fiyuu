#!/usr/bin/env node
// Patch @geajs/core package.json to add "default" export conditions.
// This fixes CJS resolution failures when tsx's CJS register resolves the package.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

let require;
try {
  require = createRequire(import.meta.url);
  const pkgEntry = require.resolve("@geajs/core");
  const pkgPath = pkgEntry.replace(/\/dist\/.*$/, "/package.json").replace(/\/src\/.*$/, "/package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  let patched = false;
  for (const entry of Object.values(pkg.exports ?? {})) {
    if (typeof entry === "object" && entry !== null && "import" in entry && !("default" in entry)) {
      entry.default = entry.import;
      patched = true;
    }
  }

  if (patched) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log("[fiyuu] Patched @geajs/core exports (added default conditions)");
  }
} catch {
  // @geajs/core not installed or exports not resolvable — skip patch
}
  }

  if (patched) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log("[fiyuu] Patched @geajs/core exports (added default conditions)");
  }
} catch {
  // @geajs/core not installed or exports not resolvable — skip patch
}
