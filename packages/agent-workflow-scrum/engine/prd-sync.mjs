import { syncLivingPRDs } from "./prd-sync-core.mjs";

const dryRun = process.argv.includes("--dry-run");
const json = process.argv.includes("--json");

try {
  const result = await syncLivingPRDs({ dryRun });
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
