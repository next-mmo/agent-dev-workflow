import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectProductCodeFiles } from "./product-files.mjs";

export async function buildCodebaseIndex({ root = process.cwd() } = {}) {
  const codeFiles = await collectProductCodeFiles(root);

  const nodes = [];
  const edges = [];
  const symbolIndex = {};

  for (const relPath of codeFiles) {
    const absPath = path.join(root, relPath);
    const content = await readFile(absPath, "utf8");

    const functions = [];
    const classes = [];
    const exports = [];
    const imports = [];

    // Extract imports
    const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+["']([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const symbols = (match[1] || match[2] || match[3] || "").split(",").map((s) => s.trim()).filter(Boolean);
      const from = match[4];
      imports.push({ symbols, from });
      edges.push({ source: relPath, target: from, type: "import", symbols });
    }

    // Extract function declarations and exports
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      functions.push(name);
      symbolIndex[name] = { file: relPath, type: "function" };
    }

    // Extract class declarations
    const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const name = match[1];
      classes.push(name);
      symbolIndex[name] = { file: relPath, type: "class" };
    }

    // Extract named exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    nodes.push({
      id: relPath,
      file: relPath,
      functions,
      classes,
      exports,
      imports,
      lineCount: content.split("\n").length,
    });
  }

  const graph = {
    version: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      filesIndexed: nodes.length,
      symbolsIndexed: Object.keys(symbolIndex).length,
      edgesCount: edges.length,
    },
    nodes,
    edges,
    symbols: symbolIndex,
  };

  const outDir = path.join(root, "graphify-out");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "graph.json"), JSON.stringify(graph, null, 2), "utf8");

  return {
    ok: true,
    stats: graph.stats,
    outPath: path.join("graphify-out", "graph.json").replaceAll("\\", "/"),
  };
}
