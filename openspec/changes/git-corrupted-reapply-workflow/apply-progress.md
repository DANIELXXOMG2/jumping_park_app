## Implementation Progress

**Change**: git-corrupted-reapply-workflow
**Mode**: Strict TDD

### Completed Scope
- Corrected Batch 1 truthfulness in `README.md` and `docs/README.md` so the clean clone no longer presents later-batch runtime artifacts as current.
- Updated Batch 1 traceability in `tasks.md` to mark `2.1` complete and to clarify that Gate 1 still lacks the full `bun run check` execution.
- Reapplied the Batch 2 OTP timing slice only: env contract, operator docs, server-side OTP timing helper, auth service wiring, and focused OTP timing tests.
- Kept the Batch 2 scope isolated from unrelated auth/offline/hardening rollouts and did not touch kiosk browser persistence timing.
- Reapplied the Batch 3 production-hardening slice from the source working tree into the clean clone: runtime `src/**`, Firebase IaC, Playwright harness, hardening verification tests, dependency contract, rollout-safe config files, and the runtime docs required by the structural proof suite.
- Preserved rollout-safe defaults from source truth: new roadmap flags remain dark by default while secure baseline flags still fail closed.
- Reapplied the Batch 4 OpenSpec/config/specs/archive traceability reapply into the clean clone, restoring `openspec/config.yaml`, main specs, archived roadmap artifacts, prior batch change records, and truthful archive references.
- Closed the follow-up Batch 4 verify failure by rewriting stale live-path references inside the archived roadmap artifacts to their archived locations and by extending the structural proof so this regression fails fast next time.
- Reconciled the stale Batch 1 docs truthfulness proof with the final integrated clean-clone state by rewriting `tests/batch1-docs-hygiene-reapply.test.ts` around current README/archive/doc-map behavior and by updating `docs/README.md` from a Batch-1-only snapshot to an integrated docs index.

### Batch Traceability Snapshot
- `2.1` -> complete
- `2.2` -> pending
- `2.3` -> pending
- `2.4` -> pending (full `bun run check` still pending)
- `3.1` -> complete
- `3.2` -> complete
- `3.3` -> complete
- `3.4` -> complete
- `3.5` -> pending (no commit requested in this phase)
- `3.6` -> complete
- `4.1` -> complete
- `4.2` -> complete
- `4.3` -> complete
- `4.4` -> complete
- `4.5` -> complete
- `4.6` -> pending (no commit requested in this phase)
- `4.7` -> pending (strong subset + Playwright proof passed, full-suite gate still not executed)
- `5.1` -> complete
- `5.2` -> complete
- `5.3` -> pending (no commit requested in this phase)
- `5.4` -> complete
- `5.5` -> pending

### TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Batch 1 docs truthfulness correction | `tests/batch1-docs-hygiene-reapply.test.ts` | Unit | ✅ `bun test ./tests/batch1-docs-hygiene-reapply.test.ts` (6/6) | ✅ Added failing assertions for unreapplied file/script claims and planned-doc labeling | ✅ `bun test ./tests/batch1-docs-hygiene-reapply.test.ts` (8/8) | ✅ Added second behavior path: root README forbidden claims + docs index planned labeling | ✅ Tightened doc wording and task traceability without runtime edits |
| Batch 1 integrated truthfulness proof refresh | `tests/batch1-docs-hygiene-reapply.test.ts` | Unit | ⚠️ `bun test ./tests/batch1-docs-hygiene-reapply.test.ts` exposed the known stale-proof failure (5/8) that this task was explicitly assigned to fix | ✅ Rewrote the proof first around integrated README/docs/archive expectations and reran to confirm the new assertions failed against the stale `docs/README.md` snapshot | ✅ `bun test ./tests/batch1-docs-hygiene-reapply.test.ts` (8/8) after updating `docs/README.md` and trimming one overreaching README file-path claim | ✅ Covered three distinct integrated behaviors: current README artifact claims, truthful archive references, and docs index current-vs-historical labeling | ✅ Kept scope limited to proof/doc coherence; no runtime or OpenSpec behavior changed |
| Batch 2 OTP timing helper + auth wiring | `tests/otp-timing-config.test.ts`, `tests/auth-hardening.test.ts` | Unit | ✅ `bun test tests/auth-hardening.test.ts` (4/4) after `bun install` fixed missing deps | ✅ Added failing helper import/default parsing assertions and failing auth timing assertions for 30/240 minute behavior | ✅ `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` (11/11) and `bun run check:types` | ✅ Covered defaults, custom values, invalid fallbacks, and both OTP challenge/session timestamp paths | ✅ Extracted server-only timing parser and replaced hardcoded service constants with helper reads |
| Batch 2 env/docs contract | N/A (structural traceability) | N/A | N/A | ✅ Contract changes derived from failing runtime/config tests | ✅ Verified by passing targeted tests plus direct contract/doc alignment review | ➖ Triangulation skipped: structural env/doc updates with one truthful contract per file | ✅ Kept copy limited to OTP timing guidance; no kiosk persistence or unrelated flag behavior changes |
| 4.1 runtime hardening reapply | `tests/admin-phase3-hardening.test.ts`, `tests/auth-hardening.test.ts`, `tests/block-e-a11y-smoke.test.tsx`, `tests/block-e-offline-replay.test.ts`, `tests/block-e-runtime-proof.test.ts`, `tests/consent-catchall-cleanup.test.ts`, `tests/consent-route.test.ts`, `tests/crud-schema-hardening.test.ts`, `tests/foundation-rollout-scaffolding.test.ts`, `tests/offline-resilience.test.ts`, `tests/operational-hardening.test.ts`, `tests/phase3-runtime-proof-gaps.test.ts`, `tests/phase5-verification-hardening.test.ts`, `tests/proxy.security.test.ts`, `tests/seo-public.test.ts` | Unit + route-helper integration style | ⚠️ Existing clean-clone safety net exposed inherited `tests/admin-session-service.test.ts` failure before Batch 3 work; scoped reapply continued without mutating that unrelated failing fixture | ✅ Copied failing Batch 3 proof files first; initial RED showed missing modules (`adminAuditService`, `hardeningClient`, offline helpers), missing route exports, and outdated runtime contracts | ✅ `bun test` passing subset across 17 hardening files (87 pass, 0 fail) plus `bun run check:types` | ✅ Covered admin cursor/export/read-model paths, consent OTP enforcement, offline replay, rollout flags, proxy/SEO boundaries, and runtime-proof gaps through distinct files and code paths | ✅ Reapplied source runtime files directly, then added only the tiny `src/app/llms.txt/route.ts` support route required for type-safe verification imports |
| 4.2 Firebase IaC reapply | `tests/phase4-production-artifacts.test.ts` | Unit (artifact structural proof) | ✅ Included in the inherited RED run that proved index/rule drift before copy | ✅ `tests/phase4-production-artifacts.test.ts` failed first on missing composite indexes and outdated Firestore/Storage rule paths | ✅ Passing inside the 17-file hardening subset and `bun run check:types` | ✅ Proved composite indexes, split OTP collections, audit/read-model collections, and nested signature/PDF rule paths | ✅ Kept the copy source-faithful; no speculative IaC edits beyond source truth |
| 4.3 Playwright + CI harness reapply | `playwright/accessibility.a11y.ts`, `tests/phase4-production-artifacts.test.ts` | E2E + Unit | N/A (new harness in clean clone) | ✅ Copied Playwright/a11y files before runtime sync; RED state depended on missing runtime code and artifact drift | ✅ `bun run test:a11y:e2e` (3 passed) after runtime sync and browser install; CI artifact proof also passed inside the Bun subset | ✅ Public page, kiosk dialog keyboard trap, and kiosk hydration smoke now execute as separate browser scenarios | ✅ Reused source config/helpers unchanged and kept `reuseExistingServer` for local verification speed |
| 4.4 dependency contract reapply | `package.json`, `bun.lock`, `tests/phase4-production-artifacts.test.ts` | Structural | ✅ Baseline `bun install` was required before RED/targeted tests could run in the clean clone | ✅ Copied source `package.json` + `bun.lock` together before executing Batch 3 RED tests | ✅ `bun install`, `bun run check:types`, passing 17-file Bun subset, and `bun run test:a11y:e2e` | ➖ Triangulation skipped: single dependency-contract artifact pair copied as one reviewed unit | ✅ Preserved the source versions/scripts exactly, including `test:a11y:e2e` and Playwright dependencies |
| 4.5 rollout-safe config + offline assets reapply | `tests/operational-hardening.test.ts`, `tests/proxy.security.test.ts`, `tests/seo-public.test.ts`, `tests/phase4-production-artifacts.test.ts` | Unit | ✅ Existing operational/proxy/SEO tests were part of the pre-copy safety net | ✅ RED evidence came from outdated README/CI/rules/index proof and pre-copy operational contract drift | ✅ Passing 17-file Bun subset plus Playwright a11y run | ✅ Verified secure-on defaults for baseline flags, dark defaults for roadmap flags, proxy CSP/noindex behavior, docs/runbook parity, `.vercelignore`, `knip.json`, and `public/offline-sw.js` inclusion | ✅ Kept rollout flags default-safe; no production enablement was introduced |
| Batch 4 OpenSpec/config/specs/archive traceability reapply | `tests/openspec-traceability-reapply.test.ts` | Unit (artifact structural proof) | N/A (no pre-existing OpenSpec artifact proof file in the clean clone) | ✅ Added failing assertions first for missing `openspec/config.yaml`, missing specs/archive/change artifacts, stale architecture references, and the absent workflow proposal | ✅ `bun test ./tests/openspec-traceability-reapply.test.ts` passed after restoring the OpenSpec artifacts and updating truthful archive references | ✅ Covered distinct artifact families: config/main specs, archived roadmap history, prior batch change records, docs reference truthfulness, and current workflow progress alignment | ✅ Kept the implementation structural-only; adapted `docs/ARQUITECTURA.md` archive references instead of inventing non-existent live change paths |
| Batch 4 archived roadmap path-truthfulness fix | `tests/openspec-traceability-reapply.test.ts` | Unit (artifact structural proof) | ✅ `bun test ./tests/openspec-traceability-reapply.test.ts` (4/4) before edits | ✅ Added failing assertions for archived `archive-report.md`, archived `apply-progress.md`, and archived `verify-report.md` so stale live-path references were caught immediately | ✅ `bun test ./tests/openspec-traceability-reapply.test.ts` (5/5) after rewriting archived paths | ✅ Verified both positive archive-base references and negative live-base absence across three archived files, plus grep sanity returned zero stale matches | ✅ Limited the change to archive metadata and proof coverage only; no runtime or non-scoped artifact edits |

### Test Summary
- **Total tests written**: 1 new Batch 4 structural proof file (`tests/openspec-traceability-reapply.test.ts`) plus 1 integrated truthfulness refresh of the existing Batch 1 proof file (`tests/batch1-docs-hygiene-reapply.test.ts`).
- **Total tests passing**: 8 passing Batch 1 truthfulness tests + 87 passing tests in the strongest relevant Bun subset + 3 passing Playwright accessibility scenarios + 5 passing OpenSpec traceability tests.
- **Layers used**: Unit / route-helper integration style / E2E
- **Approval tests**: 2 (`tests/batch1-docs-hygiene-reapply.test.ts` baseline rerun for stale-proof capture + 1 inherited hardening safety-net sweep before Batch 3 copy)
- **Pure functions created**: 0 in clean clone; this workflow remained a source-faithful reapply plus structural traceability proof, not a new feature design pass.

### Notes
- `tests/admin-session-service.test.ts` is still an inherited clean-clone failure unrelated to the Batch 3 reapply. It was excluded from the strongest passing subset and should be handled separately.
- `tests/phase5-verification-hardening.test.ts` required `src/app/llms.txt/route.ts` for `tsc --noEmit`, so that support route was copied even though it was not part of the first minimal shortlist.
- Validation was intentionally run with rollout-safe defaults and with only a dummy `RESEND_API_KEY` for test imports; no production flags were enabled.
- `docs/README.md` had become the real stale artifact, not just the proof: it still described a Batch-1-only snapshot even though the integrated clean clone already contained Batches 2-4. The refreshed proof now fails fast on that mismatch.
- Batch 4 stayed artifact-only: no runtime code changed, but `docs/ARQUITECTURA.md` needed archive-path corrections so clean-clone references stopped pointing at a removed live change directory.
- The archived roadmap artifact set needed the same truthfulness rule as repo docs: after archival, any self-references must point at `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/**`, not the removed live change path.
- Gate 4 is now backed by `bun test ./tests/openspec-traceability-reapply.test.ts` plus `bun run check:types`; Final integration gate `5.5` remains pending because the full `bun run check` and clean-working-tree review were out of scope for this batch-only reapply.
