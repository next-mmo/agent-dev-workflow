import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { loadIgnoreFilterSync } from "./ignore-core.mjs";

function getChangedFiles(root = process.cwd(), base = "") {
  const args = base ? ["diff", "--name-only", base] : ["status", "--short"];
  const res = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (res.status !== 0) return [];
  const lines = String(res.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  if (base) return lines;
  return lines.map((l) => l.slice(3).trim());
}

export async function runMultiAgentReview({
  root = process.cwd(),
  base = "",
  files = null,
} = {}) {
  const ignoreFilter = loadIgnoreFilterSync(root);
  const targetFiles = (files || getChangedFiles(root, base))
    .filter((f) => !ignoreFilter.isIgnored(f))
    .filter((f) => /\.(js|mjs|ts|html|css|json|md)$/.test(f));

  const securityFindings = [];
  const simplicityFindings = [];
  const parityFindings = [];

  const secretPatterns = [
    { name: "API Key / Token", regex: /['"][a-zA-Z0-9_-]*(?:api[_-]?key|secret|token|password)['"]\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{8,}['"]/i },
    { name: "Bearer Token", regex: /Bearer\s+[a-zA-Z0-9_\-\.]{16,}/i },
    { name: "Private Key Header", regex: /BEGIN (?:RSA )?PRIVATE KEY/ },
  ];

  const dangerousPatterns = [
    { name: "Dangerous eval()", regex: /\beval\s*\(/ },
    { name: "Dynamic Function Constructor", regex: /new\s+Function\s*\(/ },
    { name: "Raw innerHTML Assignment", regex: /\.innerHTML\s*=\s*[^"'][^;]+/ },
  ];

  for (const relPath of targetFiles) {
    if (relPath.includes("review-core.mjs")) continue;
    const absPath = path.join(root, relPath);
    let content = "";
    try {
      content = await readFile(absPath, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);

    // 1. Security Sentinel
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const pattern of secretPatterns) {
        if (pattern.regex.test(line) && !line.includes("test") && !line.includes("example")) {
          securityFindings.push({
            file: relPath,
            line: i + 1,
            severity: "HIGH",
            rule: pattern.name,
            message: `Potential hardcoded credential or secret detected: ${pattern.name}`,
          });
        }
      }
      for (const pattern of dangerousPatterns) {
        if (pattern.regex.test(line)) {
          securityFindings.push({
            file: relPath,
            line: i + 1,
            severity: "MEDIUM",
            rule: pattern.name,
            message: `Unsafe dynamic execution or DOM injection pattern: ${pattern.name}`,
          });
        }
      }
    }

    // 2. Simplicity Oracle
    if (relPath.endsWith(".js") || relPath.endsWith(".mjs")) {
      if (lines.length > 300) {
        simplicityFindings.push({
          file: relPath,
          severity: "LOW",
          rule: "File Length",
          message: `File is ${lines.length} lines long (consider splitting into focused modules)`,
        });
      }

      // Check for deeply nested blocks
      for (let i = 0; i < lines.length; i += 1) {
        const indent = lines[i].match(/^(\s*)/)[1].length;
        if (indent >= 20 && lines[i].trim().length > 0) { // 5 levels of 4 spaces
          simplicityFindings.push({
            file: relPath,
            line: i + 1,
            severity: "LOW",
            rule: "Excessive Nesting",
            message: `Deeply nested block (> 4 levels) detected`,
          });
          break; // Report at most once per file
        }
      }
    }

    // 3. Agent-Native Parity Reviewer
    if (relPath === "src/main.js" || relPath.includes("ui") || relPath.includes("controller")) {
      const buttonListeners = content.match(/addEventListener\s*\(\s*['"]click['"]/g) || [];
      const domainMethodCalls = content.match(/state\.[a-zA-Z0-9_$]+\s*\(/g) || [];
      if (buttonListeners.length > 0 && domainMethodCalls.length === 0) {
        parityFindings.push({
          file: relPath,
          severity: "MEDIUM",
          rule: "UI-Domain Parity",
          message: `UI event listeners found but no domain state methods called (ensure logic is headless testable)`,
        });
      }
    }
  }

  const passed = securityFindings.filter((f) => f.severity === "HIGH").length === 0;

  return {
    ok: passed,
    filesReviewed: targetFiles.length,
    findings: {
      security: securityFindings,
      simplicity: simplicityFindings,
      parity: parityFindings,
    },
    totalIssues: securityFindings.length + simplicityFindings.length + parityFindings.length,
  };
}

export function formatReviewReport(review) {
  const lines = [
    "# Multi-Agent Automated Review Report",
    "",
    `- Files inspected: ${review.filesReviewed}`,
    `- Overall status: ${review.ok ? "PASS" : "BLOCKING ISSUES DETECTED"}`,
    `- Total findings: ${review.totalIssues}`,
    "",
    "## 1. Security Sentinel",
  ];

  if (review.findings.security.length === 0) {
    lines.push("- PASS: Zero secrets, token leaks, or unsafe execution patterns found.");
  } else {
    for (const f of review.findings.security) {
      lines.push(`- [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
    }
  }

  lines.push("", "## 2. Simplicity Oracle");
  if (review.findings.simplicity.length === 0) {
    lines.push("- PASS: Code meets size and nesting complexity standards.");
  } else {
    for (const f of review.findings.simplicity) {
      lines.push(`- [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ""} — ${f.message}`);
    }
  }

  lines.push("", "## 3. Agent-Native Parity Reviewer");
  if (review.findings.parity.length === 0) {
    lines.push("- PASS: All UI actions map cleanly to headless domain state methods.");
  } else {
    for (const f of review.findings.parity) {
      lines.push(`- [${f.severity}] ${f.file} — ${f.message}`);
    }
  }

  return `${lines.join("\n").trim()}\n`;
}
