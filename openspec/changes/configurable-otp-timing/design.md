# Design: Configurable OTP Timing

## Technical Approach

Introduce a small server-only config helper that resolves OTP timing from env at read time, validates positive integer minutes, and falls back to current behavior (`60` for OTP expiration, `120` for validated session duration). `src/services/authService.ts` will consume this helper instead of hardcoded constants, while lockout timing and browser kiosk persistence remain unchanged.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| OTP timing resolution location | Inline parsing in `authService.ts`; helper module | Helper module in `src/lib/utils/otpConfig.ts` | Keeps business logic focused, matches the repo’s separation habits, and makes parsing testable without Firestore/email dependencies. |
| Invalid env handling | Throw on boot; allow `NaN`; fallback to defaults | Fallback to defaults for missing, non-numeric, zero, or negative values | Preserves today’s behavior safely and avoids broken expiry timestamps in runtime environments. |
| Config read strategy | Parse once at module load; resolve through function | Resolve through exported helper function | Easier deterministic tests when mutating `process.env`, without needing process restarts or module cache tricks. |

## Data Flow

Sequence:

`process.env` → `getOtpTimingConfig()` → `authService.saveOtp()` / `authService.createOtpSession()` → Firestore expiry timestamps

Flow details:

1. `saveOtp()` asks the helper for `otpExpirationMinutes`.
2. The helper parses raw env strings, trims input, validates integer `> 0`, otherwise returns defaults.
3. `saveOtp()` computes `expiresAt` using the resolved value.
4. `createOtpSession()` repeats the same helper call for `sessionDurationMinutes`.
5. Existing validation, lockout, and session verification logic continue using stored timestamps; no schema change is required.

## File Changes

| File | Action | Description |
|---|---|---|
| `openspec/changes/configurable-otp-timing/design.md` | Create | Technical design artifact for this change. |
| `src/lib/utils/otpConfig.ts` | Create | Central OTP timing parser, defaults, and env contract. |
| `src/services/authService.ts` | Modify | Replace hardcoded `60`/`120` with helper-backed values in OTP creation and session creation. |
| `tests/otp-timing-config.test.ts` | Create | Unit coverage for valid values and fallback behavior. |
| `.env.example` | Modify | Document `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES`. |
| `CLAUDE.md` | Modify | Update operator/developer env guidance and OTP timing notes. |
| `docs/runbooks/otp-operational-policy.md` | Modify | Change policy source from hardcoded values to env-backed defaults. |

## Interfaces / Contracts

```ts
export interface OtpTimingConfig {
	otpExpirationMinutes: number
	sessionDurationMinutes: number
}

export function getOtpTimingConfig(): OtpTimingConfig
```

Helper contract:
- `OTP_EXPIRATION_MINUTES` default: `60`
- `OTP_SESSION_DURATION_MINUTES` default: `120`
- Accepted values: positive integers only
- Rejected values: missing, blank, decimals, non-numeric, `0`, negatives

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Env parsing and defaults | `bun test` cases covering unset, blank, invalid, zero, negative, decimal, and valid integer inputs in `tests/otp-timing-config.test.ts`. |
| Unit | Auth service consumption | Assert `saveOtp()` and `createOtpSession()` derive timestamps from helper-backed config, either by focused tests or by extending existing auth tests with deterministic env setup. |
| Integration | N/A | No new integration harness is required because persisted shape and route contracts do not change. |
| E2E | N/A | No UI flow change; backend timing policy is covered through unit-level config tests. |

## Migration / Rollout

No migration required. Existing Firestore documents already store concrete timestamps, so historical records remain valid. Rollout is additive: if the new envs are omitted, production behavior stays identical. Operators can opt in by setting env values and restarting/redeploying the runtime.

## Open Questions

- [ ] Should invalid values only silently default, or also emit a warning log similar to `resolveHardeningFlag()` for operational visibility?
