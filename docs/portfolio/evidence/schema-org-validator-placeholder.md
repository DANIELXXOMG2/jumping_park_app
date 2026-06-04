# Schema.org Validator evidence

This file captures Schema.org Validator evidence for the public JSON-LD. It is a **companion** to `rich-results-placeholder.md` — Rich Results Test checks Google-specific eligibility, while Schema.org validates universal structured data correctness.

## Automated JSON-LD extraction (same run as rich-results)

Run on 2026-06-04 against `https://www.jumpingpark.lat`:

```json
{
  "date": "2026-06-04T02:41:09.730Z",
  "url": "https://www.jumpingpark.lat",
  "types": [],
  "blocks": []
}
```

**Result**: No JSON-LD detected on the homepage.

## Manual Schema.org validation — pending

### Instructions

1. Open **Schema.org Validator**: https://validator.schema.org/
2. Enter the canonical URL: `https://www.jumpingpark.lat/consentimiento-digital`
3. Select the **"Fetch URL"** tab (validates the live page).
4. Record:
   - **Every `@type` detected** — list them fully, do not summarise.
   - **Warnings** — copy verbatim. A warning is a signal, not a decoration.
   - **Errors** — copy verbatim.
5. Fill in the table:

| Date | URL tested | Validator | Detected types | Warnings | Errors | Notes |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | https://www.jumpingpark.lat/consentimiento-digital | Schema.org Validator |  |  |  |  |

6. Take a **screenshot** and save as `YYYY-MM-DD-schema-org-validator.png`.
7. If the page has no structured data at all, the table row should say `(none)` under types and `—` under warnings/errors. That is honest evidence.

## What does NOT count

- A "validates without errors" claim without the underlying validator report.
- A run against a different URL than the canonical indexed page.
- Re-validating a stale local copy of the JSON-LD. Always validate the **live deployed page**.

## Cross-references

- `rich-results-placeholder.md` — Google-specific structured data eligibility (same folder).
- `docs/runbooks/seo-ai-seo-validation-checklist.md` — validator cadence and criteria.
