# Portfolio evidence folder

This folder holds **real, reviewable evidence** for the public marketing surface and the supporting public/private architecture. Every file here is a **placeholder template** until a real run produces actual numbers, and every value that lands here must come from a real validator, a real screenshot, or a real audit log — never from a guess.

## Purpose

- Capture outputs from external validators (Lighthouse, Rich Results Test, Search Console, AI agents) that are too expensive or too volatile to re-run on demand.
- Make portfolio claims defensible: anyone reviewing the case study can trace a screenshot, score, or citation back to a specific run, a specific URL, and a specific date.
- Keep an audit trail of public-surface SEO and AI-visibility work without leaking PII, real users, or unverifiable claims.

## Anti-patterns (do NOT do this)

- **Do not invent scores.** A green checkmark, a "100/100", or a fake screenshot is a worse signal than no evidence at all.
- **Do not paste binary blobs you have not reviewed.** Every PNG, PDF, or HTML capture must be opened, scanned for PII, and confirmed truthful before commit. See `docs/portfolio/screenshots/README.md` for the PII/redaction checklist.
- **Do not commit Lighthouse CI artifacts as evidence.** The `lighthouserc.json` upload target is `temporary-public-storage` — those artifacts expire. The committed evidence must come from a manual run with a saved screenshot or copy/paste of the report.
- **Do not paraphrase a validator into a claim that the validator did not make.** If Schema.org flags a warning, the warning stays in the evidence — even if the page still validates.
- **Do not copy production data into evidence.** Use demo data, redacted real data, or screenshots that have been through the PII checklist.

## Authoritative references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — the validation checklist that defines which external validators we run and what counts as a real pass.
- `docs/ai-visibility-monthly-checklist.md` — the monthly cadence for AI-citation checks; the log below mirrors that table shape so the two stay aligned.

## Files in this folder

| File | What it captures | Status |
| --- | --- | --- |
| `lighthouse-seo-report-placeholder.md` | Real Lighthouse (or PageSpeed Insights) run for the canonical public URL — score, LCP, TBT, CLS, and notes. | Empty template |
| `rich-results-placeholder.md` | Rich Results Test / Schema.org validator output for the public JSON-LD. | Empty template |
| `ai-citation-log-placeholder.md` | Monthly AI citation check (Google AI Overviews, ChatGPT, Perplexity) — one row per query. | Empty template |
| `search-console-placeholder.md` | Google Search Console evidence that requires external account access (impressions, clicks, indexing). | Empty template |

## How to fill in a placeholder

1. Run the validator or check the real source. Do not fabricate.
2. Capture a screenshot or copy the raw report into the same commit. If the report is binary (HTML/JSON), store the raw file under a dated filename in this folder and link to it from the placeholder.
3. Fill in the placeholder table with **only** what the validator actually returned. Leave a cell blank rather than guess.
4. Add the run date, the URL tested, and any caveats in the `Notes` column.
5. If a row contradicts a public claim in `README.md` or a runbook, treat that as a follow-up issue, not as something to quietly overwrite.

## When a placeholder is still empty

Empty placeholders are intentional. They mark the **next honest thing to do** for portfolio readiness and prevent the folder from drifting into fake evidence. If a reviewer sees an empty table, the message is: "this run has not happened yet, do not treat the project as having this evidence."
