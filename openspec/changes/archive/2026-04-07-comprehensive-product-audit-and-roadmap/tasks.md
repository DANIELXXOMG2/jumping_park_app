# Tasks: Comprehensive Product Audit & Roadmap

## Phase 1: Foundation
- [x] 1.1 Strict | O: add `cursor`, `aggregates`, `offlineQueue`, `cspReportOnly` flags; F: `src/lib/hardeningPolicy.ts`, env; R: low; C: defaults preserve prod, `bun test`, `bun run check:types`; RB: flags off.
- [x] 1.2 After 1.1 | O: add shared cursor/queue/idempotency types; F: `src/lib/firestoreService.ts`, `src/lib/offline/*`, `src/types/*`; R: med; C: codec + dedupe tests; RB: dark.
- Gate: stop if prod behavior changes.
- Verify: `bun test`; `check:types`; manual smoke.

## Phase 2: Security / A11y / SEO
- [x] 2.1 Strict | O: remove zoom lock, add landmarks/live regions/keyboard order; F: `src/app/layout.tsx`, `src/app/(kiosk)/**/*.tsx`, kiosk UI; R: med; C: Axe, 200% zoom, keyboard path; RB: revert UI.
- [x] 2.2 Parallel with 2.1 | O: ship report-only CSP + headers; F: `src/proxy.ts`; R: med; C: admin auth/assets load; RB: `cspReportOnly` off.
- [x] 2.3 Parallel with 2.1 | O: add `robots`, `sitemap`, `llms.txt`, JSON-LD; F: `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, metadata; R: low; C: routes valid; RB: remove artifacts.
- Gate: stop on a11y, SEO, or CSP regressions.
- Verify: `bun test`; `check:lint`; `check:types`; manual a11y + SEO.

## Phase 3: Admin Data-Plane Refactor
- [x] 3.1 Strict | O: add cursor contracts, keep offset fallback, remove list signed URLs; F: `src/app/api/admin/*/route.ts`, `src/services/*Service.ts`; R: high; C: 20-50 item pages, `nextCursor`, detail-only asset access; RB: cursor off.
- [x] 3.2 After 3.1 | O: add `admin_metrics/*` aggregates + freshness/recompute path; F: `src/app/api/admin/{stats,stats/detailed}/route.ts`, hooks/scripts; R: high; C: dashboard reads 1-5 docs, freshness shown; RB: aggregates off.
- [x] 3.3 Parallel after 3.1 | O: add immutable admin audit writes; F: admin API/services; R: med; C: actor/action/time stored; RB: audit off.
- Gate: stop on cost, signed-URL, or drift regressions.
- Verify: `bun test`; `check:types`; manual cost + pagination.

## Phase 4: Offline Staged Rollout
- [x] 4.1 Strict | O: Stage 1 shell/assets/session cache; F: `src/store/kioskStore.ts`, `src/lib/offline/*`; R: med; C: visited kiosk screens survive offline; RB: offline off.
- [x] 4.2 After 4.1 | O: Stage 2 local consent queue + retry UX; F: kiosk submit, store, offline libs; R: high; C: offline submit persists and syncs on reconnect; RB: queue off.
- [x] 4.3 After 4.2 | O: Stage 3 `offline_sync` dedupe ledger; F: consent API/service + ledger logic; R: high; C: replay reuses dedupe key, no duplicate consent/consecutive drift; RB: sync ledger off.
- Gate: stop on queue loss or duplication.
- Verify: `bun test`; `check:types`; manual offline replay.

## Phase 5: Docs / Polish / Verification Hardening
- [x] 5.1 Parallel after evidence exists | O: refresh IA/runbooks/ADR links; F: `README.md`, `docs/ARQUITECTURA.md`, `docs/runbooks/*`; R: low; C: docs cover flags, rollback, ops; RB: docs revert.
- [x] 5.2 Parallel with 5.1 | O: add portfolio assets; F: screenshots, diagrams, rollout checklist; R: low; C: artifacts match behavior; RB: remove stale assets.
- [x] 5.3 Strict final | O: harden CI gates for Axe, cursor/admin, offline sync, SEO routes; F: `tests/**/*`, Playwright/Axe config, CI scripts; R: med; C: `bun test`, `bun run check`, targeted E2E; RB: block merge, not prod.
- Gate: no prod flags until checks + rollback drill pass.
