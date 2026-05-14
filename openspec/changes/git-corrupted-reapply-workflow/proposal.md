# Proposal: Git Corrupted Working Copy Reapply Workflow

## Intent

The local repository working tree has a large uncommitted set of files but a potentially corrupted git state. We need to safely reapply these changes into a fresh, clean clone of the repository without introducing hidden corruption or breaking the build. The goal is to retain all verified work across docs, env contracts, OTP timing, production-readiness hardening, Playwright verification, and OpenSpec traceability in an organized, traceable manner.

## Scope

### In Scope
- Creating an explicit checklist to apply changes batch-by-batch.
- Copying and verifying docs, hygiene, and diagrams.
- Copying and verifying environment contracts and OTP timing implementations.
- Copying and verifying production-readiness, routing, runtime code, CI, and IaC files.
- Copying and verifying OpenSpec artifacts as the final traceability step.

### Out of Scope
- Making new functional or structural changes not already present in the corrupted working tree.
- Relying on git patch tools or diffs generated from the corrupted `.git` index.
- Pushing to production before all batches are successfully reapplied and green.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

We will use a **selective batch-by-batch reapply from a fresh clone** strategy. This guarantees the highest confidence, easiest rollback, and clean commit history.
Exact batch order:
1. **Docs, Hygiene & Diagrams**: Low-risk docs, repo guidance, and diagram artifacts (`README.md`, `docs/**`, `diagramas/**`, `CONTRIBUTING.md`, `AGENTS.md`, `.vercelignore`).
2. **Environment & OTP Timing**: Env contract and OTP timing implementation (`.env.example`, `CLAUDE.md`, `docs/runbooks/otp-operational-policy.md`, `src/lib/utils/otpConfig.ts`, `src/services/authService.ts`, `tests/otp-timing-config.test.ts`, `tests/auth-hardening.test.ts`).
3. **Production-readiness Hardening**: The core application (`src/app/**`, `src/components/**`, `src/lib/**`, `src/services/**`, `firebase/**`, `playwright/**`, `tests/**`, `package.json`, `bun.lock`, `.github/workflows/ci.yml`, `knip.json`, `public/offline-sw.js`).
4. **OpenSpec & Traceability**: The SDD audit trail (`openspec/config.yaml`, `openspec/specs/**`, `openspec/changes/**`).

Each batch must be copied, verified (e.g., via `bun run check`), and committed before proceeding to the next.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.md`, `docs/`, `diagramas/`, etc. | Modified/New | Docs and hygiene updates |
| `src/lib/utils/otpConfig.ts`, `tests/`, etc. | Modified/New | Configurable OTP timing |
| `src/`, `package.json`, `playwright/`, `firebase/` | Modified/New | Production hardening and CI |
| `openspec/` | Modified/New | SDD artifacts and change records |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Blindly copying config files reinstates hidden corruption | Medium | Reapply in ordered batches. Stop and verify at each gate with `bun run check` and tests. |
| Splitting `package.json` and `bun.lock` | High | Copy both together in the Production-readiness batch as one dependency contract. |
| OpenSpec syncs an invalid state | Medium | Leave OpenSpec/archive sync last, so traceability reflects the verified final state. |

## Rollback Plan

Since this is done iteratively in a fresh clone, rollback is trivial: `git reset --hard HEAD` on the fresh clone to undo a failed batch, or delete the clone entirely if irrecoverable.

## Dependencies

- A fresh, clean `git clone` of the remote repository to act as the destination.
- The existing corrupted working directory containing the final, uncommitted file states.

## Success Criteria

- [ ] All four batches applied sequentially and independently committed.
- [ ] CI gates (`bun run check`, `bun test`, `npx playwright test`) pass completely after the 3rd batch.
- [ ] No git index corruption exists in the fresh clone.
- [ ] OpenSpec tracking matches the final verified state.
