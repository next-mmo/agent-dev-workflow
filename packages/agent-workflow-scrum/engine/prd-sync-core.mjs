import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readdir } from "node:fs/promises";

export async function syncLivingPRDs({
  root = process.cwd(),
  dryRun = false,
} = {}) {
  const prdDir = path.join(root, ".agents", "docs", "prd");
  const entries = await readdir(prdDir, { withFileTypes: true });
  const prdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md") && e.name !== "0000-prd-index.md")
    .map((e) => e.name);

  // Read code files to detect implemented capabilities
  let codeBase = "";
  for (const file of ["src/counter-state.js", "src/main.js", "src/audio.js"]) {
    try {
      codeBase += "\n" + await readFile(path.join(root, file), "utf8");
    } catch {
      // Ignored
    }
  }

  const syncResults = [];

  for (const filename of prdFiles) {
    const prdPath = path.join(prdDir, filename);
    const content = await readFile(prdPath, "utf8");
    const lines = content.split(/\r?\n/);
    let updated = false;
    const modifiedLines = [];
    const syncedItems = [];

    for (const line of lines) {
      const match = line.match(/^(\s*-\s*\[\s*\]\s*)(.+)$/);
      if (match) {
        const prefix = match[1];
        const criterion = match[2].trim();
        let matchesCode = false;

        if (/increment/i.test(criterion) && codeBase.includes("increment()")) matchesCode = true;
        else if (/decrement/i.test(criterion) && codeBase.includes("decrement()")) matchesCode = true;
        else if (/reset/i.test(criterion) && codeBase.includes("reset()")) matchesCode = true;
        else if (/undo/i.test(criterion) && codeBase.includes("undo()")) matchesCode = true;
        else if (/theme/i.test(criterion) && codeBase.includes("toggleTheme()")) matchesCode = true;
        else if (/step/i.test(criterion) && codeBase.includes("step")) matchesCode = true;
        else if (/target|goal/i.test(criterion) && codeBase.includes("target")) matchesCode = true;
        else if (/audio|sound/i.test(criterion) && codeBase.includes("SoundManager")) matchesCode = true;

        if (matchesCode) {
          modifiedLines.push(line.replace("-[ ]", "- [x]").replace("-[ ]", "- [x]"));
          syncedItems.push(criterion);
          updated = true;
          continue;
        }
      }
      modifiedLines.push(line);
    }

    if (updated && !dryRun) {
      await writeFile(prdPath, modifiedLines.join("\n"), "utf8");
    }

    syncResults.push({
      file: path.relative(root, prdPath).replaceAll("\\", "/"),
      updated,
      syncedCriteria: syncedItems,
    });
  }

  return {
    ok: true,
    dryRun,
    syncedPRDs: syncResults,
  };
}
