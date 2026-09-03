import path from "node:path";
import { createPlan } from "./plan-core.mjs";

function parseArgs(argv) {
  const options = { title: "", json: false, root: process.cwd() };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = path.resolve(argv[++index] || "");
    else if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}`);
    else positional.push(arg);
  }
  options.title = positional.join(" ").trim();
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (!options.title) {
    console.error("Usage: agent-workflow plan <title> [--json] [--root <path>]");
    process.exitCode = 1;
  } else {
    const result = await createPlan({
      root: options.root,
      title: options.title,
    });
    if (options.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write(`Created technical plan: ${result.relativePath} (Plan ${result.id}: ${result.title})\n`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
