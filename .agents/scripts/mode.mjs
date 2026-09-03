import path from "node:path";
import { getWorkflowMode, setWorkflowMode } from "./mode-core.mjs";
import { SUPPORTED_MODES } from "./workflow-config.mjs";

function parseArgs(argv) {
  const options = { mode: "", json: false, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (!options.mode && !arg.startsWith("-")) options.mode = arg;
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode) {
    const updated = await setWorkflowMode(options.mode, options.root);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: true, mode: updated }, null, 2)}\n`);
    } else {
      process.stdout.write(`workflow mode set to: ${updated}\n`);
    }
  } else {
    const current = await getWorkflowMode(options.root);
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: true, mode: current, supportedModes: SUPPORTED_MODES }, null, 2)}\n`);
    } else {
      process.stdout.write(`current workflow mode: ${current}\n\n`);
      process.stdout.write(`Switch mode anytime:\n`);
      process.stdout.write(`  npm run workflow:mode -- vibe       # solo / styling / no task ceremony\n`);
      process.stdout.write(`  npm run workflow:mode -- standard   # balanced Scrum (tasks + PRD + evidence)\n`);
      process.stdout.write(`  npm run workflow:mode -- strict     # enterprise (strict budgets + rollback proof)\n`);
      process.stdout.write(`  npm run workflow:mode -- guided     # learner (tips on check failures)\n`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
