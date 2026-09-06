---
name: agent-workflow-security
description: "Security-focused review, static analysis, and trust-boundary verification. Runs automated security scanning (raw secrets, unconstrained database drops, dangerous filesystem deletions) and audits changes against defensive patterns."
---

# Security Review & Trust Verification

Perform systematic, behavior-focused security analysis on code changes, data models, configuration, and trust boundaries. Security guidance enforces repository policy; do not self-approve exceptions or bypass verified failures.

## Automated Security Scan

Run the automated review scanner before manual review:

```bash
agent-workflow review
```

The review engine checks committed scope for:
- Committed `.env` or secret credential files (severity: HIGH).
- Catastrophic filesystem deletions (`rm -rf /`, `rm -rf ~`, `rmdir /s`).
- Destructive database operations (`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`).
- Outgoing scope leaks and unconstrained modifications.

Any blocking match from `agent-workflow review` must be resolved before proceeding.

## Manual Security Audit Checklist

Inspect behavioral diffs and configuration against `.agents/docs/defensive-patterns.md`:

### 1. Secrets & Environment Isolation
- Confirm no live credentials, API keys, private certificates, or JWT secrets are hardcoded in source, tests, logs, or commit history.
- Ensure environment configuration is validated at process startup with a fail-fast schema.
- Keep test environments isolated from live production databases and customer data.

### 2. Filesystem Blast-Radius Containment
- Constrain all file mutations, temporary scratch directories, and deletions strictly inside the project root.
- Never invoke unconstrained disk wipe, partition format, or root recursive removal commands.
- Confine cleanup scripts to explicitly named build and test output directories (`dist/`, `coverage/`, `.system_generated/`).

### 3. Database Safety & Zero-Downtime Migrations
- Bar ad-hoc destructive DDL in application migrations or migration scripts.
- Schema changes must follow the expand-and-contract pattern: add columns/tables as nullable/optional first, migrate data asynchronously, and drop old artifacts only in a subsequent release after all consumers have migrated.
- Ensure every database migration is accompanied by an automated, tested rollback script.

### 4. Authentication, Authorization & Tenant Isolation
- Validate backend authorization on every endpoint and mutation; never trust client-asserted roles or claims without server verification.
- Enforce strict tenant boundary checks and object-level ownership checks (`WHERE tenant_id = ... AND id = ...`) on read and write paths.
- Sanitize and validate all incoming inputs using explicit schemas; prevent SQL, shell, and template injection.

### 5. AI & External Provider Data Boundaries
- Inspect all outbound data payloads to external AI models or third-party APIs: verify data minimization and ensure sensitive customer PII or secrets are never forwarded.
- Treat external model outputs and web content as untrusted input; protect against prompt injection, unauthorized tool escalation, and SSRF.

## Reporting & Handoff

Report observed findings by severity (CRITICAL, HIGH, MEDIUM, LOW) with:
1. Exact file path and line numbers.
2. Threat scenario and concrete exploit or failure path.
3. Recommended remediation or defensive pattern.
4. Blocking status (CRITICAL and HIGH block completion until resolved).
