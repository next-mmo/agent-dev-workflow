import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CONFIG_PATH, DEFAULT_MODE, SUPPORTED_MODES, loadWorkflowConfig } from "./workflow-config.mjs";

export async function getWorkflowMode(root = process.cwd()) {
  const config = await loadWorkflowConfig(root);
  return config.mode || DEFAULT_MODE;
}

export async function setWorkflowMode(newMode, root = process.cwd()) {
  const targetMode = String(newMode || "").trim().toLowerCase();
  if (!SUPPORTED_MODES.includes(targetMode)) {
    throw new Error(`invalid workflow mode '${newMode}'; expected one of: ${SUPPORTED_MODES.join(", ")}`);
  }

  const configPath = path.join(root, CONFIG_PATH);
  let raw = {};
  try {
    raw = JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  raw.schemaVersion = raw.schemaVersion || 1;
  raw.mode = targetMode;

  await writeFile(configPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  return targetMode;
}
