# Plan 0001: Progress Persistence & Learner Stats

> **Status:** completed
> **Created:** 2026-09-06
> **Updated:** 2026-09-07
> **PRD:** [PRD Index](../prd/0000-prd-index.md)
> **Associated Tasks:** [Task Board](../tasks/README.md)

## Outcome and Scope

### Intended Outcome
Enable learners using Full-Stack Tutor to retain their learning progress across browser reloads and sessions, tracking score, streaks, and completed challenges.

### Affected Components
- `server.mjs`: In-memory persistence endpoints (`GET /api/progress`, `POST /api/progress`, `POST /api/progress/reset`).
- `public/app.js`: Client-side `localStorage` integration with graceful server synchronization.
- `public/index.html`: Stats dashboard bar (Score, Current Streak, Best Streak, Reset button).
- `test/server.test.mjs`: Automated unit test suite covering progress persistence and validation.

### Non-Goals
- Multi-user authentication / password management (kept light and zero-auth for rapid prototyping).
- External database engines (PostgreSQL/MongoDB) at this stage.

## Design

### Data Contract
```json
{
  "score": 30,
  "streak": 3,
  "bestStreak": 5,
  "completedQuestions": ["fe-1", "fe-2", "be-1"],
  "lastActive": "2026-09-07T00:00:00.000Z"
}
```

### API Endpoints
- `GET /api/progress`: Returns current progress snapshot.
- `POST /api/progress`: Accepts and validates progress updates.
  - Invariants: `score >= 0`, `streak >= 0`, `completedQuestions` is an array of strings.
  - Rejects malformed updates with `400 Bad Request` without corrupting existing state.
- `POST /api/progress/reset`: Resets state to zero defaults.

### Client-Side Data Flow
1. On app boot, `app.js` checks `localStorage.getItem("fullstack_tutor_progress")`.
2. App queries `GET /api/progress` to sync or initialize.
3. When answering a question:
   - Correct answer: increments `score` (+10), increments `streak`, updates `bestStreak`, adds question ID to `completedQuestions`.
   - Wrong answer: resets `streak` to 0, preserves `score` and `bestStreak`.
4. Saves locally to `localStorage` and syncs asynchronously via `POST /api/progress`.

## Verification and Recovery

### Verification Plan
- Unit tests in `test/server.test.mjs`:
  - `GET /api/progress` returns default zeroed stats.
  - `POST /api/progress` persists valid score/streak updates.
  - `POST /api/progress` rejects invalid inputs (negative score, non-array questions).
  - `POST /api/progress/reset` reverts state to clean initial defaults.
- Running `npm test` and `npm exec -- agent-workflow check`.

### Recovery & Rollback Path
- Calling `POST /api/progress/reset` or clearing `localStorage` cleanly restores initial state without breaking app execution.
