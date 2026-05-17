# System architecture

This document reflects the current architecture after the incremental hardening of the `comprehensive-product-audit-and-roadmap` change. The current focus is not to rewrite the product, but to operate it better: lower cost, better accessibility, stronger resilience, and a documented public surface for SEO and AI-SEO.

Current docs map: `docs/README.md`.

## 1. Executive summary

- Stack: Next.js 16 App Router, React 19, Bun, Firebase Admin, Firestore, Storage, Resend, Zod, Zustand, and SWR.
- Dominant pattern: App Router + service layer + validation/authorization wrappers.
- Rollout principle: everything is additive and flag-controlled; there are no destructive migrations.
- Operational goal: keep the product within free-tier budgets without degrading UX or accessibility.

## 2. System planes

### 2.1 Kiosk plane

- `src/app/(kiosk)` contains the on-site flow: entry, OTP, registration, consent, and success.
- `src/store/kioskStore.ts` persists key visitor state for local continuity.
- `src/lib/offline/*` implements the staged offline rollout:
  - Stage 1: shell/assets/session cache.
  - Stage 2: local consent queue.
  - Stage 3: idempotent replay against `offline_sync`.

### 2.2 Admin data plane

- `src/app/api/admin/*` delegates business logic to services and applies auth/permissions.
- `src/services/userService.ts`, `src/services/minorIndexService.ts`, and `src/app/api/admin/consents/route.ts` expose cursor-first contracts for administrative lists.
- Pagination uses opaque cursors (`src/lib/adminCursor.ts`, `src/lib/firestoreService.ts`) to avoid Firestore `offset` cost.
- Endpoints still allow the legacy fallback when `CURSOR_PAGINATION_ENABLED=false`.

### 2.3 Aggregate plane

- `src/services/adminMetricsService.ts` maintains the `admin_metrics/*` model.
- Primary documents:
  - `admin_metrics/overview`
  - `admin_metrics/daily:yyyy-mm-dd`
- The dashboard and detailed stats can read 1-5 aggregate documents instead of recomputing full scans when `ADMIN_AGGREGATES_ENABLED=true`.
- Every response exposes `freshness` so the UI can show whether data came from the aggregate plane or the live fallback.

### 2.4 Public discovery plane

- `src/app/(public)/consentimiento-digital/page.tsx` is the canonical public URL.
- `src/app/robots.ts`, `src/app/sitemap.ts`, and `src/app/llms.txt/route.ts` control traditional indexability and agent context.
- `src/lib/seo.ts` centralizes public routes, robots, canonical URLs, and JSON-LD.

### 2.5 Perimeter and security plane

- `src/proxy.ts` applies security headers and indexing controls for private surfaces.
- The perimeter keeps an enforced baseline CSP and uses `CSP_REPORT_ONLY_ENABLED` only for the stricter canary/report-only layer.
- The perimeter also maintains `X-Robots-Tag: noindex, nofollow` for private kiosk/admin routes.

## 3. Data flow

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
| `otp_challenges` | Pending OTP challenge | throttling, lockout, and expiration |
| `otp_access_sessions` | Validated kiosk session | short-lived validity and local recovery |
| `consents` | Signed consents | denormalized snapshots, atomic sequence |
| `minors_index` | Efficient minor search | denormalized projection |
| `admin_metrics` | Administrative read model | overview + daily documents + freshness |
| `offline_sync` | Idempotency ledger | same `dedupeKey` => same ack |
| `admin_audit_logs` | Immutable admin trace | actor, action, timestamp |

## 5. Cursor data plane

The most dangerous Firestore cost was not writing: it was skipping documents. That is why the admin surface is moving to opaque cursors.

- `CursorPageRequest`: `limit`, `cursor`, `search`.
- `CursorPageResponse`: `items`, `pageInfo`, `meta`.
- `pageInfo.nextCursor` is opaque, versioned, and bound to collection/field/order.
- `meta.source` distinguishes cursor reads from search reads.
- Administrative lists never return signed URLs in list views; they expose only `signatureStatus`.

Impact:

- reads stay bounded to 20-50 records per page;
- latency is more stable;
- rollback is immediate through a flag if operational drift appears.

## 6. Aggregates and recompute

The dashboard should not pay for full scans every time someone opens the admin.

- `adminMetricsService.getOverview()` reads/generates `admin_metrics/overview`.
- `adminMetricsService.getDetailed()` assembles KPIs with the overview plus daily documents.
- `freshness.computedAt` lets operators validate whether the aggregate is still inside the expected window.
- If an aggregate is missing or stale, controlled recompute exists; the live fallback remains available behind the flag.

Operational runbook: `docs/runbooks/admin-cost-smoke-checklist.md`.

## 7. Offline resilience

The offline strategy is deliberately staged.

### Stage 1

- cache the shell, assets, and most recent kiosk session;
- keep navigation working on already-visited screens without abrupt failures.

### Stage 2

- local queue for `consent.create`;
- operator feedback even when the network is down;
- automatic retry when the app comes back `online` and when the app starts.

### Stage 3

- `dedupeKey = sha256(userId + policyVersion + signedAtLocal)`;
- `offline_sync/{dedupeKey}` prevents duplicates and sequence drift;
- if the server already processed the payload, it returns the same ack.

Operational runbook: `docs/runbooks/offline-replay-drill.md`.

## 8. SEO, AI-SEO, and public artifacts

The public surface is intentionally small: one canonical page, consistent metadata, and files that search engines and agents can consume easily.

- `robots.txt` allows only the approved public surface.
- `sitemap.xml` publishes canonical URLs and excludes admin/kiosk.
- `llms.txt` describes the product, public routes, and citation boundaries.
- JSON-LD exposes `WebPage`, `WebSite`, and `AmusementPark` for semantic extraction.

Criteria in use:

- Google Search Central guidance for indexability, canonicals, and sitemaps.
- AI-SEO best practices for citable content, `llms.txt`, and clear boundaries between public and private surfaces.

Operational runbook: `docs/runbooks/seo-ai-seo-validation-checklist.md`.

## 9. Security and rollout

Current flags in `src/lib/hardeningPolicy.ts`:

- `OTP_HARDENING_ENABLED`
- `EXPORT_BOUNDS_ENFORCED`
- `PUBLIC_SEO_ENABLED`
- `CURSOR_PAGINATION_ENABLED`
- `ADMIN_AGGREGATES_ENABLED`
- `OFFLINE_QUEUE_ENABLED`
- `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`
- `CSP_REPORT_ONLY_ENABLED`

Principles:

- secure defaults for existing hardening;
- dark defaults for new capabilities with operational risk;
- rollback by disabling a flag and redeploying, not by reverting data.

Operational runbook: `docs/runbooks/rollback-flags.md`.

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
- offline idempotency: `tests/offline-resilience.test.ts`
- cursor/admin aggregates: `tests/foundation-rollout-scaffolding.test.ts`, `tests/phase5-verification-hardening.test.ts`
- perimeter headers/CSP: `tests/proxy.security.test.ts`
- pragmatic accessibility coverage for primitives: `tests/block-b-a11y-and-logging.test.tsx`
- reproducible browser a11y smoke: `playwright/accessibility.a11y.ts` executed with `bun run test:a11y:e2e`

Manual accessibility notes still matter in the runbooks because current coverage is smoke coverage, not a full matrix. The real status now is: browser automation DOES exist with Axe/Playwright for critical surfaces, but coverage STILL needs to expand across the full admin/kiosk end-to-end flows.

## 11. Traceability and decision records

Source-of-truth artifacts for this change:

- SDD traceability in Engram under `sdd/repo-hygiene-and-weight-audit/{proposal,spec,tasks,apply-progress,verify-report}`
- complementary operational evidence in `README.md` and `docs/runbooks/*`

Active ADR candidates inside that change:

- cursor vs. offset in Firebase;
- the `admin_metrics` aggregate plane;
- the kiosk offline-first architecture.
