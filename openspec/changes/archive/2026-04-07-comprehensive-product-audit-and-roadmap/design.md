# Design: Comprehensive Product Audit & Roadmap

## Technical Approach

Ship additive hardening on the existing Next.js App Router + service-layer + Firebase Admin stack. Add accessible kiosk semantics, cursor-first admin APIs with aggregate read models, staged kiosk-only offline queueing, stricter perimeter headers/CSP plus immutable admin audit events, and public SEO/AI-SEO/docs surfaces.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Accessibility delta | Keep current route/component structure; add landmarks, live regions, keyboard flows, and remove zoom lock in `src/app/layout.tsx` | Rebuild kiosk UI | Lowest risk path to WCAG coverage. |
| Admin data plane | Replace `offset` contracts with opaque cursors and `admin_metrics/*` docs | Keep offsets + caps | Firestore bills skipped docs; cursors/aggregates protect free tier. |
| Signed URL enrichment | No signed URLs in list endpoints; detail/PDF only | Persist cached signed URLs | Avoids N storage calls and expired URL churn. |
| Offline model | Assets/session cache -> local consent queue -> deterministic sync ledger | Full Firestore client rewrite | Fits current Admin SDK architecture. |
| Security | Harden `src/proxy.ts` centrally; add audit writes in admin mutations | Per-route headers | One perimeter is consistent and testable. |
| SEO/docs surface | Extend metadata pipeline with `llms.txt`, richer JSON-LD, and linked docs | Public-site rewrite | Minimal surface growth. |

## Data Flow

```mermaid
flowchart LR
KioskUI-->Queue[(indexedDB: kiosk_queue)]
KioskUI-->Session[(localStorage/session cache)]
Queue--online sync-->ConsentAPI[/api/consentimientos]
ConsentAPI-->ConsentSvc[consentService]
ConsentSvc-->FS[(Firestore + Storage)]
AdminUI-->AdminAPI[/api/admin/*]
AdminAPI-->ReadModels[(admin_metrics + cursor queries)]
AdminAPI-->Audit[(admin_audit_logs)]
PublicRoute-->SEO[robots/sitemap/llms + JSON-LD]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/layout.tsx` | Modify | Remove zoom lock; add viewport defaults. |
| `src/proxy.ts` | Modify | CSP/header hardening and report-only flag. |
| `src/lib/hardeningPolicy.ts` | Modify | Flags for cursors, aggregates, offline queue, CSP report-only. |
| `src/lib/firestoreService.ts` | Modify | Cursor helpers and opaque token encoding. |
| `src/app/api/admin/{users,consents,minors,stats,stats/detailed}/route.ts` | Modify | Cursor contracts, aggregate reads, no list signed URLs. |
| `src/services/{userService,minorIndexService,consentService}.ts` | Modify | Cursor queries, detail-only asset access, aggregate hooks. |
| `src/store/kioskStore.ts` + `src/lib/offline/*` | Modify/Create | Queue state, sync worker, idempotency helpers. |
| `src/app/{robots.ts,sitemap.ts}` + `src/app/llms.txt/route.ts` | Modify/Create | SEO/AI-SEO artifacts. |
| `README.md`, `docs/ARQUITECTURA.md`, `docs/runbooks/*` | Modify | Docs and rollout runbook. |

## Interfaces / Contracts

```ts
type CursorPageRequest = { limit?: 20|50; cursor?: string; search?: string }
type CursorPageResponse<T> = {
  items: T[]
  pageInfo: { nextCursor: string | null; hasNextPage: boolean }
  meta?: { totalApprox?: number; source: 'cursor' | 'search' }
}
type DashboardMetrics = {
  totals: { users: number; consents: number; minors: number }
  daily: Record<string, { users: number; consents: number; minors: number }>
  freshness: { computedAt: string; source: 'aggregate' }
}
type OfflineQueueItem = {
  id: string; kind: 'consent.create'; dedupeKey: string; payload: ConsentFormData;
  createdAt: string; attempts: number; lastError?: string; syncState: 'pending'|'syncing'|'failed'
}
```

Aggregate model: additive docs under `admin_metrics/overview` and `admin_metrics/daily/{yyyy-mm-dd}`. Counters update on consent/user writes. Consent lists return `signatureStatus`, never a signed URL.

Offline internals: Stage 1 caches shell/assets + kiosk session snapshot. Stage 2 stores `OfflineQueueItem[]` in IndexedDB, retries on `online`/app-start with backoff (30s/2m/10m), and uses `dedupeKey = sha256(userId+policyVersion+signedAtLocal)`. Stage 3 adds `offline_sync/{dedupeKey}`; if the server already processed the key, it acks existing data, otherwise it creates the consent and reserves the consecutive number server-side.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Cursor codec, queue reducer, dedupe rules, SEO builders | `bun test` pure modules |
| Integration | Cursor responses, aggregate reads, sync idempotency, audit writes | Route/service tests with mocked Firestore Admin |
| E2E | Kiosk happy path, offline queued submit/reconnect, admin pagination | Playwright against local app/emulators |
| Accessibility | Keyboard nav, live regions, zoom/reflow, labels | Axe + focused viewport assertions |
| Perf budgets | Admin p95 + read budgets | Assert page-size/query paths in tests/runbook |

## Migration / Rollout

Additive only: create `admin_metrics/*`, `admin_audit_logs`, and `offline_sync`; ship CSP in report-only first; gate cursors, aggregates, and offline sync behind env flags; keep offset handlers for one release; rollback by disabling flags. No destructive schema changes.

## Risks and Mitigations

| Risk | Mitigation | Owner candidate |
|---|---|---|
| Aggregate drift | Nightly recompute script + freshness timestamp | Backend/Firebase owner |
| Offline duplicates | Client dedupe key + server idempotency ledger | Kiosk/frontend owner |
| CSP blocks existing scripts | Report-only phase and route-specific allowlist | Platform/security owner |
| A11y regressions from visual components | Axe CI + manual keyboard/screen-reader pass | Frontend owner |

## Traceability Matrix

| Design component | Spec requirements |
|---|---|
| Viewport + semantic/live-region retrofit | Kiosk WCAG support, zoom/reflow, quality gates |
| Cursor contracts + aggregate docs | Admin cost-efficient pagination, pre-aggregated statistics |
| Audit log writes + hardened proxy/CSP | Admin security and audit trail |
| IndexedDB queue + sync ledger | Offline Stage 1, Stage 2, Stage 3 |
| `robots`/`sitemap`/`llms.txt` + JSON-LD | AI crawler discoverability, search engine indexability |
| README/docs/runbooks refresh | Documentation and repository order |

## Open Questions

- [ ] None blocking; sequence by flags: SEO/a11y/security -> admin cursors/aggregates -> offline queue.
