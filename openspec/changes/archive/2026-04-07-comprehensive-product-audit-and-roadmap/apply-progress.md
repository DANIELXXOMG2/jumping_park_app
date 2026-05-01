# Apply Progress

**Change**: `comprehensive-product-audit-and-roadmap`
**Scope**: Phase 5 tasks `5.1`, `5.2`, and `5.3`
**Mode**: Standard
**Date**: 2026-04-06

## Completed

- Rewrote `README.md` as a tighter product brief with current architecture, rollout flags, quality gates, and a portfolio/demo IA aligned to the implemented hardening work.
- Replaced `docs/ARQUITECTURA.md` with the current runtime model: cursor-first admin data plane, `admin_metrics` aggregates, staged offline replay via `offline_sync`, CSP report-only perimeter rollout, and the public SEO/AI-SEO discovery surface.
- Split operations into focused runbooks: rollback flags, offline replay drill, admin cost smoke checklist, and SEO/AI-SEO validation; turned `docs/runbooks/production-hardening.md` into the operational hub.
- Added `docs/portfolio/` with real-asset conventions, screenshot/diagram guidance, short motion script, branding recommendations, and a manifest template instead of fake binaries.
- Hardened non-destructive verification by making `check:format` and `check:lint` CI-safe, adding explicit `fix:*` scripts, introducing `check:phase5`, and adding `tests/phase5-verification-hardening.test.ts` for llms/SEO, cursor opacity, and aggregate contract coverage.
- Ran the post-Phase 5 formatter cleanup pass with `bun run fix:format`, keeping changes mechanical and limited to Biome-driven formatting across `src/` so the hardened `check:format` gate now passes cleanly.

## Tasks

- Marked `5.1`, `5.2`, and `5.3` complete in `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/tasks.md`.

## Validation Evidence

- `bun test` -> PASS (`45` tests, `0` failures)
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun run check:phase5` -> PASS (`12` targeted tests, `0` failures)
- `bun run check:format` -> FAIL due pre-existing repository formatting debt outside Phase 5 scope; the gate is now non-mutating and correctly surfaces existing drift instead of rewriting files silently.

## Post-Phase 5 Cleanup (2026-04-06)

- Applied Biome's formatter write pass over `src/` only, with no logic or behavior changes.
- This cleanup is intentionally mechanical and exists solely to align the repository with the non-mutating `check:format` script introduced in Phase 5.

### Cleanup Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`51` tests, `0` failures)

## Risks

- A full browser-based Axe suite still is not present; this phase documents precise a11y smoke notes and keeps route/unit verification hard, but true end-to-end accessibility automation remains future work.
- The docs now point to the current architecture and runbooks; future feature work has to keep those artifacts updated or drift will return.

## Block A follow-up (2026-04-06)

- Added `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` to `.env.example` and aligned docs so the offline queue rollout is documented as a dual server + browser flag, not a single toggle.
- Added `CONTRIBUTING.md` with the current contribution workflow, Bun-based quality gates, and OpenSpec/SDD expectations for additive changes.
- Tightened the enforced CSP baseline in `src/proxy.ts` by explicitly denying frames, limiting workers/manifests/media, and removing broad remote script origins while keeping current online behavior intact.
- Kept the stricter CSP canary behind `CSP_REPORT_ONLY_ENABLED` and documented the staged tightening path instead of attempting a risky removal of all unsafe directives now.

### Block A Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`46` tests, `0` failures)

### Block A Notes

- `bun test` still prints the intentional Firebase-admin misconfiguration error from `tests/admin-session-service.test.ts`, but the suite assertion passes and the overall command exits successfully.

## Block B remediation (2026-04-06)

- Replaced production-sensitive and noisy ad-hoc `console.*` usage in `src/services/emailService.ts`, `src/services/consentService.ts`, `src/components/kiosk/KioskSessionRestorer.tsx`, and `src/hooks/usePWAInstall.ts` with a guarded logger in `src/lib/logger.ts` so info/debug telemetry stays available in development or with an explicit debug flag while production avoids leaking email, document, and storage-path details.
- Added minimum-viable dialog accessibility structure across shared modal primitives in `src/components/admin/Modal.tsx`, `src/components/ui/Modal.tsx`, and `src/components/kiosk/MinorModalBase.tsx`: `role="dialog"`, `aria-modal`, title association, initial focus, tab-loop containment, and focus restore on close.
- Made interactive admin table rows keyboard reachable in `src/components/admin/DataTable.tsx` with focusability, Enter/Space activation, and explicit row labels; wired descriptive row labels in the users, minors, and consents surfaces.
- Added missing `aria-label`s to key icon-only controls surfaced by the audit, including staff role actions, consent signature external-link action, signature clear action, config delete buttons, and the users refresh control.
- Added `tests/block-b-a11y-and-logging.test.tsx` to verify modal semantics, row keyboard/a11y semantics, and guarded logging behavior for production vs explicit debug mode.

### Block B Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`50` tests, `0` failures)

### Block B Notes

- `bun test` still prints the intentional Firebase-admin misconfiguration error from `tests/admin-session-service.test.ts`, but the suite assertions pass and the overall command exits successfully.
- The new logger intentionally preserves `warn`/`error` output in production for actionable failures while suppressing routine `info`/`debug` chatter unless `APP_DEBUG_LOGS=true` or `NEXT_PUBLIC_APP_DEBUG_LOGS=true` is set.

## Block C remediation (2026-04-06)

- Updated direct dependency hygiene with low-risk bumps for `next` (`16.0.7` -> `16.2.2`), `firebase` (`12.6.0` -> `12.11.0`), and `firebase-admin` (`13.6.0` -> `13.7.0`), which removes the previously reported direct runtime `next` findings from `bun audit`.
- Strengthened `.github/workflows/ci.yml` into clearer jobs: blocking format/lint/types/tests + structural audits, a dedicated dependency-audit job that fails on direct dependency findings while still surfacing transitive/tooling debt, and a separate build-verification job with safe CI placeholder env vars.
- Added `docs/README.md` as the canonical docs map, marked legacy manuals/reports as `Historical`, and fixed known broken links so current vs historical guidance is explicit instead of competing.
- Added `docs/runbooks/dependency-risk-note.md` to document the residual `bun audit` findings that still come from transitive Firebase/tooling packages and should not be papered over with risky forced overrides in this phase.

### Block C Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`50` tests, `0` failures)
- `bun audit` -> PARTIAL (`26` vulnerabilities remain, all transitive/tooling; no direct dependency findings reported after upgrades)

### Block C Notes

- `bun test` still prints the intentional Firebase-admin misconfiguration error from `tests/admin-session-service.test.ts`, but the suite assertions pass and the overall command exits successfully.
- The new CI dependency gate is intentionally strict on direct dependencies and intentionally documentary for residual transitive/tooling risk until upstream packages publish safer ranges.

## Block D closure pass (2026-04-07)

- Replaced the remaining obvious runtime `console.*` calls in app/service code with `src/lib/logger.ts`, preserving warning/error visibility in production while keeping info-level diagnostics gated behind the existing safe logging policy.
- Closed the known Biome warnings in `src/components/kiosk/ConsentContent.tsx` and `src/lib/adminAuth.ts` with behavior-safe changes only.
- Expanded low-cost automated a11y regression evidence by extracting a pure dialog focus-loop helper in `src/lib/a11y/dialog.ts` and covering it in `tests/block-b-a11y-and-logging.test.tsx` alongside the existing modal/table semantics checks.
- Aligned docs so the current limitation state is explicit and consistent: residual dependency risk is still transitive/tooling only, and browser-level Axe automation is still a documented next step rather than implied coverage.

### Block D Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS
- `bun audit` -> PARTIAL (`26` vulnerabilities remain, all transitive/tooling; no direct dependency findings reported)

### Block D Notes

- `bun test` still prints the intentional Firebase-admin misconfiguration error from `tests/admin-session-service.test.ts`, but the suite assertions pass and the overall command exits successfully.
- The additional a11y regression check is intentionally pragmatic: it strengthens modal keyboard/focus coverage without pretending to replace a browser Axe pass.

## Block E archive-blocker closure (2026-04-07)

- Added deterministic Block E verification coverage in `tests/block-e-a11y-smoke.test.tsx`, `tests/block-e-offline-replay.test.ts`, and `tests/block-e-runtime-proof.test.ts` so the final verify blockers now have auditable automated evidence instead of documentation-only claims.
- Added focused runtime helpers with zero production behavior drift: `src/lib/offline/serverReplay.ts` now centralizes the offline replay mutation decision used by `src/services/consentService.ts`, `src/app/api/admin/users/route.ts` now exposes `resolveAdminUsersListQuery()`, `src/app/api/admin/stats/route.ts` now exposes aggregate response/recompute helpers, and `src/services/adminAuditService.ts` now exposes `writeAdminAuditLogToCollection()` for deterministic audit-write proof.
- Closed the current high-confidence `knip` findings by removing or de-exporting unused symbols (`src/lib/firestoreService.ts`, `src/lib/utils/searchUtils.ts`, `src/services/userService.ts`, `src/lib/firebaseClient.ts`, `src/hooks/useActivity.ts`, `src/types/pagination.ts`) and by removing the redundant `next.config.ts` entry pattern from `knip.json`.
- Expanded `check:phase5` so the final phase gate now executes the new Block E suites together with the prior SEO/offline/phase5 verification coverage.
- Captured browser-level evidence with Playwright MCP against the running dev server:
  - `/consentimiento-digital` rendered one `main`, one `h1`, labeled regions, zero unnamed interactive controls, and no horizontal overflow at the captured viewport.
  - `/consentimiento` with a seeded kiosk session opened the fullscreen consent dialog, exposed one `role="dialog"` with an accessible name, kept a `main` landmark inside the dialog, and moved keyboard focus into the dialog content on `Tab`.
  - Visual evidence saved as `block-e-consentimiento-digital.png` and `block-e-kiosk-consent-dialog.png`.

### Block E Validation Evidence

- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`59` tests, `0` failures)
- `bun run check:phase5` -> PASS (`20` targeted tests, `0` failures)
- `bun run audit` -> PASS for current policy (`knip` clean, `depcruise` clean, `jscpd` under threshold with informational clone report only)

### Block E Notes

- Browser automation evidence was gathered with Playwright MCP because the repository does not currently ship a first-party Playwright runner; the repo-local automated suite therefore uses deterministic smoke assertions plus browser-captured proof instead of introducing a new E2E runtime at the archive tail end.
- `bun test` still emits the intentional Firebase-admin misconfiguration stack from `tests/admin-session-service.test.ts`, but the suite passes and the command exits `0`.

## Block E2 final archive blockers (2026-04-07)

- Added first-party browser accessibility automation with `playwright.config.ts`, `playwright/accessibility.a11y.ts`, and `playwright/helpers.ts`; the suite starts the local Next dev server, runs Axe against `/consentimiento-digital` and the kiosk `/consentimiento` dialog surface, and proves 200%-equivalent reflow by asserting no horizontal overflow at a 640px viewport.
- Added reproducible package scripts for archive evidence: `bun run playwright:install`, `bun run test:a11y:e2e`, and an expanded `bun run check:phase5` that now chains the focused Bun verification tests with the browser-level Playwright/Axe pass.
- Strengthened offline replay evidence from pure helper assertions to a deterministic integration-style flow in `tests/block-e-offline-replay.test.ts`: offline queue remains pending while offline, reconnect sync drains the queue, and a replay with the same `dedupeKey` reuses the original ledger/consent instead of persisting duplicates.
- Upgraded the admin blocker proof in `tests/block-e-runtime-proof.test.ts` by exercising the route response builders used by `/api/admin/users`, `/api/admin/stats`, and admin user deletion with `CURSOR_PAGINATION_ENABLED=true` and `ADMIN_AGGREGATES_ENABLED=true`, validating `pageInfo`, aggregate freshness source, and immutable audit payload writes.
- Removed the fullscreen dialog Axe regressions uncovered by the new browser suite: `src/components/ui/Modal.tsx` no longer nests a second `main` landmark inside the kiosk modal and now exposes keyboard-reachable scrollable dialog content without changing production behavior.

### Block E2 Reproduction Commands

- `bun run playwright:install`
- `bun run test:a11y:e2e`
- `bun run check:format`
- `bun run check:lint`
- `bun run check:types`
- `bun test`
- `bun run check:phase5`
- `bun run audit`

### Block E2 Validation Evidence

- `bun run playwright:install` -> PASS
- `bun run test:a11y:e2e` -> PASS (`2` Playwright/Axe tests, `0` failures)
- `bun run check:format` -> PASS
- `bun run check:lint` -> PASS
- `bun run check:types` -> PASS
- `bun test` -> PASS (`58` tests, `0` failures)
- `bun run check:phase5` -> PASS (`19` Bun-focused assertions + `2` Playwright/Axe tests)
- `bun run audit` -> PASS for current policy (`knip` clean, duplication remains below threshold, dependency-cruiser clean)

### Block E2 Notes

- The Playwright suite intentionally targets additive public/kiosk evidence only; it avoids external services by seeding kiosk session state in-browser and by using deterministic test doubles for offline replay and admin route response proofs.
- `bun test` still emits the intentional Firebase-admin misconfiguration stack from `tests/admin-session-service.test.ts`, but the suite passes and the command exits `0`.
