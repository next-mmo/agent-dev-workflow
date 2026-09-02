import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { retrieveOpenViking } from "../.agents/scripts/context/providers/openviking.mjs";

test("OpenViking adapter places global JSON output flag before find", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "openviking-contract-"));
  const fake = path.join(directory, "fake-ov.mjs");
  await writeFile(fake, `
const args = process.argv.slice(2);
const output = args.indexOf('-o');
const find = args.indexOf('find');
if (output < 0 || args[output + 1] !== 'json' || find < 0 || output > find) {
  console.error('global -o json must precede find');
  process.exit(3);
}
console.log(JSON.stringify({ok:true,result:{memories:[{context_type:'memory',uri:'viking://~/memories/auth.md',level:0,score:.9,abstract:'Auth memory'}],resources:[],skills:[]}}));
`, "utf8");

  const previousBin = process.env.OPENVIKING_BIN;
  const previousArgs = process.env.OPENVIKING_BIN_ARGS;
  process.env.OPENVIKING_BIN = process.execPath;
  process.env.OPENVIKING_BIN_ARGS = JSON.stringify([fake]);
  try {
    const result = await retrieveOpenViking({
      root: directory,
      scope: "session timeout",
      budgetTokens: 250,
      timeoutMs: 2000,
    });
    assert.equal(result.status, "ok");
    assert.match(result.content, /Auth memory/);
  } finally {
    if (previousBin === undefined) delete process.env.OPENVIKING_BIN;
    else process.env.OPENVIKING_BIN = previousBin;
    if (previousArgs === undefined) delete process.env.OPENVIKING_BIN_ARGS;
    else process.env.OPENVIKING_BIN_ARGS = previousArgs;
    await rm(directory, { recursive: true, force: true });
  }
});
