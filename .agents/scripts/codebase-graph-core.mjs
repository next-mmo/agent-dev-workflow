import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadWorkflowConfigSync } from "./workflow-config.mjs";
import { loadIgnoreFilterSync } from "./ignore-core.mjs";
import { readdir } from "node:fs/promises";

async function walkDir(dir, root, ignoreFilter) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(root, fullPath).replaceAll("\\", "/");
      if (ignoreFilter.isIgnored(relPath)) continue;

      if (entry.isDirectory()) {
        files.push(...await walkDir(fullPath, root, ignoreFilter));
      } else if (entry.isFile() && /\.(js|mjs|ts|jsx|tsx)$/.test(entry.name)) {
        files.push(relPath);
      }
    }
  } catch {
    // Directory might not exist
  }
  return files;
}

export function parseModuleSymbols(content, file) {
  const symbols = [];
  const edges = [];
  const lines = content.split(/\r?\n/);

  // 1. Extract Imports
  const importRegex = /import\s+(?:\{([^}]+)\}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))\s+from\s+["']([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const fromPath = match[4];
    const rawSymbols = (match[1] || match[2] || match[3] || "").split(",").map((s) => s.trim()).filter(Boolean);
    edges.push({
      type: "import",
      source: file,
      target: fromPath,
      symbols: rawSymbols,
    });
  }

  // 2. Extract Classes and Methods
  const classRegex = /(?:export\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?\s*\{/g;
  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    const extendsClass = match[2] || null;
    const startIndex = match.index;
    const lineNumber = content.slice(0, startIndex).split("\n").length;

    // Find class body to extract methods
    const classSymbol = {
      id: `${file}:${className}`,
      name: className,
      kind: "class",
      file,
      line: lineNumber,
      extends: extendsClass,
      methods: [],
    };

    // Scan methods in class
    const methodRegex = /(?:async\s+)?(?:static\s+)?([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{/g;
    methodRegex.lastIndex = startIndex;
    let methodMatch;
    let depth = 0;
    let foundOpen = false;
    for (let i = startIndex; i < content.length; i += 1) {
      if (content[i] === "{") { depth += 1; foundOpen = true; }
      else if (content[i] === "}") {
        depth -= 1;
        if (foundOpen && depth === 0) {
          const classBody = content.slice(startIndex, i + 1);
          let m;
          while ((m = methodRegex.exec(classBody)) !== null) {
            const mName = m[1];
            if (mName !== "if" && mName !== "while" && mName !== "switch" && mName !== "for") {
              const mParams = m[2].split(",").map((p) => p.trim()).filter(Boolean);
              classSymbol.methods.push({ name: mName, params: mParams });
            }
          }
          break;
        }
      }
    }

    symbols.push(classSymbol);
  }

  // 3. Extract Top-level Functions
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    const params = match[2].split(",").map((p) => p.trim()).filter(Boolean);
    const lineNumber = content.slice(0, match.index).split("\n").length;

    symbols.push({
      id: `${file}:${funcName}`,
      name: funcName,
      kind: "function",
      file,
      line: lineNumber,
      params,
    });
  }

  // 4. Extract Exported Constants
  const exportConstRegex = /export\s+const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:new\s+([a-zA-Z0-9_$]+)|[^;]+)/g;
  while ((match = exportConstRegex.exec(content)) !== null) {
    const constName = match[1];
    const instanceClass = match[2] || null;
    const lineNumber = content.slice(0, match.index).split("\n").length;

    symbols.push({
      id: `${file}:${constName}`,
      name: constName,
      kind: "const",
      file,
      line: lineNumber,
      instanceOf: instanceClass,
    });

    if (instanceClass) {
      edges.push({
        type: "instantiates",
        source: `${file}:${constName}`,
        target: instanceClass,
      });
    }
  }

  // 5. Extract Cross-Module Invocations (calls)
  const callRegex = /([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)\s*\(/g;
  while ((match = callRegex.exec(content)) !== null) {
    const receiver = match[1];
    const method = match[2];
    if (receiver !== "console" && receiver !== "Math" && receiver !== "JSON" && receiver !== "Object") {
      edges.push({
        type: "call",
        source: file,
        receiver,
        method,
      });
    }
  }

  return { symbols, edges };
}

export async function buildNativeCodebaseGraph({ root = process.cwd() } = {}) {
  const config = loadWorkflowConfigSync(root);
  const ignoreFilter = loadIgnoreFilterSync(root, config);

  const srcDir = path.join(root, "src");
  const codeFiles = await walkDir(srcDir, root, ignoreFilter);

  const allSymbols = [];
  const allEdges = [];
  const fileSummaries = [];

  for (const relPath of codeFiles) {
    const absPath = path.join(root, relPath);
    let content = "";
    try {
      content = await readFile(absPath, "utf8");
    } catch {
      continue;
    }

    const { symbols, edges } = parseModuleSymbols(content, relPath);
    allSymbols.push(...symbols);
    allEdges.push(...edges);

    fileSummaries.push({
      path: relPath,
      lines: content.split(/\r?\n/).length,
      symbolsCount: symbols.length,
    });
  }

  const graph = {
    version: 1,
    generatedAt: new Date().toISOString(),
    stats: {
      filesIndexed: fileSummaries.length,
      symbolsCount: allSymbols.length,
      edgesCount: allEdges.length,
    },
    files: fileSummaries,
    symbols: allSymbols,
    edges: allEdges,
  };

  const cacheDir = path.join(root, ".agents", "cache");
  await mkdir(cacheDir, { recursive: true });
  const graphFile = path.join(cacheDir, "codebase-graph.json");
  await writeFile(graphFile, JSON.stringify(graph, null, 2), "utf8");

  return {
    ok: true,
    stats: graph.stats,
    relativePath: path.relative(root, graphFile).replaceAll("\\", "/"),
    graph,
  };
}

export function queryNativeCodebaseGraph({ graph, scope = "", budgetTokens = 400 }) {
  if (!graph || !graph.symbols) {
    return { status: "unavailable", content: "", tokens: 0 };
  }

  const terms = scope.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return {
      status: "ok",
      content: `Codebase Graph: ${graph.stats.filesIndexed} files, ${graph.stats.symbolsCount} symbols, ${graph.stats.edgesCount} relationships.`,
      tokens: 25,
    };
  }

  const scoredSymbols = [];
  for (const symbol of graph.symbols) {
    let score = 0;
    const nameLower = symbol.name.toLowerCase();
    const fileLower = symbol.file.toLowerCase();

    for (const term of terms) {
      if (nameLower === term) score += 50;
      else if (nameLower.includes(term)) score += 30;

      if (fileLower.includes(term)) score += 20;

      if (symbol.methods) {
        for (const m of symbol.methods) {
          if (m.name.toLowerCase() === term) score += 40;
          else if (m.name.toLowerCase().includes(term)) score += 20;
        }
      }
    }

    if (score > 0) {
      scoredSymbols.push({ symbol, score });
    }
  }

  scoredSymbols.sort((a, b) => b.score - a.score);
  const topSymbols = scoredSymbols.slice(0, 5).map((item) => item.symbol);

  const lines = [
    `Native Code Graph: ${graph.stats.filesIndexed} files, ${graph.stats.symbolsCount} symbols indexed`,
  ];

  for (const sym of topSymbols) {
    if (sym.kind === "class") {
      const methodNames = sym.methods.map((m) => m.name).slice(0, 5).join(", ");
      lines.push(`- [class] ${sym.name} (${sym.file}:${sym.line}) -> methods: [${methodNames}${sym.methods.length > 5 ? "..." : ""}]`);
    } else if (sym.kind === "function") {
      lines.push(`- [func] ${sym.name}(${sym.params.join(", ")}) (${sym.file}:${sym.line})`);
    } else if (sym.kind === "const") {
      lines.push(`- [export] const ${sym.name}${sym.instanceOf ? ` = new ${sym.instanceOf}()` : ""} (${sym.file}:${sym.line})`);
    }

    // Find cross-module callers or connections
    const callers = graph.edges.filter((e) => (
      (e.type === "call" && e.method && sym.methods?.some((m) => m.name === e.method)) ||
      (e.type === "import" && e.symbols?.includes(sym.name))
    )).slice(0, 2);

    for (const edge of callers) {
      if (edge.type === "call") {
        lines.push(`  └── called by ${edge.source} via ${edge.receiver}.${edge.method}()`);
      } else if (edge.type === "import") {
        lines.push(`  └── imported by ${edge.source}`);
      }
    }
  }

  const content = lines.join("\n");
  const tokens = Math.max(1, Math.ceil(content.length / 4));

  return {
    status: "ok",
    content,
    tokens,
    matches: topSymbols.length,
  };
}
