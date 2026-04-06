# Tasks: Rollout Flags and Observability Hardening

## Phase 1: PR1 - Policy Foundation

- [x] PR1.1 Create `src/lib/hardeningPolicy.ts` with typed flag constants, secure-default env parsing, and reusable hardening event/header builders.
- [x] PR1.2 Extend `tests/operational-hardening.test.ts` for explicit `true`, missing/malformed fallback, and deterministic `feature_name`/`status` telemetry assertions.
- [x] PR1.3 Document rollout flags and restart/redeploy semantics in `.env.example`, `README.md`, and `docs/runbooks/production-hardening.md`.
- Verification: `bun run check:types && bun test tests/operational-hardening.test.ts`
- Risk guard / rollback: keep defaults secure-on and headers additive only; if parsing or telemetry regresses, revert this PR with no feature behavior change.

## Phase 2: PR2 - OTP and Export Wiring

- [x] PR2.1 Modify `src/services/authService.ts`, `src/app/api/otp/route.ts`, and `src/app/api/otp/validate/route.ts` to resolve `OTP_HARDENING_ENABLED`, branch strict vs permissive OTP flow, and attach hardening headers without moving route logic client-side.
- [x] PR2.2 Modify `src/services/exportRangeService.ts`, `src/app/api/admin/export/users/route.ts`, and `src/app/api/admin/export/consents/route.ts` to resolve `EXPORT_BOUNDS_ENFORCED`, keep the existing 5000-row cap in fallback mode, and emit export hardening telemetry.
- [x] PR2.3 Extend `tests/auth-hardening.test.ts` and `tests/operational-hardening.test.ts` for OTP lockout on/off, export bounds reject/bypass behavior, and response-header observability.
- Verification: `bun run check:types && bun test tests/auth-hardening.test.ts tests/operational-hardening.test.ts`
- Risk guard / rollback: preserve current strict codepaths as the default branch and keep the fallback bounded by the current row cap; rollback is a clean revert or env flip back to `true`.

## Phase 3: PR3 - SEO Wiring

- [x] PR3.1 Modify `src/lib/seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, and `src/app/(public)/layout.tsx` to read `PUBLIC_SEO_ENABLED` from the shared policy and keep metadata generation server-side.
- [x] PR3.2 Extend `tests/seo-public.test.ts` for robots allow/disallow output, sitemap visibility, and `noindex,nofollow` vs indexable metadata scenarios.
- [x] PR3.3 Update `docs/runbooks/production-hardening.md` with SEO rollout smoke checks covering `robots.txt`, sitemap, and page metadata after deploy.
- Verification: `bun run check:types && bun test tests/seo-public.test.ts`
- Risk guard / rollback: ship SEO last so public crawling changes stay isolated; rollback is `PUBLIC_SEO_ENABLED=false` plus redeploy, or revert PR3 if metadata drift appears.
