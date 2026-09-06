import assert from "node:assert/strict";
import test from "node:test";
import app from "../server.mjs";

test("serves the API and browser entry point", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const api = await fetch(`http://127.0.0.1:${port}/api/hello`);
    assert.equal(api.status, 200);
    assert.deepEqual(await api.json(), { message: "Welcome to Full-Stack Tutor" });

    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Full-Stack Tutor/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("returns topics list", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/topics`);
    assert.equal(res.status, 200);
    const topics = await res.json();
    assert.ok(Array.isArray(topics));
    assert.ok(topics.length >= 3);
    assert.equal(topics[0].id, "frontend");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("returns sanitized questions without leaking answers", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/questions?topic=frontend`);
    assert.equal(res.status, 200);
    const questions = await res.json();
    assert.ok(questions.length > 0);
    assert.equal(questions[0].topic, "frontend");
    assert.equal(questions[0].correctIndex, undefined, "correctIndex must be sanitized");
    assert.ok(Array.isArray(questions[0].options));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("validates answer submission via /api/check", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    
    // Correct answer for fe-1 is index 1 (GET)
    const resCorrect = await fetch(`http://127.0.0.1:${port}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "fe-1", selectedIndex: 1 }),
    });
    assert.equal(resCorrect.status, 200);
    const dataCorrect = await resCorrect.json();
    assert.equal(dataCorrect.correct, true);
    assert.equal(dataCorrect.correctIndex, 1);
    assert.ok(dataCorrect.explanation.includes("GET"));

    // Incorrect answer for fe-1
    const resWrong = await fetch(`http://127.0.0.1:${port}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "fe-1", selectedIndex: 0 }),
    });
    assert.equal(resWrong.status, 200);
    const dataWrong = await resWrong.json();
    assert.equal(dataWrong.correct, false);
    assert.equal(dataWrong.correctIndex, 1);

    // Not found question
    const resNotFound = await fetch(`http://127.0.0.1:${port}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: "unknown-id", selectedIndex: 0 }),
    });
    assert.equal(resNotFound.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("handles learner progress lifecycle (read, update, validation, reset)", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();

    // 1. Initial / clean state
    const initialRes = await fetch(`http://127.0.0.1:${port}/api/progress`);
    assert.equal(initialRes.status, 200);
    const initial = await initialRes.json();
    assert.equal(typeof initial.score, "number");
    assert.ok(Array.isArray(initial.completedQuestions));

    // 2. Valid update
    const updateRes = await fetch(`http://127.0.0.1:${port}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: 30,
        streak: 3,
        bestStreak: 5,
        completedQuestions: ["fe-1", "fe-2", "be-1"],
      }),
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.ok, true);
    assert.equal(updated.progress.score, 30);
    assert.equal(updated.progress.streak, 3);
    assert.equal(updated.progress.bestStreak, 5);
    assert.deepEqual(updated.progress.completedQuestions, ["fe-1", "fe-2", "be-1"]);

    // 3. Validation rejects negative score
    const invalidRes = await fetch(`http://127.0.0.1:${port}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: -10,
        streak: 1,
        bestStreak: 1,
        completedQuestions: [],
      }),
    });
    assert.equal(invalidRes.status, 400);

    // 4. Validation rejects non-array completedQuestions
    const invalidArrayRes = await fetch(`http://127.0.0.1:${port}/api/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: 10,
        streak: 1,
        bestStreak: 1,
        completedQuestions: "invalid",
      }),
    });
    assert.equal(invalidArrayRes.status, 400);

    // 5. Reset progress
    const resetRes = await fetch(`http://127.0.0.1:${port}/api/progress/reset`, {
      method: "POST",
    });
    assert.equal(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.equal(resetData.ok, true);
    assert.equal(resetData.progress.score, 0);
    assert.equal(resetData.progress.streak, 0);
    assert.deepEqual(resetData.progress.completedQuestions, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

