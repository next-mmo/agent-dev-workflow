import { createSolution } from "./solve-core.mjs";

function parseArgs(argv) {
  const options = { title: "", module: "src/", tags: ["bugfix", "pattern"], json: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") options.json = true;
    else if (arg === "--module") options.module = argv[++i] || "src/";
    else if (arg === "--tags") options.tags = (argv[++i] || "").split(",").map((t) => t.trim());
    else if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}`);
    else positional.push(arg);
  }
  options.title = positional.join(" ").trim();
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (!options.title) {
    console.error("Usage: agent-workflow solve <title> [--module <path>] [--tags <t1,t2>] [--json]");
    process.exitCode = 1;
  } else {
    const result = await createSolution(options);
    if (options.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      console.log(`Created compounding solution: ${result.relativePath} (Solution ${result.id}: ${result.title})`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
