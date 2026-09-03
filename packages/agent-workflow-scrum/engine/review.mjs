import { runMultiAgentReview, formatReviewReport } from "./review-core.mjs";
import path from "node:path";

function parseArgs(argv) {
  const options = { root: process.cwd(), base: "", json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base") options.base = argv[++i] || "";
    else if (argv[i] === "--json") options.json = true;
    else if (argv[i] === "--root") options.root = path.resolve(argv[++i] || "");
    else throw new Error(`unknown option: ${argv[i]}`);
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const review = await runMultiAgentReview(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(review, null, 2)}\n`);
  } else {
    process.stdout.write(formatReviewReport(review));
  }
  if (!review.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
