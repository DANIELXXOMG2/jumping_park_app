# Search Console evidence

This file is the **template** for Google Search Console evidence that requires external account access. It stays empty until a real Search Console export is captured. Do not invent impressions, clicks, or indexing state.

## What real evidence looks like

- A **date range** that matches a real Search Console query (default is the last 28 days, or the current month).
- The **URL or property** the export came from, so the row can be matched to the canonical public surface.
- The **raw numbers** as Search Console reports them — impressions, clicks, average position, and indexing status. Do not invert or round.
- A **screenshot of the Search Console panel** or a CSV/Excel export, attached to the same commit. The export is what makes the row auditable later.

## What does NOT count as evidence

- A summary like "everything is indexed" without the underlying report. Indexing exceptions are the most important signal in Search Console; they are easy to miss and easy to fake.
- Numbers copied from a third-party SEO tool. The project commits to **Search Console as the source of truth** for indexing and click data.
- A row from a property that is not the canonical public property (for example a staging or dev property).

## Report template

| Date range | Property | Impressions | Clicks | Avg. position | Indexed pages | Excluded pages | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD to YYYY-MM-DD | https://www.example.com/ |  |  |  |  |  |  |

## How to fill a row

1. Open Search Console for the canonical public property.
2. Run the Performance report for the chosen date range. Use the default **Web** search type unless the runbook says otherwise.
3. Run the **Pages > Indexing** report and record both indexed and excluded counts. Excluded pages are not a failure by themselves — note any unexpected exclusions in the `Notes` column.
4. Record the raw totals as Search Console reports them. Do not normalise to per-day averages.
5. In `Notes`, capture: any manual actions, any crawl anomalies, the deploy commit SHA the report window covers, and any follow-up issue opened.
6. Attach the screenshot or CSV export to the same commit under a dated filename.

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — the indexability checks this evidence rolls up into.
- `docs/portfolio/evidence/README.md` — anti-patterns for committed evidence (no fake green checks).
