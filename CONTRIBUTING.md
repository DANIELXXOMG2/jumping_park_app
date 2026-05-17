# Contributing

Thanks for improving Jumping Park. Keep changes additive, production-safe, and aligned with the current service-layer + App Router architecture.

This file stays focused on contribution policy, review expectations, and release-safe change discipline.

## Start here

- Use `docs/guides/getting-started.md` for local setup, required services, and the first-run walkthrough.
- Use `docs/guides/testing.md` for the verification pyramid, CI parity, and command-level guidance.
- Use `docs/guides/deployment.md` when the slice changes runtime configuration, rollout flags, or release steps.
- Use `docs/runbooks/production-hardening.md` and `docs/runbooks/rollback-flags.md` when the change affects operational behavior.

## Workflow

1. Start from an SDD change when the work is more than a tiny fix.
2. Review the relevant proposal, tasks, active guides, and runbooks before editing code.
3. Implement the smallest safe slice first; prefer feature flags over risky cutovers.
4. Update docs and operational notes when behavior, rollout, or verification changes.
5. Open or request review with clear evidence of what changed and how it was verified.

## Engineering expectations

- Use Bun commands only.
- Keep API business logic in `src/services/`; routes should stay thin and use the existing handler/validation patterns.
- Treat Firebase read costs, kiosk accessibility, and rollout safety as first-class constraints.
- Do not introduce breaking changes to online kiosk or admin flows without an explicit approved change plan.
- Prefer additive flags and rollback-ready defaults for anything operationally sensitive.

## Review gates

Run the minimum gates before asking for review:

- `bun test`
- `bun run check`
- `bun run build` when the slice can affect routing, env wiring, metadata, or deployment behavior
- `bun run test:a11y:e2e` when the slice changes public, kiosk, or admin UI behavior

Add the deeper audit commands when the slice touches shared architecture or CI-sensitive surfaces:

- `bun run audit:dead`
- `bun run audit:dupe`
- `bun run audit:circ`

## SDD expectations

- Proposal/spec/design/tasks should be persisted in Engram under `sdd/<change-name>/...` unless a task explicitly says to use repo-backed artifacts.
- `sdd-apply` work must update the relevant Engram progress artifact, for example `sdd/<change-name>/apply-progress`.
- Preserve task history: mark new completion state or append notes, do not rewrite prior evidence.
- If rollout flags, security posture, or ops behavior change, update `README.md` and the affected runbook in `docs/runbooks/`.

## Pull request checklist

- Scope is clear and additive.
- Flags/defaults are documented.
- Verification evidence is included.
- Rollback path is still obvious.
- SDD artifacts and verification evidence reflect the current state.
