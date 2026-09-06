# CI Scope and Modes

The source repository's [CI workflow](../../.github/workflows/ci.yml) runs tests, the production build, workflow consistency, documentation checks, and the skill audit. These remain separate checks: the workflow checker validates metadata and does not run product tests or prove semantic acceptance.

## Event scope

Checkout uses the event's `github.sha` with `fetch-depth: 0`. The [CI entry point](../../scripts/ci-workflow-check.mjs) validates full commit IDs from `GITHUB_EVENT_PATH` and requires local `HEAD` to match `GITHUB_SHA`.

| Event | Comparison base | Checked head |
| :--- | :--- | :--- |
| Pull request | Event `pull_request.base.sha` | GitHub's merge commit, with the event base and PR head as its parents |
| Push to main | Event `before` | Event `after`, which must equal `GITHUB_SHA` |

The helper also supports an explicitly checked-out PR head. It passes resolved base/head IDs to the shipped checker so committed changes are included on clean checkouts. Pushes compare the entire update, including product changes earlier than the final commit. No branch names or PR text are interpolated into shell commands.

Missing, malformed, all-zero, unavailable, or mismatched commits fail. Non-fast-forward pushes fail because merge-base scope would omit removed history. Fetch the exact event commits and rerun for missing history. A new branch or rewritten history needs a separate reviewed baseline; the helper does not guess one or silently skip synchronization. Local review can use `npm run workflow:check -- --base <verified-ref> --mode strict` with that explicitly selected baseline.

## Mode enforcement

CI always passes `--mode strict`, overriding both repository and environment defaults. Local development and consumers keep their configured modes.

| Mode | Product task, linked PRD, acceptance section, nonempty evidence | Recovery section | Context budget overflow |
| :--- | :--- | :--- | :--- |
| `vibe` | Relaxed | Optional | Warning unless `--strict-budget` |
| `standard` | Required | Optional | Warning unless `--strict-budget` |
| `guided` | Required, with remediation tips | Optional | Warning unless `--strict-budget` |
| `strict` | Required | Required | Failure |

Style-only product changes retain the checker's fast path. Broken links and invalid lifecycle state remain checked in every mode. `--strict-budget` alone never selects strict mode. Section presence cannot establish that tests passed or a recovery procedure works; reviewers must inspect the evidence.

## Verification and enforcement boundary

[Regression fixtures](../../tests/ci-workflow.test.mjs) exercise real committed histories, merged PRs, multi-commit pushes, incomplete task records, override precedence, and failure diagnostics through the actual CI entry point and shipped checker.

Maintainers must separately configure required status checks and protect workflow/policy changes through GitHub rulesets and review ownership. A workflow file cannot prevent a contributor with sufficient permissions from modifying or bypassing that workflow.
