# SEO and AI-SEO validation checklist

This checklist combines three things that MUST coexist: real indexability, agent clarity, and a minimum manual accessibility validation for the public surface.

## Preconditions

- `PUBLIC_SEO_ENABLED=true`
- Fresh deployment of the environment to validate.
- Real environment URL available.

## Search engine checks

- `robots.txt` responds with `200` and does not expose admin or private kiosk routes.
- `sitemap.xml` lists canonical public URLs only.
- `/consentimiento-digital` exposes coherent `title`, `description`, canonical, and Open Graph metadata.
- The public page includes valid JSON-LD.
- When the flag is disabled, `robots.txt` falls back to `Disallow: /` and the public route becomes `noindex`.

## AI-SEO checks

- `/llms.txt` responds with `text/plain`.
- The file describes the product, lists public URLs, and makes it clear that admin/kiosk/API surfaces are private.
- The preferred canonical URL matches the sitemap.
- The public narrative is short, citable, and free of invented claims.
- Private routes are not published as if they were marketing surfaces.

## Public-page a11y smoke notes

The public surface is small, so the manual verification should be precise too:

- navigate with the keyboard from the entry point to the main CTA;
- verify a single `h1` and a logical heading hierarchy;
- test 200% zoom/browser text resize without critical horizontal clipping;
- validate visible contrast on the CTA and main text;
- confirm links have destinations that remain understandable out of context.

## Available automated coverage vs real gap

- Primitive-regression coverage: `tests/block-b-a11y-and-logging.test.tsx` validates modal semantics, keyboard support for interactive rows, and the expected focus wrap for dialogs.
- Reproducible browser coverage in the repo: `bun run test:a11y:e2e` (Playwright + Axe) over `/consentimiento-digital` and one critical kiosk surface.
- Current explicit gap: this coverage is E2E smoke, not a replacement for a full assistive-navigation matrix across the entire admin/kiosk surface.
- Next step when it enters scope: extend `playwright/accessibility.a11y.ts` with key admin routes and broader focus/zoom scenarios.

## Evidence pack

- capture of `robots.txt`
- capture of `sitemap.xml`
- view-source or other evidence of the JSON-LD
- capture or note for `llms.txt`
- short a11y smoke note: keyboard + zoom + headings

## Recommended external validators

- Google Rich Results Test
- Schema.org Validator
- PageSpeed Insights or Lighthouse SEO
- manual check in at least one agent with web access to confirm the canonical URL is easy to cite
