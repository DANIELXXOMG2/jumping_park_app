## Exploration: rollout-flags-and-observability-hardening

### Current State
The hardening change is mostly implemented, but the rollout-control decision from the approved design is incomplete. `ADMIN_SESSION_MODE` exists in `src/lib/adminAuth.ts:8`, while the other three planned gates (`OTP_HARDENING_ENABLED`, `EXPORT_BOUNDS_ENFORCED`, `PUBLIC_SEO_ENABLED`) are absent, so OTP hardening, bounded exports, and public SEO are always-on behaviors instead of canary-able features. The runtime already has the hardened code paths in `src/services/authService.ts:517`, `src/services/exportRangeService.ts:65`, `src/app/api/admin/export/users/route.ts:21`, `src/app/api/admin/export/consents/route.ts:24`, `src/app/robots.ts:4`, `src/app/sitemap.ts:4`, and `src/proxy.ts:48`, but those paths are not mediated by a shared rollout policy. Observability is also fragmented: `docs/runbooks/production-hardening.md:1` documents smoke checks, tests cover OTP/export/SEO behavior, and `src/services/authService.ts:83` masks some OTP identifiers, but there is no centralized hardening telemetry or flag-state reporting, and other services such as `src/services/consentService.ts:252` still rely on raw console logging.

### Affected Areas
- `openspec/changes/production-hardening-professionalization/design.md` — source decision that promised dual rollout flags beyond admin session mode.
- `openspec/changes/production-hardening-professionalization/verify-report.md` — current verification evidence calling out the missing flags as an explicit warning.
- `src/lib/adminAuth.ts` — existing pattern for env-driven rollout via `ADMIN_SESSION_MODE`; likely model for a shared policy layer.
- `src/services/authService.ts` — OTP request/validate hardening and masked logging live here; needs flag gating and observability hooks.
- `src/services/exportRangeService.ts` — export-bound enforcement currently hard-coded and always enforced.
- `src/app/api/admin/export/users/route.ts` — users export entry point where fallback vs enforced behavior would branch.
- `src/app/api/admin/export/consents/route.ts` — consents export entry point with the same rollout concern.
- `src/lib/seo.ts` — likely home for public-SEO enablement helpers or route allowlists.
- `src/app/robots.ts` — public crawler surface should be suppressible when `PUBLIC_SEO_ENABLED` is off.
- `src/app/sitemap.ts` — same public-surface gating requirement as robots.
- `src/app/layout.tsx` and `src/app/(public)/layout.tsx` — metadata boundary already exists, but public indexability needs a single flag-driven source of truth.
- `.env.example` and `README.md` — env contract and rollout/runbook docs must expose the three missing flags and operator expectations.
- `tests/auth-hardening.test.ts`, `tests/operational-hardening.test.ts`, `tests/seo-public.test.ts` — current safety net; should expand to prove flag-off, flag-on, and telemetry behavior.

### Approaches
1. **Inline route-level flags** — add direct `process.env.*` checks inside OTP, export, and SEO entry points.
   - Pros: small diff, fast to ship, low conceptual overhead.
   - Cons: flag semantics drift easily, tests duplicate setup, observability becomes scattered, rollback behavior can diverge across entry points.
   - Effort: Low

2. **Central hardening policy module** — introduce a typed runtime policy/helper that resolves rollout flags and exposes shared observability metadata for OTP, export, and SEO flows.
   - Pros: single source of truth, stricter typing, easier App Router-safe consumption, cleaner tests, one place to add operator-visible telemetry and docs.
   - Cons: touches multiple areas at once, requires defining fallback behavior per surface before implementation.
   - Effort: Medium

### Recommendation
Recommend **Central hardening policy module**. The repo already proved one env-controlled rollout path with `ADMIN_SESSION_MODE`; the missing work is not just adding booleans, it is restoring the design promise of safe canary/rollback and making those states observable. A typed policy layer keeps `OTP_HARDENING_ENABLED`, `EXPORT_BOUNDS_ENFORCED`, and `PUBLIC_SEO_ENABLED` consistent, lets OTP/export/SEO endpoints emit deterministic headers or structured logs about active policy, and supports small PRs: first policy + docs, then OTP/export wiring, then SEO wiring + smoke/test coverage.

### Risks
- OTP rollback semantics are not yet defined: if `OTP_HARDENING_ENABLED=false`, the team must decide whether to preserve current hardened behavior, re-enable legacy mixed-session paths, or expose only softer response contracts.
- Export rollback can weaken security/cost posture if `EXPORT_BOUNDS_ENFORCED=false` simply reopens unbounded downloads without audit markers.
- SEO rollback affects discoverability and caching; disabling `PUBLIC_SEO_ENABLED` must suppress `robots.txt`, `sitemap.xml`, and indexable metadata coherently to avoid mixed signals.
- Observability scope can sprawl if this change tries to solve all logging cleanup instead of hardening-specific telemetry first.

### Ready for Proposal
Yes — proceed to `sdd-propose` for a follow-up change scoped to: (1) typed rollout-policy contract + env/docs updates, (2) OTP/export flag wiring with deterministic observability, and (3) public SEO gating plus smoke/test updates. Keep implementation incremental and PR-sized rather than reopening the whole hardening program.
