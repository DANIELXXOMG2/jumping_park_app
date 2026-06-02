# AI citation log evidence

This file is the **template** for the monthly AI citation check on the public marketing surface. It mirrors the table shape in `docs/ai-visibility-monthly-checklist.md` so the two stay aligned. It stays empty until a real monthly run is logged. Do not invent citations.

## What real evidence looks like

- One row per **query** (not per run). A month with five target queries produces five rows, one per platform.
- The **actual platform** that was tested (Google AI Overviews, ChatGPT, Perplexity) and the **URL the platform cited**, if any.
- A **screenshot or quoted snippet** of the model's answer, attached to the same commit. This is what makes the row auditable later.
- The **month** the check was run, in `YYYY-MM` form, to keep this log roll-up-friendly with the runbook.

## What does NOT count as evidence

- A "Jumping Park is now cited everywhere" summary without per-query rows.
- A cited URL that was not actually shown by the platform in that run. If a citation is in a "related links" sidebar, the row still says no citation for the **answer body** — be precise.
- A row from a query that is not in the runbook's recommended mix. If a new query is added, the runbook should be updated first; the evidence follows.

## Report template

| Month | Query | Platform | Cited? | Cited URL | Competitor or third-party cited | Notes / follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM |  | Google AI Overviews | Yes / No |  |  |  |
| YYYY-MM |  | ChatGPT | Yes / No |  |  |  |
| YYYY-MM |  | Perplexity | Yes / No |  |  |  |

## How to fill a row

1. Pick the query from the runbook's recommended mix, or add it to the runbook first if the query is new.
2. Run the query on the target platform with a clean session.
3. Record whether the **answer body** cites Jumping Park. Treat a sidebar or "related links" only as a separate observation, not as a body citation.
4. If cited, record the **exact URL** the platform surfaced. If a competitor or third party is cited instead, record that URL too.
5. In `Notes`, capture: any drift from `/llms.txt` or `/pricing.md`, the public page that should be improved, and the issue link if a follow-up was opened.
6. Attach the screenshot or quoted snippet to the same commit under a dated filename.

## Cross-references

- `docs/ai-visibility-monthly-checklist.md` — the runbook, the recommended query mix, and the escalation rule.
- `docs/runbooks/seo-ai-seo-validation-checklist.md` — the AI-SEO checks this log rolls up into.
