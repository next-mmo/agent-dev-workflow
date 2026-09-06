---
name: agent-workflow-release
description: "Prepare a human-reviewable production release readiness package. Verifies strict workflow ceremony, automated checks, zero-downtime migration safety, configuration/secrets, and rollback procedures. Never authorizes release autonomously."
---

# Production Release Readiness

Prepare a deterministic, human-verifiable release readiness package before deploying to production, promoting database migrations, or cutting a version release. This skill compiles verified evidence; humans own deployment authorization and execution.

## Automated Release Gates

Run the verification pipeline to establish baseline integrity:

```bash
# 1. Strict ceremony and task verification
agent-workflow check --mode strict

# 2. Scope and acceptance verification
agent-workflow verify

# 3. Security and defensive review
agent-workflow review
```

All three automated gates must exit 0 without warnings or unaddressed blockers.

## Release Readiness Evidence Package

Compile the following 8-point evidence package for the human release owner:

### 1. Release Target & Identity
- Target version, tag, and exact Git commit SHA (`git rev-parse HEAD`).
- Confirmed merge base against main/production (`git merge-base origin/main HEAD`).
- Scoped task IDs and resolved PR numbers included in this release.

### 2. Automated Test & Build Verification
- Fresh execution timestamp of test suites, lint, and type checks.
- Production build status (e.g., bundle size, asset hashes, compiler output).
- Package distribution parity (`node scripts/build-distribution.mjs --check` where applicable).

### 3. Database Migration & Schema Compatibility
- Are schema migrations included? If yes, verify:
  - Additive / backward-compatible: Does old code run safely against the new schema?
  - Locking risks: Does migration acquire exclusive table locks that degrade production?
  - Automated rollback: Has the down-migration script been verified in staging?
  - Data backfills: Are backfill jobs batched and running asynchronously without holding transactions?

### 4. Configuration & Environment Dependencies
- List all new, modified, or deprecated environment variables.
- Verify secrets are present in production secret management (e.g. Vault, AWS Secrets Manager) before application deployment.
- Confirm fail-fast validation behavior on missing configuration.

### 5. Telemetry & Monitoring Coverage
- Healthcheck endpoints (`/healthz`, `/live`, `/ready`) verified functional.
- Core business and infrastructure metrics monitored (error rates, p95/p99 latency, queue depth).
- Alert channels and on-call notification pathways active.

### 6. Post-Deployment Verification (Smoke Test Plan)
- Specific synthetic transactions or end-to-end checks to run immediately post-deploy.
- Expected response codes and payloads on critical user paths.
- Designated timeframe for active monitoring (e.g. 15-minute soak period).

### 7. Rollback Strategy & Recovery Target
- Exact rollback command or redeployment target commit.
- Reverse migration procedure and data compatibility upon rollback.
- Named human operator responsible for initiating rollback if post-deploy smoke tests fail.

### 8. Final Approval Gate
- Named human release owner.
- Outstanding signoffs (security, compliance, domain lead) if required.
- Explicit confirmation: Agent never self-approves release or executes production writes.
