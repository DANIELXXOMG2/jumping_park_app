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

| File | What it captures | Automation | Status |
|---|---|---|---|
| `lighthouse-seo-report-placeholder.md` | PageSpeed Insights / Lighthouse scores (Performance, LCP, TBT, CLS, SEO) | Automated (`scripts/validate-pagespeed.ts`) | Pending — automated run rate-limited (needs `PSI_API_KEY`) |
| `rich-results-placeholder.md` | Google Rich Results Test + JSON-LD extraction | Mixed (automated extraction + manual validator) | Pending — manual Rich Results Test not yet run. Automated extraction found 0 JSON-LD types. |
| `schema-org-validator-placeholder.md` | Schema.org Validator output | Mixed (automated extraction + manual validator) | Pending — manual Schema.org validation not yet run. |
| `search-console-placeholder.md` | Google Search Console (impressions, clicks, indexing) | Manual (requires account access) | Pending — manual export not yet performed. Instructions included. |
| `ai-citation-log-placeholder.md` | Monthly AI citation check (Google, ChatGPT, Perplexity) | Manual (inherently manual — no citation APIs) | Pending — monthly check not yet run. 15-row template with queries included. |
| `public-crawl-report.md` | Automated crawl: robots.txt, sitemap.xml, llms.txt, pricing.md | Automated (`scripts/validate-public-crawl.ts`) | ✅ Live — 2026-06-04 run: 4/4 checks passed |
| `wcag-wig-report.md` | Playwright+Axe a11y audit + manual WCAG/WIG deep review | Mixed (automated Axe + manual review) | Partial — automated Axe run captured (2 passed, 2 violations). Manual deep review pending. |

## Running the automation scripts

### Individual scripts

```bash
# PageSpeed Insights (requires PSI_API_KEY for reliable results)
bun run scripts/validate-pagespeed.ts -- --url=https://www.jumpingpark.lat

# JSON-LD extraction
bun run scripts/extract-jsonld.ts -- --url=https://www.jumpingpark.lat

# Public crawl validation
bun run scripts/validate-public-crawl.ts -- --url=https://www.jumpingpark.lat
```

### Full pipeline

```bash
# Run all 3 scripts in sequence (defaults to production URL)
bun run validate:evidence

# Override URL
URL=https://staging.example.com bun run validate:evidence
```

### Accessibility (Playwright + Axe)

```bash
# Requires Firebase env vars for full page rendering
bun run test:a11y:e2e
```

## How to fill in a placeholder

1. **Check the Automation column above** — if "Automated," run the script first. If the script succeeds, paste its output. If it fails, record the failure honestly.
2. **For manual validations**: Follow the step-by-step instructions embedded in each file. Each manual file contains:
   - Exact URLs to test against
   - Validator URLs (Rich Results Test, Schema.org, Search Console)
   - A fillable table matching the validator's output shape
   - Screenshot naming conventions
3. Capture a screenshot or copy the raw report into the same commit. If the report is binary (HTML/JSON), store the raw file under a dated filename in this folder and link to it from the evidence file.
4. Fill in the table with **only** what the validator actually returned. Leave a cell blank rather than guess.
5. Add the run date, the URL tested, and any caveats in the `Notes` column.
6. If a row contradicts a public claim in `README.md` or a runbook, treat that as a follow-up issue, not as something to quietly overwrite.

## When a file says "pending"

"Pending" is intentional and honest. It means: **this validation has not been performed yet** — do not treat the project as having this evidence until the file is populated with real data. Empty template rows are better than fake scores.

### Current pending items (2026-06-04)

| Validation | What's blocking | How to unblock |
|---|---|---|
| Lighthouse/PSI | Rate-limited (429). Anonymous quota exhausted. | Set `PSI_API_KEY` env var and rerun `validate-pagespeed.ts`. |
| Rich Results Test | Manual browser run needed. | Open https://search.google.com/test/rich-results with canonical URL. |
| Schema.org Validator | Manual browser run needed. | Open https://validator.schema.org/ with canonical URL. |
| Search Console | Manual account access needed. | Follow export instructions in `search-console-placeholder.md`. |
| AI citations | Manual monthly check needed. | Follow query instructions in `ai-citation-log-placeholder.md`. |
| WCAG deep review | Manual inspection needed. | Follow the 45-check WCAG 2.1 AA matrix in `wcag-wig-report.md`. |
