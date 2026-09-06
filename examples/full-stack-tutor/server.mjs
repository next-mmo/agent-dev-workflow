import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(root, "public")));

const TUTOR_TOPICS = [
  { id: "frontend", name: "Frontend Development", icon: "🎨" },
  { id: "backend", name: "Backend & APIs", icon: "⚙️" },
  { id: "database", name: "Databases & Storage", icon: "🗄️" },
];

const TUTOR_QUESTIONS = [
  {
    id: "fe-1",
    topic: "frontend",
    question: "What HTTP method is typically used to retrieve data from a server without modifying it?",
    options: ["POST", "GET", "PUT", "DELETE"],
    correctIndex: 1,
    explanation: "GET requests are safe and idempotent, intended solely for fetching resources without side effects.",
  },
  {
    id: "fe-2",
    topic: "frontend",
    question: "Which Web API method makes an asynchronous network HTTP request in modern browsers?",
    options: ["fetch()", "request()", "httpGet()", "query()"],
    correctIndex: 0,
    explanation: "fetch() is the standard promise-based modern API for making HTTP requests in browsers.",
  },
  {
    id: "be-1",
    topic: "backend",
    question: "In Express.js, what is the role of middleware functions?",
    options: [
      "To compile client-side CSS",
      "To intercept, inspect, or modify request and response objects",
      "To directly partition physical database disks",
      "To render browser canvas animations"
    ],
    correctIndex: 1,
    explanation: "Middleware functions have access to req, res, and the next() callback to execute common logic like parsing, logging, and auth.",
  },
  {
    id: "db-1",
    topic: "database",
    question: "Which database concept guarantees unique identification for every row in a relational table?",
    options: ["Foreign Key", "Index", "Primary Key", "View"],
    correctIndex: 2,
    explanation: "A Primary Key uniquely identifies each record in a relational database table and cannot contain null values.",
  },
];

app.get("/api/hello", (_request, response) => {
  response.json({ message: "Welcome to Full-Stack Tutor" });
});

app.get("/api/topics", (_request, response) => {
  response.json(TUTOR_TOPICS);
});

app.get("/api/questions", (request, response) => {
  const { topic } = request.query;
  const filtered = topic
    ? TUTOR_QUESTIONS.filter((q) => q.topic === topic)
    : TUTOR_QUESTIONS;

  // Return questions without leaking correctIndex to client before answering
  const sanitized = filtered.map(({ id, topic, question, options }) => ({
    id,
    topic,
    question,
    options,
  }));
  response.json(sanitized);
});

app.post("/api/check", (request, response) => {
  const { questionId, selectedIndex } = request.body || {};
  const found = TUTOR_QUESTIONS.find((q) => q.id === questionId);
  if (!found) {
    return response.status(404).json({ error: "Question not found" });
  }

  const isCorrect = found.correctIndex === Number(selectedIndex);
  response.json({
    correct: isCorrect,
    correctIndex: found.correctIndex,
    explanation: found.explanation,
  });
});

let learnerProgress = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  completedQuestions: [],
  lastActive: new Date().toISOString(),
};

app.get("/api/progress", (_request, response) => {
  response.json(learnerProgress);
});

app.post("/api/progress", (request, response) => {
  const { score, streak, bestStreak, completedQuestions } = request.body || {};

  // Validation against corrupted or invalid state
  if (
    typeof score !== "number" || score < 0 ||
    typeof streak !== "number" || streak < 0 ||
    typeof bestStreak !== "number" || bestStreak < 0 ||
    !Array.isArray(completedQuestions)
  ) {
    return response.status(400).json({
      error: "Invalid progress payload: score, streak, bestStreak must be non-negative numbers and completedQuestions must be an array",
    });
  }

  learnerProgress = {
    score,
    streak,
    bestStreak,
    completedQuestions: completedQuestions.filter((id) => typeof id === "string"),
    lastActive: new Date().toISOString(),
  };

  response.json({ ok: true, progress: learnerProgress });
});

app.post("/api/progress/reset", (_request, response) => {
  learnerProgress = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    completedQuestions: [],
    lastActive: new Date().toISOString(),
  };
  response.json({ ok: true, progress: learnerProgress });
});

export function startServer(initialPort = Number(process.env.PORT || 3000), maxAttempts = 10) {
  let currentPort = initialPort;
  let attempts = 0;

  function tryListen() {
    const server = app.listen(currentPort, () => {
      console.log(`Server running at http://localhost:${currentPort}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && attempts < maxAttempts) {
        attempts += 1;
        currentPort += 1;
        console.warn(`Port ${currentPort - 1} is busy, trying http://localhost:${currentPort}...`);
        tryListen();
      } else {
        console.error("Failed to start server:", err);
      }
    });

    return server;
  }

  return tryListen();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export default app;
