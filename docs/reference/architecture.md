# System Architecture

> **Status**: current
> **Diátaxis**: Reference

This document describes the architecture in effect after the incremental hardening from `comprehensive-product-audit-and-roadmap`. The current focus is operational excellence — lower cost, stronger accessibility, better resilience, and a documented public surface for SEO and AI-SEO — not a wholesale rewrite of the product.

Current document map: [`docs/README.md`](../README.md).

## 1. Executive summary

- **Stack**: Next.js 16 App Router, React 19, Bun, Firebase Admin, Firestore, Storage, Resend, Zod, Zustand, and SWR.
- **Dominant pattern**: App Router + service layer + validation/auth wrappers.
- **Rollout principle**: Everything is additive and flag-controlled; no destructive migrations.
- **Operational goal**: Keep the product within free-tier budgets without degrading UX or accessibility.

## 2. System planes

### 2.1 Kiosk plane

- `src/app/(kiosk)` hosts the in-person flow: entry, OTP, registration, consent, and success.
- `src/store/kioskStore.ts` persists critical visitor state for local continuity.
- `src/lib/offline/*` implements the staged offline rollout:
  - Stage 1: shell/assets/session cache.
  - Stage 2: local consent queue.
  - Stage 3: idempotent replay against `offline_sync`.

### 2.2 Admin data plane

- `src/app/api/admin/*` delegates business logic to services and applies auth/permissions.
- `src/services/userService.ts`, `src/services/minorIndexService.ts`, and `src/app/api/admin/consents/route.ts` expose cursor-first contracts for administrative lists.
- Pagination uses opaque cursors (`src/lib/adminCursor.ts`, `src/lib/firestoreService.ts`) to avoid `offset` costs on Firestore.
- Endpoints still allow legacy fallback when `CURSOR_PAGINATION_ENABLED=false`.

### 2.3 Aggregate plane

- `src/services/adminMetricsService.ts` maintains the `admin_metrics/*` model.
- Primary documents:
  - `admin_metrics/overview`
  - `admin_metrics/daily:yyyy-mm-dd`
- The dashboard and detailed stats can read 1–5 aggregated documents instead of recomputing full scans when `ADMIN_AGGREGATES_ENABLED=true`.
- Every response exposes `freshness` to show whether data comes from the aggregate plane or live fallback.

### 2.4 Public discovery plane

- `src/app/(public)/consentimiento-digital/page.tsx` is the canonical public URL.
- `src/app/robots.ts`, `src/app/sitemap.ts`, and `src/app/llms.txt/route.ts` control traditional indexability and agent-facing context.
- `src/lib/seo.ts` centralizes public routes, robots rules, canonical URLs, and JSON-LD.

### 2.5 Perimeter and security plane

- `src/proxy.ts` applies security headers and indexing control for private surfaces.
- The perimeter maintains an enforced CSP baseline and uses `CSP_REPORT_ONLY_ENABLED` only for the stricter canary/report-only path.
- The perimeter also supplies `X-Robots-Tag: noindex, nofollow` for private kiosk/admin routes.

## 3. Data Flow

```mermaid
flowchart LR
    Kiosk[Kiosk UI] --> OTP[otp_challenges / otp_access_sessions]
    Kiosk --> Queue[offline queue local]
    Queue -->|online replay| ConsentAPI[/api/consentimientos]
    ConsentAPI --> ConsentSvc[consentService]
    ConsentSvc --> Firestore[(consents + users + minors_index)]
    ConsentSvc --> Ledger[(offline_sync)]

    AdminUI[Admin UI] --> AdminAPI[/api/admin/*]
    AdminAPI --> Cursor[Cursor queries]
    AdminAPI --> Metrics[(admin_metrics)]
    AdminAPI --> Audit[(admin_audit_logs)]

    Public[Public route] --> SEO[robots + sitemap + llms.txt + JSON-LD]
    Edge[src/proxy.ts] --> Public
    Edge --> AdminUI
    Edge --> Kiosk
```

## 4. Collections and operational contracts

| Resource | Current use | Key contract |
| --- | --- | --- |
| `otp_challenges` | Pending OTP challenge | Throttle, lockout, and expiry |
| `otp_access_sessions` | Validated kiosk session | Short-lived scope and local recovery |
| `consents` | Signed consents | Denormalized snapshots, atomic sequential numbering |
| `minors_index` | Efficient minor lookup | Denormalized projection |
| `admin_metrics` | Administrative read model | Overview + daily + freshness |
| `offline_sync` | Idempotency ledger | Same `dedupeKey` → same ack |
| `admin_audit_logs` | Immutable admin trail | Actor, action, timestamp |

## 5. Cursor data plane

The most dangerous cost on Firestore was not writes — it was skipping documents. That is why the admin migrates to opaque cursors.

- `CursorPageRequest`: `limit`, `cursor`, `search`.
- `CursorPageResponse`: `items`, `pageInfo`, `meta`.
- `pageInfo.nextCursor` is opaque, versioned, and tied to collection/field/order.
- `meta.source` distinguishes cursor read from search.
- Administrative lists never return signed URLs in listings; only `signatureStatus`.

Implementation: [`src/lib/adminCursor.ts`](../../src/lib/adminCursor.ts), [`src/lib/firestoreService.ts`](../../src/lib/firestoreService.ts).

Impact:

- Reads bounded to 20–50 records per page.
- More stable latency.
- Immediate rollback via flag if operational drift appears.

## 6. Aggregates and recompute

The dashboard should not pay for full scans every time someone opens the admin.

- `adminMetricsService.getOverview()` reads/generates `admin_metrics/overview`.
- `adminMetricsService.getDetailed()` builds KPIs with overview + daily documents.
- `freshness.computedAt` validates whether the aggregate is within the expected window.
- If an aggregate is missing or stale, controlled recompute exists; live fallback remains available behind the flag.

Implementation: [`src/services/adminMetricsService.ts`](../../src/services/adminMetricsService.ts).

Operational runbook: [`docs/runbooks/admin-cost-smoke-checklist.md`](../runbooks/admin-cost-smoke-checklist.md).

## 7. Offline resilience

The offline strategy is deliberately staged.

### Stage 1

- Kiosk shell, assets, and recent session cache.
- Navigation across visited screens without abrupt failures.

### Stage 2

- Local queue of `consent.create`.
- Operator feedback even when offline.
- Automatic retry on `online` event and on app start.

### Stage 3

- `dedupeKey = sha256(userId + policyVersion + signedAtLocal)`.
- `offline_sync/{dedupeKey}` prevents duplicates and sequential-number drift.
- If the server already processed the payload, it returns the same ack.

Implementation: [`src/lib/offline/*`](../../src/lib/offline), [`src/store/kioskStore.ts`](../../src/store/kioskStore.ts).

Operational runbook: [`docs/runbooks/offline-replay-drill.md`](../runbooks/offline-replay-drill.md).

## 8. SEO, AI-SEO, and public artifacts

The public surface is deliberately small: one canonical page, consistent metadata, and files easy for search engines and agents to consume.

- `robots.txt` only allows the approved public surface.
- `sitemap.xml` publishes canonical URLs and excludes admin/kiosk.
- `llms.txt` describes the product, public routes, and citation boundaries.
- JSON-LD exposes `WebPage`, `WebSite`, and `AmusementPark` for semantic extraction.

Implementation: [`src/lib/seo.ts`](../../src/lib/seo.ts), [`src/app/robots.ts`](../../src/app/robots.ts), [`src/app/sitemap.ts`](../../src/app/sitemap.ts), [`src/app/llms.txt/route.ts`](../../src/app/llms.txt/route.ts).

Criteria used:

- Google Search Central for indexability/canonicals/sitemap.
- AI-SEO best practices for citable content, `llms.txt`, and clear public/private boundaries.

Operational runbook: [`docs/runbooks/seo-ai-seo-validation-checklist.md`](../runbooks/seo-ai-seo-validation-checklist.md).

## 9. Security and rollout

Current flags in [`src/lib/hardeningPolicy.ts`](../../src/lib/hardeningPolicy.ts):

- `OTP_HARDENING_ENABLED`
- `EXPORT_BOUNDS_ENFORCED`
- `PUBLIC_SEO_ENABLED`
- `CURSOR_PAGINATION_ENABLED`
- `ADMIN_AGGREGATES_ENABLED`
- `OFFLINE_QUEUE_ENABLED`
- `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`
- `CSP_REPORT_ONLY_ENABLED`

Principles:

- Safe defaults for existing hardening.
- Off-by-default for new capabilities with operational risk.
- Rollback by disabling flag and redeploying, not by reverting data.

Operational runbook: [`docs/runbooks/rollback-flags.md`](../runbooks/rollback-flags.md).

## 10. Verification and evidence

IaC rollout boundary: deploy Firebase indexes/rules first, then prewarm aggregates, then enable flags.

Exact composite-index parity is still a best-effort proof until emulator/query logs or deploy feedback confirm every live query shape.

Relevant automated gates:

- `bun test`
- `bun run check:format`
- `bun run check:lint`
- `bun run check:types`
- `bun run check:phase5`

Phase 5 coverage and incremental Block D/E2 closure:

- SEO routes and `llms.txt`: `tests/seo-public.test.ts`, `tests/phase5-verification-hardening.test.ts`
- Offline idempotency: `tests/offline-resilience.test.ts`
- Cursor/admin aggregates: `tests/foundation-rollout-scaffolding.test.ts`, `tests/phase5-verification-hardening.test.ts`
- Perimeter headers/CSP: `tests/proxy.security.test.ts`
- Pragmatic a11y primitives: `tests/block-e-a11y-smoke.test.tsx`
- Reproducible a11y browser smoke: `playwright/accessibility.a11y.ts` run with `bun run test:a11y:e2e`

Manual a11y notes remain in runbooks because current coverage is smoke-level, not a full matrix. The actual state now: there IS browser automation with Axe/Playwright for critical surfaces, but coverage STILL needs expansion for all admin/kiosk flows end-to-end.

## 11. Traceability

Source-of-truth artifacts for this change:

- SDD traceability in Engram under `sdd/repo-hygiene-and-weight-audit/{proposal,spec,tasks,apply-progress,verify-report}`
- Complementary operational evidence in `README.md` and [`docs/runbooks/*`](../runbooks)

Active ADR candidates within that change:

- Cursor vs offset in Firebase — see [`docs/adr/0004-cursor-pagination-and-admin-aggregates.md`](../adr/0004-cursor-pagination-and-admin-aggregates.md)
- Aggregate plane `admin_metrics` — see [`docs/adr/0004-cursor-pagination-and-admin-aggregates.md`](../adr/0004-cursor-pagination-and-admin-aggregates.md)
- Offline-first kiosk architecture — see [`docs/adr/0005-offline-consent-queue-and-sync-ledger.md`](../adr/0005-offline-consent-queue-and-sync-ledger.md)
