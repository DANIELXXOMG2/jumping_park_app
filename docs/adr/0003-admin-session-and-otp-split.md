# ADR-0003: Use server-validated admin sessions and split OTP state by purpose

- **Status**: Accepted
- **Last reviewed**: 2026-05-16

## Decision

We keep two separate auth boundaries:

1. Admin access uses a server-validated `HttpOnly` session cookie issued by `/api/admin/session`.
2. Kiosk OTP uses separate persistence for request/lock state (`otp_challenges`) and validated access state (`otp_access_sessions`).

This avoids mixing browser trust, admin authorization, and OTP validation into one shared document model.

## Repository evidence

- `src/app/api/admin/session/route.ts` exchanges a Firebase ID token for a server-issued cookie and refreshes/clears that cookie on read/delete.
- `src/services/adminSessionService.ts` verifies the ID token, derives the admin role, builds the cookie payload, and refreshes it near expiry.
- `src/services/authService.ts` defines `OTP_CHALLENGES_COLLECTION` and `OTP_ACCESS_SESSIONS_COLLECTION`, preserves lock/attempt logic, and still contains the legacy fallback path while the split model remains compatibility-safe.

## Engram-backed context

- `#422` — `sdd/production-hardening-professionalization/design` chose a server-validated admin session cookie plus an OTP split between challenge state and post-validation access state to reduce corruption risk and move enforcement server-side.

## Consequences

- Admin auth work should preserve the cookie-first perimeter instead of drifting back to client-only enforcement.
- OTP changes must respect the distinction between “challenge/lockout state” and “validated access session” state.
- The repo still carries some legacy compatibility logic, so cleanups in this area need careful regression coverage.
