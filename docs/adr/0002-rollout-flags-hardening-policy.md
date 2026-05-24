# ADR-0002: Centralize rollout flags in a shared hardening policy

- **Status**: Accepted
- **Last reviewed**: 2026-05-16

## Decision

We keep rollout and hardening decisions in one typed resolver: `src/lib/hardeningPolicy.ts`. Routes, services, SEO surfaces, and the perimeter read shared flag evaluations instead of each feature branching directly on `process.env`.

## Repository evidence

- `src/lib/hardeningPolicy.ts` defines the rollout flag catalog, default states, typed evaluation helpers, and additive policy headers/events.
- `src/proxy.ts` reads `CSP_REPORT_ONLY_ENABLED` through `evaluateHardeningFlag(...)` before deciding whether to emit `Content-Security-Policy-Report-Only`.
- `src/lib/seo.ts` reads the public SEO policy before generating robots metadata, `robots.txt`, and `sitemap.xml` output.

## Engram-backed context

- `#492` ÔÇö `sdd/rollout-flags-and-observability-hardening/design` chose a shared policy module over inline `process.env` checks so OTP, exports, SEO, and later hardening surfaces could roll out consistently.

## Consequences

- Rollout changes should add to the shared policy module before touching feature-specific branches.
- Safe rollback is environment-driven for most hardening capabilities; changing a flag is cheaper than reverting data-model code.
- Because these decisions are env-driven, preview/production changes still require a redeploy and local changes still require a server restart.
