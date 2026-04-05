# Design: Production Hardening & Professionalization

## Technical Approach

Implement in three deployable batches: (1) security baseline, (2) operational stability, (3) public discoverability. The design keeps the current Next.js/Firebase stack, follows existing App Router + service-layer patterns, and adds backward-compatible auth and API guards before tightening defaults.

## Architecture Decisions

| Decision | Options | Choice / Rationale |
|---|---|---|
| Admin auth model | Client-only Firebase guard; Firebase session cookie; custom JWT cookie | Use a server-validated `HttpOnly` admin session cookie, issued from a new session exchange endpoint after Firebase login. Keep Firebase custom claims as role source of truth, but move route/API enforcement server-side. This removes the current `AdminGuard`/Bearer-token dependence while allowing idle timeout rotation. |
| OTP persistence | Keep mixed `otp_sessions`; add counters only; split collections | Split challenge state from validated access state: `otp_challenges` for request/attempt/lock metadata and `otp_access_sessions` for post-validation authorization. The current `otp_sessions` overloads email IDs and user IDs with different shapes; splitting reduces corruption risk and makes lockout/TTL explicit. |
| Rollout safety | Big-bang hardening; dual mode with flags | Use dual mode with env flags: `ADMIN_SESSION_MODE=dual|cookie`, `OTP_HARDENING_ENABLED`, `EXPORT_BOUNDS_ENFORCED`, `PUBLIC_SEO_ENABLED`. This supports canary rollout and one-PR rollback. |

## Data Flow

```text
Admin login page -> Firebase client sign-in -> POST /api/admin/session
-> verify ID token + claims -> set HttpOnly cookie -> proxy/API validate cookie

Kiosk OTP request -> /api/otp -> otp_challenges + rate_limits
Kiosk OTP validate -> /api/otp/validate -> increment attempts / lock if needed
-> create otp_access_sessions -> protected consent endpoints verify session
```

`src/proxy.ts` becomes the perimeter layer: security headers for all responses, `X-Robots-Tag: noindex, nofollow` for `/admin` and kiosk routes, and early admin redirect when no valid session cookie exists.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/adminAuth.ts` | Modify | Accept cookie-first auth, keep temporary Bearer fallback, centralize idle timeout and role extraction. |
| `src/app/api/admin/session/route.ts` | Create | Session exchange/read/delete endpoints for admin cookie lifecycle. |
| `src/contexts/AuthContext.tsx` | Modify | Stop exposing raw token as primary auth transport; consume session status endpoint. |
| `src/components/admin/AdminGuard.tsx` | Modify | Reduce to UX gate; no authorization source of truth, remove offline role cache reliance. |
| `src/proxy.ts` | Modify | Strong headers, noindex headers, admin cookie gate, safer matcher. |
| `src/services/authService.ts` | Modify | Sanitize logs, track attempts/lock state, move OTP records to dedicated challenge/session models. |
| `src/app/api/otp/route.ts` | Modify | Enforce fail-closed/degraded rate limiting and stable 429 contract. |
| `src/app/api/otp/validate/route.ts` | Modify | Add attempt budget, lockout, and explicit session-locked response. |
| `src/services/rateLimitService.ts` | Modify | Return deterministic failure mode, optional fallback bucket, no silent fail-open. |
| `src/app/api/admin/export/users/route.ts` | Modify | Require bounded date filters/pagination cap; reject wide exports. |
| `src/app/api/admin/export/consents/route.ts` | Modify | Enforce max 30-day range and response metadata for partial exports. |
| `src/services/consentService.ts` | Modify | Replace year-2500 signed URLs with <=15 min TTL and store object path, not long-lived access. |
| `src/app/layout.tsx` | Modify | Default metadata only for public pages; remove global `index: true` assumption. |
| `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/(public)/*` | Create | Public SEO surface with JSON-LD and explicit inclusion rules. |
| `README.md`, `.env.example`, `.github/workflows/ci.yml` | Modify/Create | Align docs, env contract, and CI with real runtime. |

## Interfaces / Contracts

```ts
POST /api/admin/session  { idToken: string }
200 { session: { role: UserRole; expiresAt: string } }

POST /api/otp           existing body preserved
429 { error: string; retryAfter: number; code: 'OTP_RATE_LIMITED' }

POST /api/otp/validate  existing body preserved
404 { success: false; error: 'Codigo incorrecto' }
429 { success: false; error: 'Session locked'; retryAfter: number; code: 'OTP_LOCKED' }
```

Backward compatibility: existing admin API handlers continue accepting `Authorization: Bearer` while `ADMIN_SESSION_MODE=dual`; kiosk request payloads stay unchanged; new response fields are additive.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | OTP counters, lockout math, cookie validation, URL TTL builder, robots rules | Service/helper tests with fixed clocks. |
| Integration | `/api/admin/session`, `/api/otp`, `/api/otp/validate`, export bounds, proxy header behavior | Route tests with mocked Firebase Admin/Firestore. |
| E2E | Admin login/logout/expiry, kiosk OTP retry/lock, public robots+sitemap | Playwright happy path + abuse path coverage. |

## Migration / Rollout

No destructive schema migration. Add new collections (`otp_challenges`, `otp_access_sessions`, optional `admin_sessions`) and stop writing new mixed `otp_sessions` records once dual mode is healthy. Rollout: batch 1 enables dual auth + OTP hardening, batch 2 enables export bounds and short-lived URLs, batch 3 flips public SEO. Rollback is per flag or by reverting the batch PR; Bearer fallback remains available until cookie mode is proven.

## Open Questions

- [ ] Whether admin idle timeout should be 30 or 60 minutes before forced re-login.
- [ ] Whether exports over 30 days should be rejected outright or moved to async job generation in a later change.
