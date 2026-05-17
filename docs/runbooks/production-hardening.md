# Production hardening hub

This document is the operational entry point. If you need to validate, enable, or roll back a roadmap capability, start here and then move to the specialized runbook.

Current companions of this hub:

- `docs/README.md` to distinguish active docs from historical ones.
- `docs/runbooks/dependency-risk-note.md` for the current `bun audit` status and the accepted residual risk (today: transitive/tooling only, no reported direct runtime dependencies).

## Recommended order

1. Confirm flags and environment with `docs/runbooks/rollback-flags.md`.
2. Validate the admin cost plane with `docs/runbooks/admin-cost-smoke-checklist.md`.
3. Run the offline drill with `docs/runbooks/offline-replay-drill.md` if `OFFLINE_QUEUE_ENABLED=true` and `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=true`.
4. Validate SEO/AI-SEO and a11y notes with `docs/runbooks/seo-ai-seo-validation-checklist.md` before opening indexing.
5. Review `docs/runbooks/dependency-risk-note.md` before tightening the dependency gate or accepting large upgrades.

Firebase IaC parity: review `firebase/firestore.indexes.json`, `firebase/firestore.rules`, and `firebase/storage.rules` before any flag enablement.

## Minimum release smoke pack

- `bun test`
- `bun test tests/phase4-production-artifacts.test.ts`
- `bun run check:lint`
- `bun run check:types`
- `bun run check:phase5`

## Important CI note

- `bun run check:format` and `bun run check:lint` no longer write files.
- If you need local fixes, use `bun run fix:format` and `bun run fix:lint`.
- Do not use a gate that mutates the workspace: that breaks reproducibility and contaminates the evidence.

## Approval criteria

Do not enable new flags in production if any of these points are missing:

- Documented and tested rollback.
- Stable admin cost smoke.
- Offline replay without duplicates when it applies.
- SEO/AI-SEO validated against the real deployment.
- Manual a11y notes recorded.

## Current limitations we must NOT hide

- Dependencies: `bun audit` still shows residual transitive/tooling risk. The current gate blocks new direct findings, but it does not pretend the upstream debt has already disappeared.
- Accessibility: a reproducible browser smoke already exists with Axe/Playwright (`bun run test:a11y:e2e`), but it still does not cover a full E2E matrix for every admin/kiosk route.

## CSP staged tightening

- Baseline enforced: `src/proxy.ts` always emits an active CSP with `frame-src 'none'`, `object-src 'none'`, `worker-src 'self' blob:`, `manifest-src 'self'`, and no broad remote script origins.
- Optional canary: `CSP_REPORT_ONLY_ENABLED=true` adds a stricter `Content-Security-Policy-Report-Only` header so compatibility can be observed before tightening enforcement.
- Known limitation: `unsafe-inline` is still present for compatibility with the current runtime and the inline JSON-LD on the public surface; do NOT remove it in production until nonces/hashes and a real browser smoke are covered first.
