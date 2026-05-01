# Jumping Park

Jumping Park is a Next.js 16 + Bun application for managing digital consent at a trampoline park. The product combines a kiosk-first visitor flow, OTP access validation, digital signature capture, offline-safe replay, and an admin surface optimized for low Firestore cost.

## Product Story

- Visitors identify themselves in the kiosk, validate access with OTP, review legal terms, and sign without paper.
- Operators get a controlled admin panel for users, minors, consents, exports, and aggregate metrics.
- The current roadmap hardens the product around three goals: accessibility, free-tier sustainability, and public discoverability.

## Architecture Snapshot

```text
Kiosk UI -> OTP challenge/session -> consentService -> Firestore + Storage
         -> offline queue (IndexedDB/local fallback) -> offline_sync ledger

Admin UI -> /api/admin/* -> live-query/offset fallback today, with cursor queries + admin_metrics behind rollout flags
Public SEO surface -> /consentimiento-digital + robots + sitemap + llms.txt + JSON-LD
Perimeter -> src/proxy.ts -> security headers + CSP report-only rollout
```

Core implementation references:

- `src/services/authService.ts` - OTP lifecycle, lockouts, kiosk access sessions.
- `src/services/consentService.ts` - consent creation, atomic counter, PDF/signature access, offline replay ledger.
- `src/services/adminMetricsService.ts` - `admin_metrics/*` aggregate model and freshness handling.
- `src/lib/hardeningPolicy.ts` - rollout flags for SEO, cursors, aggregates, offline queue, CSP report-only.
- `src/proxy.ts` - perimeter headers, `X-Robots-Tag`, and CSP report-only behavior.

## Runtime Surfaces

| Surface | Purpose | Notes |
| --- | --- | --- |
| `src/app/(kiosk)` | On-site visitor flow | Accessible flow, offline continuity, non-indexable |
| `src/app/(admin)` | Protected back-office | Cursor-first lists, aggregate metrics, immutable audit hooks |
| `src/app/(public)` | Public shareable page | Canonical SEO/AI-SEO surface |
| `src/app/api` | Service-oriented API routes | Firebase Admin only, Zod validation, route hardening, with some legacy route-layer orchestration still present |

## Rollout Flags

These flags are additive and safe to disable for rollback. Local changes require restarting `bun dev`; preview/production changes require a fresh deploy.

| Flag | Default | Purpose | Rollback effect |
| --- | --- | --- | --- |
| `OTP_HARDENING_ENABLED` | `true` | OTP throttling and lockouts | Restores legacy permissive behavior |
| `EXPORT_BOUNDS_ENFORCED` | `true` | Rejects wide/unbounded admin exports | Re-enables capped fallback export mode |
| `PUBLIC_SEO_ENABLED` | `true` | Exposes indexable public SEO routes | Returns `Disallow: /` and noindex metadata |
| `CURSOR_PAGINATION_ENABLED` | `false` | Enables cursor-first admin listing | Falls back to offset pagination |
| `ADMIN_AGGREGATES_ENABLED` | `false` | Uses `admin_metrics/*` read models | Falls back to live reads |
| `OFFLINE_QUEUE_ENABLED` | `false` | Enables server-side offline replay handling | Disables queue acceptance/replay on the backend |
| `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` | `false` | Enables kiosk-side queue UX, storage, and retry wiring | Disables offline queue UI/runtime in the browser |
| `CSP_REPORT_ONLY_ENABLED` | `false` | Adds the stricter canary/report-only CSP alongside the enforced baseline | Removes the report-only header and keeps only the enforced baseline |

Keep `OFFLINE_QUEUE_ENABLED` and `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` aligned. Turning on only one side creates a partial rollout: browser queue UX without server replay, or server replay readiness without kiosk queue capture.

Deploy Firebase indexes/rules before enabling `ADMIN_AGGREGATES_ENABLED`, `CURSOR_PAGINATION_ENABLED`, or the offline queue flags.

Exact Firestore index parity still needs emulator/query-log evidence or production deploy feedback before Phase 5 can claim a final PASS.

Full rollback steps live in `docs/runbooks/rollback-flags.md`.

## CSP rollout notes

- The enforced baseline in `src/proxy.ts` now blocks frames/object embeds, allows workers only from `self`/`blob:`, and removes broad remote script origins while keeping current Next.js behavior intact.
- `CSP_REPORT_ONLY_ENABLED=true` adds a stricter canary policy for observation before any future enforcement tightening.
- Inline scripts/styles are still temporarily allowed because the public JSON-LD surface and current framework/runtime behavior still rely on them; tighten those in a staged follow-up once nonce/hash coverage exists.

## Development

This repository uses Bun only.

```bash
bun install
bun dev
bun test
bun run check:format
bun run check:lint
bun run check:types
bun run check:phase5
```

Safe verification scripts:

- `bun run check:format` and `bun run check:lint` are non-mutating CI gates.
- `bun run fix:format` and `bun run fix:lint` are the explicit write commands for local cleanup.

## Quality Gates

Baseline gates expected before merge:

- `bun test tests/phase4-production-artifacts.test.ts`
- `bun test`
- `bun run check:format`
- `bun run check:lint`
- `bun run check:types`
- `bun run audit:dead`
- `bun run audit:dupe`
- `bun run audit:circ`

Phase 5 focused checks:

- SEO routes and `llms.txt`: `tests/seo-public.test.ts`, `tests/phase5-verification-hardening.test.ts`
- Offline idempotency and replay metadata: `tests/offline-resilience.test.ts`
- Cursor/admin aggregate contracts: `tests/foundation-rollout-scaffolding.test.ts`, `tests/phase5-verification-hardening.test.ts`
- A11y smoke guidance: `docs/runbooks/seo-ai-seo-validation-checklist.md` and `docs/runbooks/production-hardening.md`

## Firestore Model Highlights

| Collection | Role |
| --- | --- |
| `users` | Adult visitor profiles |
| `consents` | Signed consent records with denormalized snapshots |
| `minors_index` | Searchable denormalized minor records |
| `otp_challenges` | Pending OTP challenge state |
| `otp_access_sessions` | Validated kiosk access sessions |
| `admin_metrics` | Aggregate dashboard overview + daily metrics |
| `offline_sync` | Server-side dedupe ledger for offline replay |
| `admin_audit_logs` | Immutable admin audit trail |

## Docs IA

- `docs/README.md` - current documentation map with status markers for current vs historical artifacts.
- `docs/ARQUITECTURA.md` - current architecture, data plane, rollout model, and SEO surface.
- `docs/runbooks/production-hardening.md` - operational entry point for smoke drills.
- `docs/runbooks/dependency-risk-note.md` - current dependency audit status, accepted residual risk, and follow-up policy.
- `docs/runbooks/rollback-flags.md` - flag rollback matrix.
- `docs/runbooks/offline-replay-drill.md` - staged offline queue and replay drill.
- `docs/runbooks/admin-cost-smoke-checklist.md` - cursor/aggregate cost validation.
- `docs/runbooks/seo-ai-seo-validation-checklist.md` - SEO, AI-SEO, and a11y smoke checklist.
- `CONTRIBUTING.md` - contribution workflow, quality gates, and SDD expectations.
- `docs/portfolio/README.md` - portfolio capture conventions and asset plan.
- `diagramas/README.md` - current editable architecture diagrams and usage notes.
- `docs/MANUAL_USUARIO.md`, `docs/MANUAL_INSTALACION.md`, `docs/INFORME_TECNICO_SPRINT_3.md`, `docs/ESTRUCTURA_PROYECTO.md` - historical snapshots kept for context only; use the current docs above as source of truth.

Archived decision records and roadmap artifacts:

- `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/proposal.md`
- `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/design.md`
- `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/tasks.md`

## Demo And Portfolio

For portfolio-grade capture, use the public route as the canonical storytelling surface and pair it with kiosk/admin evidence from real environments only.

- Asset structure and placeholders: `docs/portfolio/README.md`
- Screenshot checklist: `docs/portfolio/screenshots/README.md`
- Diagram guidance: `docs/portfolio/diagrams/README.md`
- GIF/video script: `docs/portfolio/motion/demo-script.md`
- Logo usage recommendations: `docs/portfolio/branding/logo-usage.md`

Do not commit fake binaries. Keep only real captures or text placeholders that describe what still needs to be recorded.

The root `diagramas/` folder now contains the editable Mermaid source for the current high-level architecture. Treat `docs/ARQUITECTURA.md` as the narrative source of truth and `diagramas/` as its visual companion.
