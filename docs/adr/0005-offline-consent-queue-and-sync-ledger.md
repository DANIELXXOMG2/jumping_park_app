# ADR-0005: Replay offline consents through a staged queue and idempotent ledger

- **Status**: Accepted
- **Last reviewed**: 2026-05-16

## Decision

We keep offline kiosk support as a staged model instead of a parallel direct-write architecture:

1. cache shell/assets/session state for kiosk continuity,
2. queue consent submissions locally in the browser,
3. replay them through the existing consent API with an `offline_sync` idempotency ledger keyed by `dedupeKey`.

## Repository evidence

- `src/lib/offline/sync.ts` retries queued items, distinguishes transient/permanent/idempotent failures, and removes already-acknowledged items safely.
- `src/app/api/consentimientos/route.ts` reuses the normal consent creation path and forwards optional `offlineSync` metadata instead of creating a separate offline-only endpoint.
- `src/types/firestore.ts` defines the `OfflineSyncLedger` contract that records `dedupeKey`, consent identity, ack timing, and source metadata.

## Engram-backed context

- `#540` ÔÇö `sdd/comprehensive-product-audit-and-roadmap/design` chose ÔÇ£assets/session cache -> local consent queue -> deterministic sync ledgerÔÇØ over a full client-side Firestore rewrite.
- `#556` ÔÇö `Implemented offline consent queue rollout` records the production detail that the original dedupe key must survive retry/replay, otherwise duplicate consents can be created after a mid-flight failure.

## Consequences

- Offline work should continue to reuse the same consent API contract so online and replayed writes stay behaviorally aligned.
- Idempotency is a first-class requirement; changing how `dedupeKey` is built or persisted is a high-risk modification.
- The queue can reject permanently invalid payloads, so operator-facing UX needs to keep explaining sync failures clearly.
