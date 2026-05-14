# Proposal: Configurable OTP Timing

## Intent

Make OTP expiration and validated session durations environment-configurable to allow operators to adjust the timing policy without code deployments, while keeping `60` and `120` minute defaults to preserve existing behavior.

## Scope

### In Scope
- Add `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES` support.
- Implement robust parsing/fallback for missing, zero, or invalid values.
- Update `authService.ts` to use parsed values instead of hardcoded numbers.
- Update `.env.example`, `CLAUDE.md`, and relevant operator docs.
- Add unit tests for configuration parsing and fallback logic.

### Out of Scope
- Modifying browser-side kiosk persistence timing (`kioskSession.ts`, 15 min).
- Changing lockout timing (`OTP_LOCKOUT_MINUTES`), which is already configured.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `kiosk-flow`: OTP code expiration and session expiration behaviors become configurable rather than static.

## Approach

Create an OTP timing configuration helper function (e.g., `getOtpTimingConfig()`) that reads environment variables, validates them (must be > 0 and numeric), and returns them or their default fallback (`60` and `120`). Integrate this helper into `authService.ts`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/authService.ts` | Modified | Consume env values via a config helper. |
| `src/lib/utils/otpConfig.ts` | New | Configuration parser and validator. |
| `.env.example` / `CLAUDE.md` | Modified | Document new env variables. |
| `docs/runbooks/otp-operational-policy.md` | Modified | Update timing policy docs. |
| `tests/otp-timing-config.test.ts` | New | Test parsing and defaults. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Invalid env values causing `NaN` expirations | Low | Strict validation in config helper (fallback to defaults if invalid or <= 0). |
| Mixing backend session vs. kiosk browser UX session | Low | Explicit naming of variables and clear out-of-scope boundaries. |

## Rollback Plan

Revert `authService.ts` to use hardcoded `60` and `120` constants, remove helper and environment variables.

## Dependencies

- None

## Success Criteria

- [ ] `authService.ts` no longer hardcodes `60` or `120`.
- [ ] Tests verify valid env parsing and safe fallbacks for invalid inputs.
- [ ] Default behavior remains identical without the new env variables.
