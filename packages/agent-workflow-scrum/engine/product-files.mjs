import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadWorkflowConfigSync, matchesPathGroup } from "./workflow-config.mjs";
import { loadIgnoreFilterSync } from "./ignore-core.mjs";

/** Both local indexes discover JS/TS product files from the consumer path contract. */
export async function collectProductCodeFiles(root) {
  const config = loadWorkflowConfigSync(root);
  const ignore = loadIgnoreFilterSync(root, config);
  const prefixes = config.paths.product.map((pattern) => {
    const normalized = pattern.replace(/^\.\//, "");
    const firstWildcard = normalized.indexOf("*");
    const literal = firstWildcard < 0 ? normalized : normalized.slice(0, firstWildcard);
    return literal.slice(0, literal.lastIndexOf("/") + 1);
  });
  const files = [];
  async function walk(directory, relative = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = relative ? `${relative}/${entry.name}` : entry.name;
      if (ignore.isIgnored(file) || ignore.isIgnored(`${file}/`)) continue;
      if (entry.isDirectory()) {
        if ([".git", "node_modules", ".worktrees"].includes(entry.name)) continue;
        if (!prefixes.some((prefix) => prefix.startsWith(`${file}/`) || `${file}/`.startsWith(prefix))) continue;
        await walk(path.join(directory, entry.name), file);
      } else if (entry.isFile() && /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/.test(file) && matchesPathGroup(file, config, "product")) {
        files.push(file);
      }
    }
  }
  await walk(root);
  return files.sort();
}
