# Lighthouse SEO report evidence

This file captures real PageSpeed Insights (PSI) / Lighthouse runs for the canonical public URL. It stays populated with **real scores only** — never invented numbers.

## Automated run attempts

| Date (UTC) | URL tested | Method | Performance | LCP (ms) | TBT (ms) | CLS | SEO | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-06-04T02:41 | https://www.jumpingpark.lat | PSI API (anonymous) | — | — | — | — | — | **Rate-limited**: HTTP 429 `RESOURCE_EXHAUSTED`. Anonymous daily quota exhausted. See failure details below. |

### Attempt #1 — 2026-06-04 failure details

```
HTTP 429 — Quota exceeded for quota metric 'Queries' and limit 'Queries per day'
Service: pagespeedonline.googleapis.com
Reason: RATE_LIMIT_EXCEEDED / RESOURCE_EXHAUSTED
```

**Fix**: Set `PSI_API_KEY` environment variable with a valid Google Cloud API key, then rerun:

```bash
PSI_API_KEY=your_key_here bun run scripts/validate-pagespeed.ts -- --url=https://www.jumpingpark.lat
```

## Manual run template

Until an automated run succeeds with an API key, fill rows manually from a browser-based Lighthouse audit (Chrome DevTools → Lighthouse tab, or https://pagespeed.web.dev/).

| Date | URL tested | Environment | Performance | LCP (ms) | TBT (ms) | CLS | SEO | Notes |
|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | https://www.jumpingpark.lat/consentimiento-digital | production |  |  |  |  |  |  |

## How to fill a row

1. Run Lighthouse or PageSpeed Insights against the URL. For production, use `https://www.jumpingpark.lat/consentimiento-digital` (the only indexed page per sitemap as of 2026-06-04).
2. Record the **four category scores** (Performance, Accessibility, Best Practices, SEO) as decimal numbers exactly as reported.
3. Record LCP, TBT, and CLS in the units shown by the report (ms and unitless).
4. In `Notes`, capture: deploy commit SHA, any deviation from budget, and any warnings Lighthouse surfaced.
5. Attach the screenshot or raw JSON to the same commit, under a dated filename (e.g. `2026-06-15-lighthouse-production.json`).

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — when to run Lighthouse and what to look for.
- `docs/runbooks/lighthouse-budget-rationale.md` — why CI numbers are looser than production.
- `lighthouserc.json` — CI thresholds only; do not paste CI JSON here.
