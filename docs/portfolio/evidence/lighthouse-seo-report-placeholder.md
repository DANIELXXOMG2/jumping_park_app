# Lighthouse SEO report evidence

This file captures real PageSpeed Insights (PSI) / Lighthouse runs for the canonical public URL. It stays populated with **real scores only** — never invented numbers.

## Automated runs (PSI API with key)

| Date (UTC) | URL tested | Method | Performance | LCP (ms) | TBT (ms) | CLS | SEO | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-06-04T03:41 | https://www.jumpingpark.lat/consentimiento-digital | PSI API (key) | 98 | 2362 | 90.5 | 0 | 100 | Primary public page. All budgets passed. |
| 2026-06-04T03:40 | https://www.jumpingpark.lat | PSI API (key) | 83 | 4323 | 83.5 | 0.083 | 66 | Homepage. LCP over 2500ms budget. SEO 66 needs investigation. |

## Analysis

### consentimiento-digital (primary indexed page)
- **Performance 98/100**: Excellent. LCP 2362ms under 2500ms budget. TBT 90.5ms well under 300ms. CLS 0.
- **SEO 100/100**: Perfect. All meta tags, structured data, crawlability checks pass.

### Homepage (/)
- **Performance 83/100**: Good but below 90 target. LCP 4323ms exceeds 2500ms budget — likely due to heavy initial render.
- **SEO 66/100**: Needs investigation. May be missing meta description, viewport issues, or link text problems.
- **CLS 0.083**: Under 0.1 budget but not zero — some layout shift present.

## Manual run template

For additional pages or environments, fill rows manually from a browser-based Lighthouse audit (Chrome DevTools → Lighthouse tab, or https://pagespeed.web.dev/).

| Date | URL tested | Environment | Performance | LCP (ms) | TBT (ms) | CLS | SEO | Notes |
|---|---|---|---|---|---|---|---|---|
| YYYY-MM-DD | URL | production |  |  |  |  |  |  |

## How to fill a row

1. Run Lighthouse or PageSpeed Insights against the URL.
2. Record the **four category scores** (Performance, Accessibility, Best Practices, SEO) as decimal numbers exactly as reported.
3. Record LCP, TBT, and CLS in the units shown by the report (ms and unitless).
4. In `Notes`, capture: deploy commit SHA, any deviation from budget, and any warnings Lighthouse surfaced.
5. Attach the screenshot or raw JSON to the same commit, under a dated filename (e.g. `2026-06-15-lighthouse-production.json`).

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — when to run Lighthouse and what to look for.
- `docs/runbooks/lighthouse-budget-rationale.md` — why CI numbers are looser than production.
- `lighthouserc.json` — CI thresholds only; do not paste CI JSON here.
