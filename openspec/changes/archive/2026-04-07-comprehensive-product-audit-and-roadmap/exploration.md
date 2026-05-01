## Exploration: comprehensive-product-audit-and-roadmap

### Current State
The product is a production-capable Next.js 16 + React 19 + Bun app with a clear service-layer split, hardened OTP/admin-session rollout work, SWR-based admin fetching, and a polished kiosk UX. The biggest gaps are not basic functionality but operational depth: accessibility discipline, free-tier cost ceilings at scale, cursor-based pagination/scalable querying, offline write strategy, stronger CSP/browser hardening, and professional docs alignment with the current codebase.

### Affected Areas
- `src/app/layout.tsx` - root metadata and viewport include anti-SEO defaults plus disabled zoom.
- `src/proxy.ts` - edge security headers and route-wide `X-Robots-Tag`; CSP still allows `unsafe-inline` and `unsafe-eval`.
- `src/lib/firestoreService.ts` - generic list helpers default to offset/limit patterns and broad reads.
- `src/services/userService.ts` - user/staff/minor pagination relies on Firestore offsets and fallback in-memory filtering.
- `src/services/minorIndexService.ts` - minor search/pagination improves reads but still uses offsets and fallback scans.
- `src/app/api/admin/consents/route.ts` - consent listing/search mixes optimized token search with expensive signed URL generation per row.
- `src/app/api/admin/stats/detailed/route.ts` - statistics endpoint caps reads but still computes analytics from live documents instead of pre-aggregates.
- `src/lib/firebaseClient.ts` - client Firestore persistence exists, but offline support is partial and admin/API fetches do not queue writes.
- `src/app/(kiosk)/**/*.tsx` - kiosk flow is visually strong but has WCAG risks around zoom, motion, live regions, and screen-reader flow.
- `src/app/(admin)/admin/(protected)/**/*.tsx` - admin surface is functional but table scalability, accessibility, and cache semantics need tightening.
- `docs/*.md` and `README.md` - documentation is broad but partially stale/inconsistent with current runtime, tests, and security model.

### Approaches
1. **Incremental hardening roadmap** - Keep the current stack and progressively fix high-risk gaps in layers.
   - Pros: Lowest migration risk, preserves current product momentum, fits free-tier budget, easy to phase through SDD.
   - Cons: Some structural debt remains longer; offset pagination and mixed auth/runtime patterns still need staged cleanup.
   - Effort: Medium

2. **Architecture reset for scale-first operations** - Rework admin data access, offline model, observability, and docs around a stricter domain/application boundary plus aggregate-read models.
   - Pros: Best long-term scalability, clearer portfolio-grade architecture, better cost predictability for stats/search/offline.
   - Cons: Higher delivery risk, larger refactor surface, more opportunity for regressions in kiosk/admin flows.
   - Effort: High

### Recommendation
Choose the incremental hardening roadmap now. The codebase already has enough architectural structure to reach a strong production baseline without a rewrite; the next proposal should target accessibility/security/cost/scalability hot spots first, then move admin analytics and pagination toward cursor/aggregate models.

### Risks
- Firestore offset pagination and fallback scans will become progressively more expensive and slower as records grow.
- Accessibility debt is currently severe enough to block blind-user readiness despite otherwise polished UI.
- The current root viewport disables zoom, which is a direct WCAG/mobile accessibility failure.
- Admin list endpoints can amplify cost by generating signed URLs or wide scans during search/export flows.
- Documentation drift can mislead deployment/security decisions because some docs still describe outdated rules/scripts/runtime assumptions.

### Ready for Proposal
Yes - propose a phased hardening change focused on: accessibility/WCAG remediation, security header tightening, cursor-based pagination, aggregate analytics, offline-read/write strategy, public SEO/AI-SEO expansion, and repository/documentation professionalization.
