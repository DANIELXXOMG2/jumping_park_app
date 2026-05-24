# ADR-0004: Prefer opaque cursors and aggregate docs for admin reads

- **Status**: Accepted
- **Last reviewed**: 2026-05-16

## Decision

We treat Firestore `offset` reads as a compatibility fallback, not the preferred admin contract. The primary direction is opaque cursor pagination for list endpoints plus `admin_metrics/*` aggregate documents for dashboard-style stats and freshness-aware rollups.

## Repository evidence

- `src/lib/adminCursor.ts` encodes and validates collection-bound cursor tokens ordered by `createdAt` plus document id.
- `src/services/adminConsentListService.ts` switches between offset and cursor behavior through `resolveHardeningPolicy()`, returns `pageInfo.nextCursor`, and intentionally keeps `signatureUrl: null` in list results.
- `src/services/adminMetricsService.ts` owns the `admin_metrics` overview/daily model and freshness evaluation for admin KPI reads.

## Engram-backed context

- `#540` ÔÇö `sdd/comprehensive-product-audit-and-roadmap/design` chose cursor-first admin APIs with aggregate read models because Firestore bills skipped documents and full-scan dashboards do not scale well on budget.
- `#555` ÔÇö `Completed Phase 3 admin data-plane with manual smoke blocker` records that cursor-ready list contracts, the `admin_metrics` read model, and immutable admin audit writes were applied together as the live admin data-plane direction.

## Consequences

- Admin list endpoints should add cursor support first when new list surfaces are introduced.
- Dashboard/reporting features should prefer aggregate freshness contracts instead of repeated collection-wide scans.
- Any future cleanup that removes the offset fallback must be coordinated with rollout flags and regression tests.
