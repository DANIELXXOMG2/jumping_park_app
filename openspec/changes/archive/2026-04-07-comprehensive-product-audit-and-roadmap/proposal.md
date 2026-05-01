# Proposal: Comprehensive Product Audit & Roadmap

## Intent
Transform the kiosk app into a scalable, accessible, and cost-efficient production system. 
**Why now**: Free-tier limits (Vercel Hobby, Firebase Blaze $0) will break under scale without optimized data access (pagination/aggregates), and current a11y blocks blind users.
**Goals**: Zero-cost scaling, WCAG compliance, maximize SEO and AI crawler discoverability and indexability.
**Non-goals**: App rewrites, breaking production, paid infrastructure.

## Scope
### In Scope
- **A11y/Offline**: Screen-reader flow, zoom enablement, staged offline write-queueing.
- **Cost/DB**: Cursor pagination, pre-aggregated stats, token search logic.
- **SEO/AI-SEO**: Semantic tags, `llms.txt`, sitemaps, structured data.
- **Security**: Strict CSP, headers.
### Out of Scope
- Migrating off Firebase/Vercel.
- Complex state management rewrites (keeping Zustand/SWR).

## Capabilities
### New Capabilities
- `seo-optimization`: Public indexability and AI crawler (`llms.txt`) support.
- `offline-resilience`: Kiosk fault tolerance without connectivity via a staged rollout strategy.

### Modified Capabilities
- `admin-dashboard`: Cursor-based pagination, aggregated analytics (cost control) with strict performance targets.
- `kiosk-flow`: WCAG accessibility (screen readers, zoom).

## Approach
**Guiding Principles**: "No reinventar la rueda", pragmatic best-practices, evidence-based choices.

**Phased Plan (Now/Next/Later)**
1. *Now (Seed)*: A11y fixes (zoom, ARIA), security headers, SEO/AI-SEO baseline, Stage 1 Offline.
2. *Next*: Cursor pagination, pre-aggregated stats, Stage 2 Offline.
3. *Later*: Advanced caching, ADR finalization, Stage 3 Offline.

**Cost-Control & Metrics Strategy**
To maintain free-tier viability, strict performance and cost metrics are enforced per admin module.

| Admin Module | Target Reads/Page | p95 Latency Target | Est. Cost Exposure / 1k Requests |
|--------------|-------------------|--------------------|----------------------------------|
| Dashboard / Stats | 1-5 (Aggregated) | < 300ms | Negligible (< $0.001) |
| Users        | 20-50 | < 400ms | < $0.015 (Standard free-tier limits) |
| Consents     | 20-50 | < 500ms | < $0.015 (Standard free-tier limits) |
| Minors       | 20-50 | < 400ms | < $0.015 (Standard free-tier limits) |

- *Admin/Stats*: Shift from live reads to pre-aggregated documents.
- *Users/Consents/Minors*: Replace offset/scans with cursor pagination and tokenized text search. Prevent signed-URL loops.

**SEO + AI-SEO**
- Dynamic sitemap/robots.txt, metadata API, and explicit `llms.txt` for AI discovery.

**Accessibility & Offline**
- Remove zoom restrictions (`maximum-scale=1`), add live regions, semantic HTML.
- **Offline Strategy (3-Stage Rollout)**:
  - *Stage 1*: Read-only offline (cache basic data, static assets, and active auth states).
  - *Stage 2*: Queued writes (store consent submissions locally via IndexedDB/Zustand when offline, sync when online).
  - *Stage 3*: Conflict resolution policy with deterministic rules (e.g., server timestamp-wins for duplicate submissions, atomic counter guarantees for offline-generated forms).

**Decision Log Candidates (ADRs)**
- ADR: Cursor vs Offset Pagination in Firebase.
- ADR: Pre-aggregated Statistics Model.
- ADR: Offline-first Kiosk Architecture.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `layout.tsx`, `proxy.ts` | Modified | SEO, zoom, CSP headers |
| `firestoreService.ts` | Modified | Cursor pagination |
| `stats/detailed/route.ts` | Modified | Pre-aggregated reads |
| `(kiosk)/**/*.tsx` | Modified | WCAG, offline queues |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Production breakage | Low | Incremental phase rollouts (Now/Next/Later) |
| Firebase scan costs | High | Implement cursor pagination & aggregates ASAP |
| A11y regressions | Med | Automated Axe checks in CI |
| Offline data loss | Med | Staged offline rollout, robust local persistence testing |

## Rollback Plan
Revert via Git commits per phase. Since DB schemas aren't destructively changed (adding cursors/aggregates is additive), code rollbacks are safe without data loss.

## Dependencies
- Resend (Free), Vercel (Hobby), Firebase (Blaze $0).

## Success Criteria
- [ ] Lighthouse A11y & SEO scores > 95.
- [ ] Admin reads scale O(1) page size, not O(N) offset, meeting latency targets.
- [ ] Kiosk functions offline through all 3 stages without data loss.
- [ ] Zero infrastructure cost incurred.
