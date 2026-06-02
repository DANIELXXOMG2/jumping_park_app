# Rich Results / Schema.org validator evidence

This file is the **template** for evidence from Google's Rich Results Test and the Schema.org Validator against the public JSON-LD. It stays empty until a real validation run is captured. Do not paste a "passing" badge that was not produced by the validator.

## What real evidence looks like

- The **public URL** of the page that was tested (canonical, not a preview or staging URL).
- The **raw output** from the Rich Results Test (detected structured data items, any warnings, any errors) and from the Schema.org Validator.
- A **screenshot or copy/paste** of the validator result panel, attached to the same commit.
- The **deploy commit SHA** that was live at the time of the run, so the result is reproducible.

## What does NOT count as evidence

- A "no errors detected" claim without the underlying report. Schema.org and Rich Results can both show partial coverage with hidden warnings.
- A run against a non-canonical URL (preview, staging, dev). Public discoverability is judged on the canonical URL only.
- Re-running a stale local copy of the JSON-LD. Always re-validate the live page after a deploy.

## Report template

| Date | URL tested | Validator | Detected types | Warnings | Errors | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | https://www.example.com/consentimiento-digital | Rich Results Test |  |  |  |  |
| YYYY-MM-DD | https://www.example.com/consentimiento-digital | Schema.org Validator |  |  |  |  |

## How to fill a row

1. Open the validator with the canonical public URL.
2. Record **every detected type** the validator surfaces (for example `LocalBusiness`, `BreadcrumbList`, `Organization`). Do not summarise — list them so a reviewer can confirm coverage.
3. Record warnings and errors **as written by the validator**, even if the page still validates overall. A warning is a signal, not a decoration.
4. In `Notes`, capture: deploy commit SHA, whether the run matched the public narrative, and any follow-up needed.
5. Attach the raw validator output (HTML or JSON) to the same commit under a dated filename.

## Cross-references

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — what the project commits to validating on the public surface.
- `docs/portfolio/evidence/README.md` — anti-patterns for committed evidence (no invented pass/fail).
