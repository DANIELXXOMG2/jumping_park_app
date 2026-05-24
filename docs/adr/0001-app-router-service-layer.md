# ADR-0001: Keep App Router routes thin and service-driven

- **Status**: Accepted
- **Last reviewed**: 2026-05-16

## Decision

We keep the current Next.js App Router + service-layer backend shape. Route handlers own HTTP concerns such as request validation, auth checks, and response codes; service files own the business logic, Firestore access, and response-shaping rules that are reused across admin and kiosk flows.

## Repository evidence

- `src/app/api/admin/consents/route.ts` authenticates, parses query params, and delegates the actual list-building work to `listAdminConsents`.
- `src/app/api/admin/session/route.ts` validates the session-exchange body, then delegates cookie/session work to `adminSessionService`.
- `src/services/adminConsentListService.ts` owns cursor application, list shaping, and freshness metadata for the admin consents surface.
- `src/lib/apiHandler.ts` centralizes request-body validation and structured API error handling so route files stay small.

## Engram-backed context

- `#540` ÔÇö `sdd/comprehensive-product-audit-and-roadmap/design` explicitly chose to ship additive hardening on the existing ÔÇ£Next.js App Router + service-layer + Firebase Admin stackÔÇØ instead of rewriting the product architecture.

## Consequences

- New backend behavior should usually start in a service file, not directly inside a route handler.
- Thin routes make docs, tests, and rollbacks easier because HTTP wiring stays separated from data logic.
- Some route-local orchestration still exists in the repo, so this ADR describes the dominant pattern, not a perfect universal rule.
