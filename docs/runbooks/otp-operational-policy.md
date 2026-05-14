# OTP Operational Policy

## Purpose

This runbook documents the OTP operational behavior currently enforced by the kiosk flow so operators can troubleshoot incidents without guessing.

## Policy Values

| Control | Current value | Source |
|---|---|---|
| OTP code validity | `OTP_EXPIRATION_MINUTES` env, default `60` | `src/lib/utils/otpConfig.ts`, `src/services/authService.ts`, `.env.example` |
| OTP request throttle | 3 requests per 5 minutes per document/email identifier | `src/app/api/otp/route.ts`, `src/services/authService.ts` |
| Additional IP multiplier | x3 of the identifier budget | `src/app/api/otp/route.ts`, `src/services/authService.ts` |
| OTP validation budget | 5 attempts per 5 minutes | `src/app/api/otp/validate/route.ts`, `src/services/authService.ts` |
| Failed-code lockout threshold | 5 incorrect code submissions | `src/services/authService.ts` |
| Lockout cooldown | `OTP_LOCKOUT_MINUTES` from env, default `15` | `src/services/authService.ts`, `.env.example` |
| Validated kiosk access session | `OTP_SESSION_DURATION_MINUTES` env, default `120` | `src/lib/utils/otpConfig.ts`, `src/services/authService.ts`, `.env.example` |
| Reuse behavior | If an OTP challenge is still active, the API returns `429` and does not issue a new code until the active challenge expires | `src/services/authService.ts`, `src/app/api/otp/route.ts` |

## Code Locations

- `src/app/api/otp/route.ts` defines the request throttle constants: `3` requests, `5` minute window, IP multiplier `3`.
- `src/app/api/otp/validate/route.ts` defines the validation budget constants: `5` attempts, `5` minute window.
- `src/lib/utils/otpConfig.ts` resolves OTP expiration and validated session duration from env on each backend read.
- `src/services/authService.ts` uses the helper for OTP expiration/session duration, still enforces the failed-code lockout threshold (`5`), and still reads `OTP_LOCKOUT_MINUTES` separately.
- `.env.example` documents `OTP_EXPIRATION_MINUTES=60`, `OTP_SESSION_DURATION_MINUTES=120`, and `OTP_LOCKOUT_MINUTES=15` as the runtime contract.

## Operator Checklist

### `429` when requesting `/api/otp`

1. Confirm whether the response includes `code: 'OTP_RATE_LIMITED'`.
2. Check `retryAfter` / `Retry-After` in the response.
3. If `otpAlreadySent: true`, an active OTP already exists and the system will keep rejecting new sends until that OTP expires.
4. If the error mentions too many requests from the same location, the IP budget was exhausted.

### `429` with lockout during `/api/otp/validate`

1. Confirm whether the response includes `code: 'OTP_LOCKED'`.
2. Read `retryAfter` / `Retry-After` and wait for the cooldown before retrying validation.
3. If the cooldown expires but the same OTP challenge is still within its configured lifetime (`OTP_EXPIRATION_MINUTES`, default `60`), requesting a new OTP still returns `429` until the challenge expires.

### Expired or invalid code

1. `404` with `Codigo expirado` means the stored challenge is no longer valid and a fresh OTP is required.
2. `404` with `Codigo incorrecto` increments the failed-code counter.
3. `429` with `Demasiados intentos de validacion.` means the 5-in-5-minute validation budget was exhausted even before another code check is allowed.

## Operational Notes

- OTP request throttling and OTP validation throttling are separate budgets.
- `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES` accept positive integers only; blank, non-numeric, decimal, zero, or negative values safely fall back to `60` / `120`.
- The lockout cooldown is capped by the OTP expiration timestamp, because the lock is stored on the same active challenge.
- Successful validation creates a kiosk access session valid for `OTP_SESSION_DURATION_MINUTES` minutes (default `120`).
- Browser kiosk persistence timing remains separate client-side behavior and is not changed by these backend env values.
