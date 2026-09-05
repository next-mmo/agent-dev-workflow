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
    console.log("PRD evidence review (read-only):");
    for (const item of result.reviews) {
      console.log(`- ${item.file}: ${item.criteria.length} unchecked criteria; ${item.evidenceCandidates.length} related task records`);
      for (const criterion of item.criteria) console.log(`  - Line ${criterion.line}: ${criterion.criterion} (unverified)`);
      for (const file of item.evidenceCandidates) console.log(`  - Inspect evidence: ${file}`);
    }
    console.log("No files changed. Related records do not prove acceptance; inspect their evidence and obtain the human decision.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
