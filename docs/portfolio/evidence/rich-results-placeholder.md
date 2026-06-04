# Rich Results / Schema.org validator evidence

This file captures evidence from Google's Rich Results Test and Schema.org Validator against the public JSON-LD. All data must come from **real validator runs** or be honestly marked "pending."

## Automated JSON-LD extraction

Run on 2026-06-04 against `https://www.jumpingpark.lat`:

```json
{
  "date": "2026-06-04T02:41:09.730Z",
  "url": "https://www.jumpingpark.lat",
  "types": [],
  "blocks": []
}
```

**Result**: No `<script type="application/ld+json">` blocks detected on the homepage. The homepage currently has **zero structured data markup**.

> **Note**: The sitemap (2026-06-04) lists only one URL: `/consentimiento-digital`. Structured data may exist on that page but was not detected on the root. Re-run the extraction against the actual indexed page:

```bash
bun run scripts/extract-jsonld.ts -- --url=https://www.jumpingpark.lat/consentimiento-digital
```

## Manual Rich Results Test — pending

This validation requires a **manual browser run** against the live page. The automated extraction above detected no JSON-LD, but a real validator may surface markup injected by client-side rendering.

### Instructions

1. Open **Google Rich Results Test**: https://search.google.com/test/rich-results
2. Enter the canonical URL: `https://www.jumpingpark.lat/consentimiento-digital`
3. Record every detected structured data type (e.g. `LocalBusiness`, `Organization`, `BreadcrumbList`).
4. Record **all warnings and errors exactly as shown** — do not filter or paraphrase.
5. Fill in the table below:

| Date | URL tested | Validator | Detected types | Warnings | Errors | Notes |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | https://www.jumpingpark.lat/consentimiento-digital | Rich Results Test |  |  |  |  |

6. Take a **screenshot** of the result panel and save as `YYYY-MM-DD-rich-results.png` in this folder.

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — validation cadence and pass criteria.
- `docs/portfolio/evidence/README.md` — anti-patterns for committed evidence.
