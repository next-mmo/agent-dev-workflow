import { runMultiAgentReview, formatReviewReport } from "./review-core.mjs";

function parseArgs(argv) {
  const options = { base: "", json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--base") options.base = argv[++i] || "";
    else if (argv[i] === "--json") options.json = true;
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const review = await runMultiAgentReview({ base: options.base });
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
