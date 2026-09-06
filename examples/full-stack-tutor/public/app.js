const messageEl = document.querySelector("#message");
const scoreValEl = document.querySelector("#scoreVal");
const streakValEl = document.querySelector("#streakVal");
const bestStreakValEl = document.querySelector("#bestStreakVal");
const syncIndicatorEl = document.querySelector("#syncIndicator");
const resetStatsBtnEl = document.querySelector("#resetStatsBtn");
const topicChipsEl = document.querySelector("#topicChips");
const quizTopicTagEl = document.querySelector("#quizTopicTag");
const quizCounterEl = document.querySelector("#quizCounter");
const questionTextEl = document.querySelector("#questionText");
const optionsContainerEl = document.querySelector("#optionsContainer");
const feedbackBoxEl = document.querySelector("#feedbackBox");
const feedbackVerdictEl = document.querySelector("#feedbackVerdict");
const feedbackExplanationEl = document.querySelector("#feedbackExplanation");
const nextBtnEl = document.querySelector("#nextBtn");

const STORAGE_KEY = "fullstack_tutor_progress";

let currentTopic = "all";
let questions = [];
let currentIndex = 0;

let progress = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  completedQuestions: [],
};

function updateStatsUI() {
  scoreValEl.textContent = progress.score;
  streakValEl.textContent = `🔥 ${progress.streak}`;
  bestStreakValEl.textContent = `⭐ ${progress.bestStreak}`;
}

// Load progress from localStorage and server
async function initProgress() {
  // 1. Read local cache first
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed.score === "number") progress = { ...progress, ...parsed };
      updateStatsUI();
    }
  } catch (e) {
    console.warn("Local storage unavailable:", e);
  }

  // 2. Fetch latest from server
  try {
    const res = await fetch("/api/progress");
    if (res.ok) {
      const serverData = await res.json();
      // Merge best of local vs server
      if (serverData.score > progress.score) {
        progress = serverData;
      }
      updateStatsUI();
      saveProgress(false);
      setSyncStatus("Synced");
    }
  } catch {
    setSyncStatus("Offline");
  }
}

function setSyncStatus(status) {
  if (syncIndicatorEl) syncIndicatorEl.textContent = status;
}

// Save progress locally & to server
async function saveProgress(syncServer = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn("Failed to write to localStorage:", e);
  }

  updateStatsUI();

  if (syncServer) {
    setSyncStatus("Syncing...");
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (res.ok) {
        setSyncStatus("Synced");
      } else {
        setSyncStatus("Sync error");
      }
    } catch {
      setSyncStatus("Saved locally");
    }
  }
}

// Reset progress handler
resetStatsBtnEl.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to reset your score and streak?")) return;

  progress = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    completedQuestions: [],
  };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  updateStatsUI();

  try {
    await fetch("/api/progress/reset", { method: "POST" });
    setSyncStatus("Reset");
  } catch {
    setSyncStatus("Reset locally");
  }
});

// Load welcome greeting
fetch("/api/hello")
  .then((res) => res.json())
  .then(({ message }) => {
    messageEl.textContent = message;
  })
  .catch(() => {
    messageEl.textContent = "Offline mode";
  });

// Load available tracks
async function loadTopics() {
  try {
    const res = await fetch("/api/topics");
    const topics = await res.json();
    topics.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.topic = t.id;
      btn.textContent = `${t.icon} ${t.name}`;
      btn.addEventListener("click", () => switchTopic(t.id));
      topicChipsEl.appendChild(btn);
    });
  } catch (err) {
    console.error("Failed to load topics:", err);
  }
}

// Switch track filter
async function switchTopic(topicId) {
  currentTopic = topicId;
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.topic === topicId);
  });
  currentIndex = 0;
  await loadQuestions();
}

// Load questions for selected track
async function loadQuestions() {
  try {
    feedbackBoxEl.classList.add("hidden");
    optionsContainerEl.replaceChildren();
    questionTextEl.textContent = "Loading challenges...";

    const url = currentTopic === "all" ? "/api/questions" : `/api/questions?topic=${currentTopic}`;
    const res = await fetch(url);
    questions = await res.json();

    if (!questions.length) {
      questionTextEl.textContent = "No challenges found for this track.";
      quizTopicTagEl.textContent = currentTopic;
      quizCounterEl.textContent = "0 / 0";
      return;
    }

    renderCurrentQuestion();
  } catch (err) {
    questionTextEl.textContent = "Failed to load questions from server.";
    console.error(err);
  }
}

// Render active question
function renderCurrentQuestion() {
  feedbackBoxEl.classList.add("hidden");
  feedbackBoxEl.className = "feedback-box hidden";
  optionsContainerEl.replaceChildren();

  const q = questions[currentIndex];
  quizTopicTagEl.textContent = q.topic;
  quizCounterEl.textContent = `Challenge ${currentIndex + 1} of ${questions.length}`;
  questionTextEl.textContent = q.question;

  q.options.forEach((optText, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = optText;
    btn.addEventListener("click", () => submitAnswer(q.id, index, btn));
    optionsContainerEl.appendChild(btn);
  });
}

// Submit answer to server for verification
async function submitAnswer(questionId, selectedIndex, selectedBtn) {
  const allOptionBtns = optionsContainerEl.querySelectorAll(".option-btn");
  allOptionBtns.forEach((b) => (b.disabled = true));

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedIndex }),
    });
    const result = await res.json();

    feedbackBoxEl.classList.remove("hidden");

    if (result.correct) {
      progress.score += 10;
      progress.streak += 1;
      if (progress.streak > progress.bestStreak) {
        progress.bestStreak = progress.streak;
      }
      if (!progress.completedQuestions.includes(questionId)) {
        progress.completedQuestions.push(questionId);
      }
      saveProgress(true);

      selectedBtn.classList.add("selected-correct");
      feedbackBoxEl.classList.add("correct");
      feedbackVerdictEl.textContent = "🎉 Correct!";
    } else {
      progress.streak = 0;
      saveProgress(true);

      selectedBtn.classList.add("selected-wrong");
      if (allOptionBtns[result.correctIndex]) {
        allOptionBtns[result.correctIndex].classList.add("selected-correct");
      }
      feedbackBoxEl.classList.add("wrong");
      feedbackVerdictEl.textContent = "❌ Not quite right";
    }

    feedbackExplanationEl.textContent = result.explanation;
  } catch (err) {
    feedbackBoxEl.classList.remove("hidden");
    feedbackVerdictEl.textContent = "Error checking answer.";
    console.error(err);
  }
}

// Next question handler
nextBtnEl.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % questions.length;
  renderCurrentQuestion();
});

// Setup default 'all' chip click
topicChipsEl.querySelector('[data-topic="all"]').addEventListener("click", () => switchTopic("all"));

// Initialize
initProgress();
loadTopics();
loadQuestions();
