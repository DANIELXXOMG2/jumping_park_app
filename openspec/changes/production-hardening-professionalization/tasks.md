# Tasks: Production Hardening & Professionalization

## Phase 1: Security Baseline (PR-01)

- [x] 1.1 Admin session exchange; `src/app/api/admin/session/route.ts`, `src/lib/adminAuth.ts`; done when cookie-first auth supports `ADMIN_SESSION_MODE=dual`, idle timeout, and Bearer fallback; validate `bun run check:types`.
- [x] 1.2 Admin client/perimeter wiring; `src/contexts/AuthContext.tsx`, `src/components/admin/AdminGuard.tsx`, `src/proxy.ts`; done when `/admin/*` reads session status, redirects on expiry, and serves strict headers plus `X-Robots-Tag`; validate login/logout smoke + header check.
- [x] 1.3 OTP data split; `src/services/authService.ts`, `src/types/firestore.ts`; done when `otp_challenges` and `otp_access_sessions` replace mixed `otp_sessions` writes for new flows; validate typecheck + Firestore shape review.
- [x] 1.4 OTP throttling and lockout; `src/services/rateLimitService.ts`, `src/app/api/otp/route.ts`, `src/app/api/otp/validate/route.ts`; done when request and validate budgets fail closed with stable `429` contracts; validate OTP abuse smoke for 3-in-5 and 5 bad codes.

## Phase 2: Operational Stability (PR-02)

- [x] 2.1 Bounded exports; `src/app/api/admin/export/users/route.ts`, `src/app/api/admin/export/consents/route.ts`; done when unbounded or `>30d` exports are rejected/capped with response metadata; validate allowed vs rejected range requests.
- [x] 2.2 Short-lived consent links; `src/services/consentService.ts`, `src/app/api/admin/consents/[id]/pdf/route.ts`; done when signed URLs expire in `<=15m` and persistence keeps object paths instead of long-lived links; validate generated URL TTL config.
- [x] 2.3 Secure logs and operator baseline; `src/services/authService.ts`, `README.md`, `.env.example`, `.github/workflows/ci.yml`; done when PII is masked, env contract is complete, and CI/docs match Bun commands and runbooks; validate `bun run check`.

## Phase 3: Public Discoverability (PR-03)

- [x] 3.1 Public metadata boundary; `src/app/layout.tsx`, `src/app/(public)/**`; done when only public pages emit indexable metadata and JSON-LD while kiosk/admin stay `noindex`; validate page source on one public and one private route.
- [x] 3.2 SEO artifacts; `src/app/robots.ts`, `src/app/sitemap.ts`; done when robots and sitemap expose only public URLs and block operational paths; validate fetch of `/robots.txt` and `/sitemap.xml`.

## Phase 4: Verification & Rollout Notes

- [x] 4.1 Hardening smoke pack; `README.md`, `postman/` or `docs/runbooks/production-hardening.md`; done when admin session, OTP abuse, export bounds, and robots/sitemap checks are reproducible after each PR; validate replay of the checklist.

## PR Plan

- PR-01: 1.1-1.4. Cierra riesgo inmediato de auth, headers y OTP antes de tocar costos o SEO.
- PR-02: 2.1-2.3. Reduce costo operativo y deja documentación/CI alineados al runtime real.
- PR-03: 3.1-4.1. Abre discoverability pública recién después de asegurar perímetro y runbook de rollout.
