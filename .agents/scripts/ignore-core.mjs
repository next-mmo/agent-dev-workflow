import { readFileSync } from "node:fs";
import path from "node:path";

function globToRegex(pattern) {
  let normalized = pattern.replaceAll("\\", "/").trim();
  if (normalized.startsWith("/")) normalized = normalized.slice(1);
  const isDirectoryOnly = normalized.endsWith("/");
  if (isDirectoryOnly) normalized = normalized.slice(0, -1);

  let regexStr = "^";
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (char === "*" && normalized[index + 1] === "*") {
      if (normalized[index + 2] === "/") {
        regexStr += "(?:.+/)?";
        index += 3;
      } else {
        regexStr += ".*";
        index += 2;
      }
    } else if (char === "*") {
      regexStr += "[^/]*";
      index += 1;
    } else if (char === "?") {
      regexStr += "[^/]";
      index += 1;
    } else if (/[.+^${}()|[\]\\]/.test(char)) {
      regexStr += `\\${char}`;
      index += 1;
    } else {
      regexStr += char;
      index += 1;
    }
  }

  if (isDirectoryOnly) {
    regexStr += "(?:/.*)?$";
  } else {
    regexStr += "(?:/.*)?$";
  }

  return new RegExp(regexStr);
}

export function parseIgnoreLines(content) {
  return String(content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function createIgnoreMatcher(patterns = []) {
  const matchers = patterns.map((pattern) => ({
    raw: pattern,
    regex: globToRegex(pattern),
  }));

  return function isIgnored(relativePath) {
    const normalized = relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
    return matchers.some(({ regex }) => regex.test(normalized));
  };
}

export function loadIgnoreFilterSync(root = process.cwd(), config = {}) {
  const patterns = new Set(config.ignore || []);
  const candidateFiles = [".agentignore", ".cursorignore"];

  for (const filename of candidateFiles) {
    try {
      const content = readFileSync(path.join(root, filename), "utf8");
      for (const line of parseIgnoreLines(content)) {
        patterns.add(line);
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const isMatch = createIgnoreMatcher([...patterns]);
  return {
    patterns: [...patterns],
    isIgnored: isMatch,
  };
}
