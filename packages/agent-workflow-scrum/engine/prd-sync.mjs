import { syncLivingPRDs } from "./prd-sync-core.mjs";
import path from "node:path";

function parseArgs(argv) {
  const options = { root: process.cwd(), dryRun: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--json") options.json = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const { dryRun, json } = options;
  const result = await syncLivingPRDs(options);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    console.log(`Living PRD Sync ${dryRun ? "(DRY RUN)" : ""}:`);
    for (const item of result.syncedPRDs) {
      console.log(`- ${item.file}: ${item.updated ? `Synced ${item.syncedCriteria.length} criteria` : "Already up to date"}`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
