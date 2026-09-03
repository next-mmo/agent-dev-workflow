import path from "node:path";
import { archiveCompletedTasks } from "./archive-core.mjs";

function parseArgs(argv) {
  const options = { dryRun: false, json: false, days: undefined, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--days") {
      const val = Number(argv[++index]);
      if (!Number.isInteger(val) || val < 1) throw new Error("--days must be an integer >= 1");
      options.days = val;
    } else if (arg === "--root") {
      options.root = path.resolve(argv[++index] || "");
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await archiveCompletedTasks({
    root: options.root,
    retentionDays: options.days,
    dryRun: options.dryRun,
  });

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`Archive Task Report (Retention: ${result.retentionDays} days / ${Math.round(result.retentionDays / 7)} weeks${result.dryRun ? " [DRY RUN]" : ""}):\n`);
    if (result.archived.length === 0) {
      process.stdout.write(`- 0 tasks archived (${result.retained.length} tasks retained in .agents/docs/tasks/done/)\n`);
    } else {
      process.stdout.write(`- Archived ${result.archived.length} task(s):\n`);
      for (const item of result.archived) {
        process.stdout.write(`  • ${item.file} (${item.ageDays}d old) -> ${item.destPath}\n`);
      }
      process.stdout.write(`- ${result.retained.length} task(s) retained in active done folder.\n`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
