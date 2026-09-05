import { readFile } from "node:fs/promises";

/** A consumer template overrides the packaged default; unreadable overrides fail. */
export async function readTemplate(overridePath, packageName) {
  try {
    return await readFile(overridePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return readFile(new URL(`../templates/${packageName}`, import.meta.url), "utf8");
  }
}
