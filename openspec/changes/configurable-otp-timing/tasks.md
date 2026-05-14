# Tasks: Configurable OTP Timing

## Phase 1: Foundation / RED

- [x] 1.1 Create `tests/otp-timing-config.test.ts` for `getOtpTimingConfig()` defaults, valid integers, and fallback on blank, non-numeric, decimal, zero, and negative env values.
- [x] 1.2 Extend `tests/auth-hardening.test.ts` to fail first on helper-backed OTP expiry/session duration consumption in `saveOtp()` and `createOtpSession()`.
- [x] 1.3 Verification: `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` shows the new expectations failing before implementation.

## Phase 2: Config Helper / GREEN

- [x] 2.1 Create `src/lib/utils/otpConfig.ts` with `OtpTimingConfig`, defaults `60`/`120`, trimmed env parsing, and positive-integer-only fallback logic.
- [x] 2.2 Export the helper through `src/lib/utils/index.ts` only if the project’s current barrel rules require it; otherwise keep the helper server-only and directly imported.
- [x] 2.3 Verification: `bun test tests/otp-timing-config.test.ts` passes and proves runtime reads work with per-test `process.env` mutation.

## Phase 3: Service Wiring

- [x] 3.1 Modify `src/services/authService.ts` so OTP challenge creation resolves `OTP_EXPIRATION_MINUTES` via `getOtpTimingConfig()` instead of hardcoded `60`.
- [x] 3.2 Modify `src/services/authService.ts` so validated kiosk access session creation resolves `OTP_SESSION_DURATION_MINUTES` instead of hardcoded `120`, without changing lockout or browser kiosk persistence behavior.
- [x] 3.3 Verification: `bun test tests/auth-hardening.test.ts` covers default 60/120-minute behavior plus custom 30/240-minute scenarios from the spec.

## Phase 4: Env Contract and Operator Docs

- [x] 4.1 Update `.env.example` to document `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES`, their defaults, and restart/redeploy semantics beside existing runtime policy flags.
- [x] 4.2 Update `CLAUDE.md` and `docs/runbooks/otp-operational-policy.md` so OTP expiry/session duration are described as env-configurable while `OTP_LOCKOUT_MINUTES` and browser kiosk persistence stay separate.
- [x] 4.3 Verification: docs and env contract consistently state accepted values are positive integers, invalid values fall back to `60`/`120`, and no schema or API payload changes are introduced.

## Phase 5: Final Validation

- [x] 5.1 Run `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` and `bun run check:types`.
- [x] 5.2 Confirm spec coverage: default/custom OTP expiration, default/custom validated session duration, unchanged lockout policy, and unchanged client-side kiosk persistence scope.
