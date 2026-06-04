# Public crawl report

Automated validation of public-facing SEO and infrastructure assets. Run via `bun run scripts/validate-public-crawl.ts -- --url=<URL>`.

## Latest automated run

**Date**: 2026-06-04T02:41:11.191Z
**URL**: https://www.jumpingpark.lat

### JSON output

```json
{
  "date": "2026-06-04T02:41:11.191Z",
  "baseUrl": "https://www.jumpingpark.lat",
  "checks": {
    "robotsTxt": {
      "status": 200,
      "adminBlocked": true,
      "pass": true
    },
    "sitemap": {
      "status": 200,
      "urlCount": 1,
      "pass": true
    },
    "llmsTxt": {
      "status": 200,
      "hasContent": true,
      "pass": true
    },
    "pricingMd": {
      "status": 200,
      "hasContent": true,
      "pass": true
    }
  }
}
```

### Results table

| Asset | Status | Details | Pass |
|---|---|---|---|
| robots.txt | 200 | admin blocked: yes | ✅ |
| sitemap.xml | 200 | 1 URL | ✅ |
| llms.txt | 200 | has content: yes | ✅ |
| pricing.md | 200 | has content: yes | ✅ |

**Overall**: 4/4 checks passed.

### Details

- **robots.txt**: Returns 200 with `Disallow: /admin/` — admin area correctly blocked from crawlers.
- **sitemap.xml**: Valid XML with 1 URL (`/consentimiento-digital`). Low URL count is expected for a single-page application with limited indexed routes.
- **llms.txt**: Returns 200 with content — AI crawlers can discover the site's structured context.
- **pricing.md**: Returns 200 with content — LLM-friendly pricing information is publicly accessible.

## How to re-run

```bash
# Against production
bun run scripts/validate-public-crawl.ts -- --url=https://www.jumpingpark.lat

# Against local dev server
bun run scripts/validate-public-crawl.ts -- --url=http://localhost:3000

# As part of the full evidence pipeline
bun run validate:evidence
```

## Cross-references

- `scripts/validate-public-crawl.ts` — the automation script.
- `docs/portfolio/evidence/README.md` — evidence folder overview.
