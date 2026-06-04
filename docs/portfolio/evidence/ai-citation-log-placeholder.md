# AI citation log evidence

This file is the **monthly AI citation check** log for the public marketing surface. It mirrors the table shape in `docs/ai-visibility-monthly-checklist.md`. It stays empty until a real monthly run is logged. Do **not** invent citations.

## Status: pending manual monthly check

This validation is inherently **manual** — AI platforms do not expose citation APIs, and their answers change with model updates. A monthly cadence with clean-session queries is the honest approach.

## Monthly check instructions

### Platforms to check

| Platform | How to test | Notes |
|---|---|---|
| **Google AI Overviews** | Search each query in Google (US results, incognito/clean session). Look for the AI-generated summary box at the top. | Google may not surface AI Overviews for all queries or regions. Note if it did not appear at all. |
| **ChatGPT** | Use ChatGPT (free tier web, clean session). Ask each query. If using Search mode, enable it. | Record whether ChatGPT **cited** Jumping Park in the answer body, not just in a sidebar. |
| **Perplexity** | Use perplexity.ai (free tier, clean session, "Web" focus). Ask each query. | Perplexity always cites sources. Record whether Jumping Park appears among them and in what position. |

### Recommended query mix

Use these queries (from `docs/ai-visibility-monthly-checklist.md`). If you add a new query, update the runbook first.

| # | Query (Spanish) | Query (English) | Target page |
|---|---|---|---|
| 1 | consentimiento digital para parques de trampolines | digital consent for trampoline parks | `/consentimiento-digital` |
| 2 | software gestión parques infantiles Colombia | kids park management software Colombia | `/` |
| 3 | cómo gestionar consentimientos informados saltarines | how to manage informed consent trampoline parks | `/consentimiento-digital` |
| 4 | precio software parque de saltos | trampoline park software pricing | `/pricing.md` |
| 5 | cumplimiento legal parques infantiles digital | legal compliance digital kids parks | `/consentimiento-digital` |

### Per-check steps

1. **Pick the month** — use `YYYY-MM` format.
2. **Run each query on each platform** with a clean session (incognito/private window).
3. **Record only answer-body citations** — sidebar or "related links" are separate observations, not body citations.
4. **If cited**: record the exact URL the platform surfaced.
5. **If a competitor is cited instead**: record their URL in the `Competitor or third-party cited` column.
6. **Take a screenshot** of the answer and save as `YYYY-MM-platform-query-N.png`.

### Fill in the table

| Month | Query | Platform | Cited? | Cited URL | Competitor or third-party cited | Notes / follow-up |
|---|---|---|---|---|---|---|
| YYYY-MM | consentimiento digital para parques de trampolines | Google AI Overviews | Yes / No |  |  |  |
| YYYY-MM | consentimiento digital para parques de trampolines | ChatGPT | Yes / No |  |  |  |
| YYYY-MM | consentimiento digital para parques de trampolines | Perplexity | Yes / No |  |  |  |
| YYYY-MM | software gestión parques infantiles Colombia | Google AI Overviews | Yes / No |  |  |  |
| … | … | … | … | … | … | … |

*Repeat for all 5 queries × 3 platforms = 15 rows per month.*

### After filling

- Commit all screenshots with the evidence rows.
- If a page is never cited after 3 months, open an issue to improve `llms.txt`, `pricing.md`, or the page content.

## What does NOT count

- "Jumping Park is cited everywhere" without per-query rows.
- A cited URL that was not actually shown by the platform in that run.
- A row from a query not in the runbook (update the runbook first).

## Cross-references

- `docs/ai-visibility-monthly-checklist.md` — the runbook (query mix, escalation rule).
- `docs/runbooks/seo-ai-seo-validation-checklist.md` — AI-SEO checks this log rolls up into.
