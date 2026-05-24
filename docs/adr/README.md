# Architecture decision records

This folder turns the highest-impact architecture decisions from Engram-backed SDD history into repo-readable context. Read these records when you need both present-day implementation evidence and the historical reason a decision exists.

## Quick path

1. Start with `0001-app-router-service-layer.md` to understand the default backend shape.
2. Read `0002-rollout-flags-hardening-policy.md` before changing env-gated rollout behavior.
3. Read `0003-admin-session-and-otp-split.md` before touching admin auth or kiosk OTP flows.
4. Read `0004-cursor-pagination-and-admin-aggregates.md` before changing admin list or stats endpoints.
5. Read `0005-offline-consent-queue-and-sync-ledger.md` before changing kiosk offline replay.

## Current ADR set

| ADR | Decision | Why it matters now | Repo evidence | Engram refs |
| --- | --- | --- | --- | --- |
| `0001-app-router-service-layer.md` | Keep App Router routes thin and service-driven. | It is the dominant API pattern and the safest extension point for future work. | `src/app/api/admin/session/route.ts`, `src/app/api/admin/consents/route.ts`, `src/services/adminConsentListService.ts`, `src/lib/apiHandler.ts` | `#540` |
| `0002-rollout-flags-hardening-policy.md` | Centralize rollout decisions in `src/lib/hardeningPolicy.ts`. | Feature rollout, rollback, and observability depend on one typed flag resolver. | `src/lib/hardeningPolicy.ts`, `src/proxy.ts`, `src/lib/seo.ts` | `#492` |
| `0003-admin-session-and-otp-split.md` | Use server-validated admin session cookies and split OTP challenges from validated access sessions. | Auth and OTP changes must preserve the current perimeter and lockout model. | `src/app/api/admin/session/route.ts`, `src/services/adminSessionService.ts`, `src/services/authService.ts` | `#422` |
| `0004-cursor-pagination-and-admin-aggregates.md` | Use opaque cursors and aggregate docs for cost-sensitive admin reads. | Admin list/stats work must protect Firestore read budgets and stable latency. | `src/lib/adminCursor.ts`, `src/services/adminConsentListService.ts`, `src/services/adminMetricsService.ts` | `#540`, `#555` |
| `0005-offline-consent-queue-and-sync-ledger.md` | Use a staged offline queue with an idempotent replay ledger. | Kiosk offline behavior depends on preserving replay safety through the existing API surface. | `src/lib/offline/sync.ts`, `src/app/api/consentimientos/route.ts`, `src/types/firestore.ts` | `#540`, `#556` |

## Traceability notes

- The repo files listed above are the proof that a decision is still live in the current implementation.
- The Engram observation IDs are supporting historical context, not runtime source of truth.
- If a repo file and an old Engram note ever disagree, prefer the repo and resolve the drift in the next SDD cycle.
