# PRD-0001: Learner Progress & Stats Persistence

> Status: done  
> Created: 2026-09-06  
> Updated: 2026-09-07  
> Plan: [.agents/docs/plans/0001-progress-persistence-learner-stats.md](../plans/0001-progress-persistence-learner-stats.md)  
> Related Tasks: `.agents/docs/tasks/done/done-0001-learner-progress.md`

## 1. Problem Statement

Learners practicing full-stack questions lose their scores, challenge streaks, and completed questions whenever they refresh the browser or close their session. They need reliable persistence without needing a heavy multi-user database or account setup.

## 2. Product Requirements & Rules

1. **Stats Dashboard:** Display Score, Current Streak (🔥), and Best Streak (⭐) on the main interface.
2. **Persistence:** Automatically cache stats in `localStorage` on the client and synchronize with the Express backend via `/api/progress`.
3. **Streak Logic:**
   - Correct answer: increments current streak (+1). If current streak exceeds best streak, updates best streak.
   - Incorrect answer: resets current streak to 0 while preserving score and best streak.
4. **Input Validation:** Reject malformed server payloads (e.g., negative score/streak or non-array question IDs) with `400 Bad Request` without corrupting existing progress.
5. **Reset Capability:** Provide a one-click Reset button to cleanly restore all stats back to 0.

## 3. Acceptance Criteria

- [x] Correct answers increment Score by 10 and Streak by 1.
- [x] Incorrect answers reset Streak to 0.
- [x] Stats survive browser reload (`localStorage` + `/api/progress`).
- [x] Reset button restores score, streak, and completed questions to initial zeroed state.
- [x] Automated unit tests verify all `/api/progress` API scenarios and validation bounds.
