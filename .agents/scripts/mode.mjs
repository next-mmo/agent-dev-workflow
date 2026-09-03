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
      const isTTY = process.stdout.isTTY;
      const green = (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
      const bold = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);
      const dim = (s) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);

      process.stdout.write(`\n${bold("Workflow Ceremony Mode:")} ${green(current)}\n\n`);
      process.stdout.write(`Available modes:\n`);
      const descriptions = {
        vibe: "solo rapid prototyping; task/PRD sync relaxed",
        standard: "balanced Scrum; task/PRD/evidence tracking",
        strict: "regulated enterprise; strict budgets & rollback verification",
        guided: "learner scaffolding; friendly remediation tips",
      };
      for (const m of SUPPORTED_MODES) {
        const activeMarker = m === current ? green("● [active]") : dim("○         ");
        process.stdout.write(`  ${activeMarker} ${bold(m.padEnd(9))} ${dim(descriptions[m])}\n`);
      }
      process.stdout.write(`\nSwitch anytime: ${bold("agent-workflow mode <mode>")}\n\n`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
