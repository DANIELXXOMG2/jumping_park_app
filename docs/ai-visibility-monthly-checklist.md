# AI visibility monthly checklist

Run this once per month for the public marketing surface.

## Scope

- Check Google AI Overviews, ChatGPT, and Perplexity.
- Use at least 5 target queries tied to public discovery intent.
- Review the live public assets that agents cite today: `/llms.txt`, `/pricing.md`, `robots.txt`, `sitemap.xml`, and `/consentimiento-digital`.

## Preconditions

- `PUBLIC_SEO_ENABLED=true`
- fresh deploy on the environment being checked
- canonical public URL available

## Monthly steps

1. Pick at least 5 target queries. Recommended mix:
   - `jumping park consentimiento digital`
   - `parque de trampolines rosario consentimiento`
   - `jumping park precios`
   - `jumping park cumpleaños rosario`
   - `jumping park menores consentimiento`
2. Run each query in Google AI Overviews, ChatGPT, and Perplexity.
3. For every answer, capture:
   - whether Jumping Park is cited;
   - which URL is cited;
   - whether the answer stays truthful to `/llms.txt` and `/pricing.md`;
   - which competitor or third-party source appears instead.
4. Confirm `robots.txt` still allows the approved AI bots on public routes and still blocks private surfaces.
5. Confirm `sitemap.xml` and the canonical public URL still match the current deploy.
6. If the brand is missing or misrepresented, open a follow-up issue with the failed query, platform, cited source, and the public page that should be improved.

## Results log

| Month | Query | Platform | Jumping Park cited? | Cited URL | Competitor/source cited | Notes / follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM |  | Google AI Overviews | Yes / No |  |  |  |
| YYYY-MM |  | ChatGPT | Yes / No |  |  |  |
| YYYY-MM |  | Perplexity | Yes / No |  |  |  |

## Rollback by phase

| Phase | What changed | First rollback move | Verify after rollback |
| --- | --- | --- | --- |
| Phase 1 — image optimization | optimized public assets, shared image config, responsive `sizes` | revert the image-optimization slice if visual regressions or broken asset paths appear | `bun test tests/images.test.tsx` |
| Phase 2 — Lighthouse budgets | `lighthouserc.json`, Lighthouse workflow, CI-vs-production rationale | revert the Lighthouse budget slice if the thresholds or CI prep become untruthful | `bun test tests/lighthouse-ci-integration.test.ts` |
| Phase 3 — structured data | `LocalBusiness`/`BreadcrumbList` output in public JSON-LD | revert the structured-data slice if validation fails or the schema becomes misleading | `bun test tests/structured-data.test.ts tests/phase5-verification-hardening.test.ts` |
| Phase 4 — AI visibility surfaces | `/llms.txt` guidance, `/pricing.md`, AI bot allow rules | for emergency noindex use `PUBLIC_SEO_ENABLED=false`; for permanent rollback revert the AI-visibility slice | `bun test tests/ai-visibility.test.ts` plus `GET /robots.txt` |
| Phase 5 — monitoring and CI naming | descriptive Lighthouse check name and this runbook | revert the docs/workflow slice if naming or operating guidance is wrong | `bun test tests/monitoring-ci-quality.test.ts tests/lighthouse-ci-integration.test.ts` |

## Escalation rule

If two consecutive monthly runs show that Jumping Park is absent for the same priority query on two or more platforms, treat it as a backlog item for public-content improvement instead of silently accepting the drift.
