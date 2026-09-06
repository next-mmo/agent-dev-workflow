---
name: agent-workflow-incident
description: "Safe operational assistance for production incidents, outages, or degraded services. Gathers read-only telemetry, diagnoses recent commits and migrations, and prepares mitigation options. Prohibits autonomous destructive writes or deployments."
---

# Incident Assistance & Outage Triage

Assist the designated human incident owner during live outages, service degradations, data corruption risks, or urgent operational failures. The agent acts as an analytical triage copilot: gathering evidence, evaluating change deltas, and drafting mitigations under strict read-only safety constraints.

## Incident Safety Principles

1. **Read-Only Autonomous Scope**: The agent may inspect logs, analyze code, diff commits, and draft hypotheses. The agent must NEVER autonomously execute production commands, trigger restarts, run database mutations, or trigger deployments.
2. **Surface Uncertainty Immediately**: If root cause, blast radius, or data loss potential is uncertain, explicitly highlight the unknown rather than providing false confidence.
3. **Protect the Handoff**: Keep all diagnoses structured, chronological, and concise for the human incident commander.

## Phase 1: Establish Incident Perimeter

Record and verify:
- **Observed Impact**: Exact symptoms (e.g., HTTP 500 spike, p99 latency surge, job worker starvation, auth failures).
- **Affected Services & Tiers**: Which microservices, database clusters, queues, or client versions are impacted.
- **Incident Timestamp**: Exact time of onset and detection.
- **Human Incident Owner**: Named engineer or on-call lead directing resolution.

## Phase 2: Differential Change Diagnosis

Most incidents are triggered by changes. Systematically cross-reference the onset time against recent mutations:

1. **Git Commit History**:
   ```bash
   git log -n 15 --oneline
   ```
2. **Recent Schema Migrations**:
   - Check if database migrations ran recently. Did they alter columns, add constraints, or lock tables?
3. **Environment & Configuration**:
   - Were environment variables, API credentials, feature flags, or secrets updated around onset?
4. **Third-Party Dependencies**:
   - Are downstream cloud APIs or external provider integrations experiencing outages or rate-limiting?

## Phase 3: Mitigation Strategy Formulation

Evaluate the safest path to restore service:

### Option A: Clean Rollback (Preferred when safe)
- Verify if the previous release commit is cleanly deployable.
- **Critical Check**: Did any database migration introduce irreversible schema or data changes that prevent the previous version from running?
- Provide exact rollback commit hash and deployment command for human execution.

### Option B: Forward-Fix / Safe Patch
- If database changes preclude rollback, identify the minimal surgical fix.
- Isolate the bug to the specific lines of code.
- Prepare a localized patch with targeted test verification before human review.

### Option C: Circuit Breaker / Degraded Mode
- Can a feature flag, rate limiter, or background queue be toggled to restore core availability while debugging continues?

## Phase 4: Post-Mitigation & Institutional Learning

Once service is stabilized:
1. Document the incident timeline: detection, diagnosis, mitigation, full recovery.
2. Formulate preventative tasks (missing telemetry, lack of circuit breaker, unconstrained query).
3. Log learnings and permanent preventative patterns into `.agents/docs/solutions/` using:
   ```bash
   agent-workflow compound
   ```
