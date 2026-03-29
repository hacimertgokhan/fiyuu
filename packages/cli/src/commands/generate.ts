import { generateActionFeature, generatePageFeature } from "@fiyuu/core";
import { c, log } from "../shared.js";

export async function generate(kind: "page" | "action", appDirectory: string, featureName: string): Promise<void> {
  const createdFiles =
    kind === "page"
      ? await generatePageFeature(appDirectory, featureName)
      : await generateActionFeature(appDirectory, featureName);

  console.log(`\n${c.bold}${c.cyan}Fiyuu Generate${c.reset}`);
  log("kind", kind);
  log("feature", featureName);

  for (const filePath of createdFiles) {
    log("created", filePath, c.green);
  }
}
