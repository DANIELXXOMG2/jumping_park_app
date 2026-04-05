# Apply Progress

**Change**: `production-hardening-professionalization`
**Scope**: PR-03 phases 3.1, 3.2, and 4.1
**Mode**: Standard
**Date**: 2026-04-05

## Completed

- Moved admin and kiosk route-group layouts back to server boundaries so they can export explicit `noindex` metadata while preserving the existing client providers through shell components.
- Changed root metadata defaults to non-indexable operational-safe metadata and introduced a dedicated public surface at `/consentimiento-digital` with canonical metadata and JSON-LD.
- Added `src/app/robots.ts` and `src/app/sitemap.ts` so only public URLs are exposed to crawlers while operational paths remain blocked.
- Extended proxy coverage so kiosk root `/` also emits `X-Robots-Tag: noindex, nofollow`, and added tests covering the new SEO boundary.
- Added `docs/runbooks/production-hardening.md` with reproducible smoke checks for admin session, OTP abuse, export bounds, and robots/sitemap verification.

## Tasks

- Marked `3.1`, `3.2`, and `4.1` complete in `openspec/changes/production-hardening-professionalization/tasks.md`.

## Validation Evidence

- `bun run check:types` -> PASS
- `bun test` -> PASS (`16` tests, `0` failures)

## Risks

- `robots.txt` cannot reliably disallow only the exact root path `/`; kiosk root indexing is therefore enforced via page metadata and `X-Robots-Tag` instead of crawler rules.
- The current sitemap intentionally exposes only one public URL; future marketing pages must be added explicitly to `PUBLIC_PATHS` to become discoverable.
