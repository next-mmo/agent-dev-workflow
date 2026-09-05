import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = { json: false };
  for (const arg of argv) {
    if (arg === "--json") options.json = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  return options;
}

function displayPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

export async function describeSkills(argv, packageRoot) {
  const options = parseArgs(argv);
  const pluginRoot = path.join(packageRoot, "plugin");
  const skillsPath = path.join(pluginRoot, "skills");
  const available = await exists(skillsPath);
  const skillNames = available
    ? (await readdir(skillsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
    : [];
  const packageManifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  const result = {
    schemaVersion: 1,
    packageVersion: packageManifest.version,
    pluginRoot: displayPath(pluginRoot),
    skillsPath: displayPath(skillsPath),
    skillsAvailable: available,
    skillNames,
    activationRequired: true,
    repositorySkillsPath: null,
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return { ...result, json: true, output: "" };
  }
  const lines = [
    "Agent Workflow Scrum skills",
    `- Plugin root: ${result.pluginRoot}`,
    `- Skills path: ${result.skillsPath}`,
    `- Available: ${result.skillsAvailable ? "yes" : "no"}`,
    `- Skills: ${result.skillNames.length ? result.skillNames.join(", ") : "none"}`,
    "- Activation: load the plugin root or skills path through your agent host; npm installation does not activate skills",
    "- Repository .agents/skills: not created by init",
  ];
  return { ...result, json: false, output: `${lines.join("\n")}\n` };
}
