# Search Console evidence

This file captures Google Search Console evidence that requires **external account access**. It stays empty until a real Search Console export is captured. Do **not** invent impressions, clicks, or indexing state.

## Status: pending manual export

**This validation cannot be automated** without OAuth2 integration for the Search Console API. The project currently uses manual exports, which is sufficient for portfolio purposes.

## Step-by-step export instructions

### Prerequisites

- A Google account with **Owner** or **Full User** access to the Search Console property `https://www.jumpingpark.lat/`.
- The property must be verified (DNS TXT record, HTML file, or Google Analytics).

### Steps

1. **Open Search Console**: https://search.google.com/search-console
2. Select the property: `https://www.jumpingpark.lat/` (or `sc-domain:jumpingpark.lat` for domain-level).
3. **Performance report**:
   - Go to **Performance** → set date range to last 28 days.
   - Record: Total clicks, Total impressions, Average CTR, Average position.
   - Click **Export** → download as CSV.
4. **Indexing report**:
   - Go to **Pages** → see "Indexed" and "Not indexed" counts.
   - Click on "Not indexed" to review exclusion reasons.
   - Note any unexpected exclusions (e.g. `Excluded by 'noindex' tag`, `Crawled - currently not indexed`).
5. **Sitemap status** (if submitted):
   - Go to **Sitemaps** → check last read date and any errors.
6. **Manual actions & Security issues**:
   - Check both tabs under **Security & Manual Actions**. Should be empty.

### Fill in the evidence table

| Date range | Property | Impressions | Clicks | Avg. position | Indexed pages | Excluded pages | Notes |
|---|---|---|---|---|---|---|---|
| YYYY-MM-DD to YYYY-MM-DD | https://www.jumpingpark.lat/ |  |  |  |  |  |  |

### After filling

- Save the CSV export as `YYYY-MM-DD-search-console-performance.csv` in this folder.
- Take a screenshot of the **Pages → Indexing** panel and save as `YYYY-MM-DD-search-console-indexing.png`.
- In `Notes`, record:
  - The deploy commit SHA the report window covers.
  - Any manual actions or crawl anomalies.
  - Any follow-up issue opened for unexpected exclusions.

## What does NOT count

- Numbers from a third-party SEO tool (Ahrefs, SEMrush, etc.). Search Console is the source of truth.
- A row from a staging or dev property.
- A summary like "everything is indexed" without the underlying CSV or screenshot.

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — indexability checks.
- `docs/portfolio/evidence/README.md` — evidence anti-patterns.
