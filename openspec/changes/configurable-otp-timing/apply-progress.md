# Apply Progress: configurable-otp-timing

## Batch Scope

- Add backend env-backed OTP expiration and validated session duration handling.
- Preserve safe defaults (`60` / `120`) for missing or invalid env values.
- Keep browser kiosk persistence timing and lockout policy scope unchanged.
- Update operator/developer env contract docs and capture strict-TDD evidence.

## Cumulative Status

- [x] 1.1 Added `tests/otp-timing-config.test.ts` for defaults, valid integers, blank, non-numeric, decimal, zero, and negative inputs.
- [x] 1.2 Extended `tests/auth-hardening.test.ts` with helper-backed OTP expiration/session duration behavior checks.
- [x] 1.3 Captured RED validation before implementation.
- [x] 2.1 Created `src/lib/utils/otpConfig.ts` with trimmed positive-integer parsing and `60` / `120` fallbacks.
- [x] 2.2 Kept the helper server-only with direct import because the current utils barrel does not need this backend-only contract.
- [x] 2.3 Proved per-test `process.env` runtime reads through targeted helper tests.
- [x] 3.1 Wired `saveOtp()` to `getOtpTimingConfig().otpExpirationMinutes`.
- [x] 3.2 Wired `createOtpSession()` to `getOtpTimingConfig().sessionDurationMinutes` without changing lockout or client persistence behavior.
- [x] 3.3 Proved default/custom service timing behavior through targeted auth hardening tests.
- [x] 4.1 Documented the new envs in `.env.example` with restart/redeploy guidance.
- [x] 4.2 Updated `CLAUDE.md` and `docs/runbooks/otp-operational-policy.md` to separate OTP expiration/session duration from lockout and browser persistence.
- [x] 4.3 Confirmed docs consistently state positive-integer-only inputs and safe fallbacks.
- [x] 5.1 Ran targeted Bun tests plus `bun run check:types`.
- [x] 5.2 Confirmed spec coverage for default/custom backend timing while leaving lockout and browser persistence scope unchanged.

## Completed in This Batch

- Added a direct `saveOtp()` behavioral test for the default/fallback OTP expiration path so verify no longer has to infer that scenario indirectly from the helper-only suite.
- Added a small server-only OTP timing helper that resolves env values at call time so tests can mutate `process.env` without module cache tricks.
- Replaced hardcoded `60`/`120` backend timing in `authService.ts` with helper-backed values for OTP challenge creation and validated access session creation.
- Added focused tests for parsing/fallback logic and auth-service consumption behavior, including RED proof before implementation.
- Updated the local/runtime env contract plus the OTP operational runbook and repo guidance docs.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Verify warning follow-up | `tests/auth-hardening.test.ts` | Unit | ✅ `bun test tests/auth-hardening.test.ts` → 9 pass, 0 fail | ⚠️ Added the missing direct `saveOtp()` default/invalid-path assertions first, but the existing implementation was already green, so this follow-up behaved as approval-style coverage instead of a failing RED | ✅ `bun test tests/auth-hardening.test.ts tests/otp-timing-config.test.ts` → 14 pass, 0 fail | ✅ Covered both missing and invalid `OTP_EXPIRATION_MINUTES` inputs through the service-level `saveOtp()` path | ➖ No production refactor needed; scope stayed test-only |
| 1.1 / 2.1 / 2.3 | `tests/otp-timing-config.test.ts` | Unit | N/A (new test file) | ✅ Wrote failing helper-import/config expectations first; initial run failed because `@/lib/utils/otpConfig` did not exist | ✅ `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` → helper suite green after implementation | ✅ Covered missing, valid, blank, non-numeric, decimal, zero, and negative cases | ✅ Kept parsing in one pure helper with trimmed positive-integer validation |
| 1.2 / 3.1 / 3.2 / 3.3 | `tests/auth-hardening.test.ts` | Unit | ✅ `bun test tests/auth-hardening.test.ts` → 7 pass, 0 fail | ✅ Added failing expiration/session duration expectations first; RED showed 3 fails + 1 missing-module error because backend still used hardcoded values and helper was absent | ✅ `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` → 13 pass, 0 fail | ✅ Proved both default (`120`) and custom (`30` / `240`) timing paths plus helper fallback coverage from the dedicated config suite | ✅ Chose direct server-only helper import instead of widening the shared utils barrel |
| 4.1 / 4.2 / 4.3 | `.env.example`, `CLAUDE.md`, `docs/runbooks/otp-operational-policy.md` | Structural docs/config | N/A | ✅ Not applicable — documentation contract update only | ✅ Env/docs updated to match implemented backend behavior | ➖ Skipped: single documentation contract surface per artifact | ✅ Kept wording explicit about positive integers, safe fallbacks, restart/redeploy, and out-of-scope browser persistence |
| 5.1 / 5.2 | `tests/otp-timing-config.test.ts`, `tests/auth-hardening.test.ts` | Unit + type-check | ✅ Prior targeted safety net preserved | ✅ Validation commands captured after RED | ✅ Final validation passed (`13` tests + `check:types`) | ✅ Combined config parsing and auth consumption cases to cover all spec scenarios in-scope | ➖ None needed |

## Test Summary

- **Total new tests written**: 6 (`tests/otp-timing-config.test.ts`)
- **Existing tests updated**: 3 (`tests/auth-hardening.test.ts`)
- **Latest targeted validation**: `bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts` → 14 pass, 0 fail
- **Layers used**: Unit
- **Approval tests**: None — behavior change was specified, so RED/ GREEN coverage drove the change directly
- **Pure functions created**: 2 (`resolvePositiveIntegerMinutes`, `getOtpTimingConfig`)

## Validation

```text
Safety net:
bun test tests/auth-hardening.test.ts
→ 7 pass, 0 fail

RED confirmation:
bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts
→ 7 pass, 3 fail, 1 error
  - missing module `@/lib/utils/otpConfig`
  - OTP challenge expiration still used 60 instead of configured 30
  - OTP session duration still used 120/ hardcoded behavior instead of configured 240 coverage

GREEN / final targeted validation:
bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts
→ 13 pass, 0 fail

Warning-closure follow-up:
bun test tests/auth-hardening.test.ts
→ 10 pass, 0 fail

bun test tests/otp-timing-config.test.ts tests/auth-hardening.test.ts
→ 14 pass, 0 fail

Type safety:
bun run check:types
→ passed
```

## Files Changed

- `src/lib/utils/otpConfig.ts` — added server-only OTP timing parser and defaults.
- `src/services/authService.ts` — replaced hardcoded backend OTP timing with helper-backed values.
- `tests/otp-timing-config.test.ts` — added focused parsing/fallback coverage.
- `tests/auth-hardening.test.ts` — added targeted service timing behavior proof, including direct `saveOtp()` default/fallback expiration coverage for missing and invalid env values.
- `.env.example` — documented the new env contract and restart/redeploy semantics.
- `CLAUDE.md` — updated env guidance and OTP timing behavior notes.
- `docs/runbooks/otp-operational-policy.md` — documented env-backed timing policy and out-of-scope browser persistence.
- `openspec/changes/configurable-otp-timing/tasks.md` — marked all tasks complete.

## Remaining Work

- None within the `configurable-otp-timing` change scope.
