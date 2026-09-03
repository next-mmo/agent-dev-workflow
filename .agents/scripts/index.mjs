import { buildCodebaseIndex } from "./index-core.mjs";

function parseArgs(argv) {
  const options = { json: false, root: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--root") options.root = argv[++index] || process.cwd();
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = await buildCodebaseIndex({ root: options.root });
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`Indexed codebase: ${result.stats.filesIndexed} files, ${result.stats.symbolsIndexed} symbols, ${result.stats.edgesCount} import edges -> ${result.outPath}\n`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
