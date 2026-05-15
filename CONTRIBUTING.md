# Contributing

Thanks for improving Jumping Park. Keep changes additive, production-safe, and aligned with the current service-layer + App Router architecture.

## Workflow

1. Start from an OpenSpec change when the work is more than a tiny fix.
2. Review the relevant proposal, design, tasks, and active runbooks before editing code.
3. Implement the smallest safe slice first; prefer feature flags over risky cutovers.
4. Update docs and operational notes when behavior, rollout, or verification changes.
5. Open or request review with clear evidence of what changed and how it was verified.

## Engineering expectations

- Use Bun commands only.
- Keep API business logic in `src/services/`; routes should stay thin and use the existing handler/validation patterns.
- Treat Firebase read costs, kiosk accessibility, and rollout safety as first-class constraints.
- Do not introduce breaking changes to online kiosk or admin flows without an explicit approved change plan.
- Prefer additive flags and rollback-ready defaults for anything operationally sensitive.

## Quality gates

Run these before asking for review:

```bash
bun run check:format
bun run check:lint
bun run check:types
bun test
```

Recommended before merge when the change touches shared architecture or CI-sensitive surfaces:

```bash
bun run audit:dead
bun run audit:dupe
bun run audit:circ
```

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
