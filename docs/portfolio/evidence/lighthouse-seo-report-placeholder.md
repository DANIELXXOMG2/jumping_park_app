# Lighthouse SEO report evidence

This file is the **template** for committed Lighthouse (or PageSpeed Insights) evidence for the public marketing surface. It stays empty until a real run is captured. Do not invent scores.

## What real evidence looks like

- A **manual run** of Lighthouse (Chrome DevTools) or PageSpeed Insights against the canonical public URL listed in the runbook `docs/runbooks/seo-ai-seo-validation-checklist.md`.
- A **screenshot** of the Lighthouse summary panel (Performance, Accessibility, Best Practices, SEO categories) or a copy/paste of the JSON report.
- The **build/deploy commit SHA** that was live when the run was taken, so the result can be reproduced.

## What does NOT count as evidence

- Lighthouse CI artifacts. `lighthouserc.json` uploads to `temporary-public-storage`, which **expires**. Treat CI as a guardrail, not as a portfolio record. See `docs/runbooks/lighthouse-budget-rationale.md` for the CI-vs-production rationale.
- A redacted or paraphrased score. If the panel said "0.82", the table says "0.82" — not "good", not "passing", not "✅".
- A number from a different URL or environment than the one declared in the table.

## Report template

| Date | URL tested | Environment | Performance | LCP (ms) | TBT (ms) | CLS | SEO | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | https://www.example.com/consentimiento-digital | production |  |  |  |  |  |  |
| YYYY-MM-DD | https://www.example.com/consentimiento-digital | preview |  |  |  |  |  |  |

## How to fill a row

1. Run Lighthouse or PageSpeed Insights against the URL with the same `PUBLIC_SEO_ENABLED` flag the production environment uses.
2. Record the **four category scores** (Performance, Accessibility, Best Practices, SEO) as decimal numbers exactly as reported — do not round, do not invert.
3. Record LCP, TBT, and CLS in the units shown by the report (ms and unitless).
4. In `Notes`, capture: deploy commit SHA, any deviation from the budget, and any warnings Lighthouse surfaced.
5. Attach the screenshot or raw JSON to the same commit, under a dated filename (for example `2026-06-15-lighthouse-production.json`).

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — when to run Lighthouse and what to look for.
- `docs/runbooks/lighthouse-budget-rationale.md` — why CI numbers are looser than production, and what production should aim for.
- `lighthouserc.json` — CI thresholds only; do not paste CI JSON here.
