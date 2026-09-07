import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const binary = fileURLToPath(new URL("../packages/agent-workflow-scrum/bin/agent-workflow.mjs", import.meta.url));

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim();
}

function commitSha(value, label) {
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/i.test(value)) {
    throw new Error(`${label} must be a full commit SHA from the GitHub event.`);
  }
  if (/^0+$/.test(value)) {
    throw new Error(`${label} has no previous commit (new/deleted branch); an explicit review baseline is required.`);
  }
  return value.toLowerCase();
}

function requireCommit(sha, label) {
  try {
    git("cat-file", "-e", `${sha}^{commit}`);
  } catch {
    throw new Error(`${label} commit ${sha} is unavailable; fetch the exact event history (checkout fetch-depth: 0) and rerun.`);
  }
}

try {
  const name = process.env.GITHUB_EVENT_NAME;
  if (!["pull_request", "push"].includes(name)) throw new Error(`unsupported event: ${name || "missing GITHUB_EVENT_NAME"}`);
  if (!process.env.GITHUB_EVENT_PATH) throw new Error("GITHUB_EVENT_PATH is required.");
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const head = commitSha(process.env.GITHUB_SHA, "GITHUB_SHA");
  const base = commitSha(name === "pull_request" ? event.pull_request?.base?.sha : event.before,
    name === "pull_request" ? "pull_request.base.sha" : "push.before");
  requireCommit(base, "base");
  requireCommit(head, "head");
  if (git("rev-parse", "HEAD") !== head) {
    throw new Error("checkout HEAD does not match GITHUB_SHA; check out the event commit before running CI.");
  }

  if (name === "pull_request") {
    const prHead = commitSha(event.pull_request?.head?.sha, "pull_request.head.sha");
    requireCommit(prHead, "PR head");
    // Accept the contributor head or GitHub's integration commit, never unrelated history.
    const parents = git("show", "-s", "--format=%P", head).split(" ");
    if (head !== prHead && !(parents.length === 2 && parents[0] === base && parents[1] === prHead)) {
      throw new Error("checkout must be the PR head or the merge of the event base and PR head; rerun with matching event history.");
    }
  } else {
    if (commitSha(event.after, "push.after") !== head) throw new Error("push.after does not match GITHUB_SHA.");
    const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", base, head], { encoding: "utf8" });
    if (ancestry.status !== 0) {
      throw new Error("non-fast-forward push or unreadable ancestry; review the replacement history with an explicit baseline before rerunning CI.");
    }
  }

  console.log(`ci-workflow: event=${name} base=${base} head=${head} mode=strict`);
  const result = spawnSync(process.execPath,
    [binary, "check", "--root", process.cwd(), "--base", base, "--head", head, "--mode", "strict"],
    { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`workflow checker terminated by ${result.signal}`);
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`ci-workflow: ${error.message}`);
  process.exitCode = 1;
}
