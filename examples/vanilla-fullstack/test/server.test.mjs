import assert from "node:assert/strict";
import test from "node:test";
import app from "../server.mjs";

test("serves the API and browser entry point", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const api = await fetch(`http://127.0.0.1:${port}/api/hello`);
    assert.equal(api.status, 200);
    assert.deepEqual(await api.json(), { message: "Hello from Express" });

    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Vanilla Fullstack/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
