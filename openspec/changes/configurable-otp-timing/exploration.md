## Exploration: configurable otp timing

### Current State
`src/services/authService.ts` hardcodes OTP code expiration at `60` minutes and validated kiosk access session duration at `120` minutes. `OTP_LOCKOUT_MINUTES` is already env-driven, so the OTP service already has an established runtime-policy pattern. Operational docs also describe 60/120 as current enforced values. Browser-side kiosk localStorage persistence is a separate 15-minute UX mechanism in `src/lib/utils/kioskSession.ts` and is not the same as the backend validated session.

### Affected Areas
- `src/services/authService.ts` — replace hardcoded OTP lifetime constants with env-backed values and fallback defaults.
- `.env.example` — document the new env contract.
- `CLAUDE.md` — update environment variable guidance and OTP timing notes.
- `docs/runbooks/otp-operational-policy.md` — update operator-facing policy/source references.
- `tests/auth-hardening.test.ts` or `tests/otp-timing-config.test.ts` — add config/default/fallback coverage.

### Approaches
1. **Inline env parsing in `authService.ts`** — Read `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES` next to `OTP_LOCKOUT_MINUTES`, with numeric validation and fallback to current values.
   - Pros: Smallest diff, stays close to current code, easy standalone change.
   - Cons: Adds more config parsing into an already large service file.
   - Effort: Low

2. **Extract OTP timing config helper** — Create a tiny helper/module that resolves OTP timing envs and returns validated defaults for `authService.ts` to consume.
   - Pros: Easier unit testing, cleaner separation between config and business logic.
   - Cons: Slightly broader scope for a very small change.
   - Effort: Low/Medium

### Recommendation
Use **Approach 2 with a very small helper** dedicated to OTP timing resolution, then consume it from `src/services/authService.ts`. Introduce `OTP_EXPIRATION_MINUTES` and `OTP_SESSION_DURATION_MINUTES` with defaults `60` and `120` so missing envs preserve behavior. Invalid, zero, or negative values should also fall back to defaults to avoid `NaN`/broken expiry timestamps.

### Risks
- Confusing backend validated-session duration (`120` minutes) with browser kiosk persistence (`15` minutes) and accidentally widening scope.
- Reading envs without validation could turn expirations into `NaN` and silently break OTP issuance/session creation.
- Changing docs incompletely could leave operators with mixed guidance.

### Ready for Proposal
Yes — recommend a standalone change named `configurable-otp-timing` scoped only to backend OTP timing config, env docs, and focused tests.
