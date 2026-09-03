export { classifyChangedPaths, collectChangeScope, renderChangeScope } from "./change-scope-core.mjs";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderChangeScope } from "./change-scope-core.mjs";

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(renderChangeScope(process.argv.slice(2), process.cwd()));
  } catch (error) {
    console.error(`change-scope: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
