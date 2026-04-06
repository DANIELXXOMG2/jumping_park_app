# Proposal: Rollout Flags and Observability Hardening

## Intent
Implement missing rollout flags (`OTP_HARDENING_ENABLED`, `EXPORT_BOUNDS_ENFORCED`, `PUBLIC_SEO_ENABLED`) and shared observability logging to restore the safe canary/rollback promise of the production hardening design.

## Scope

### In Scope
- Create a central typed hardening policy module for rollout flags.
- Wire `OTP_HARDENING_ENABLED` to OTP request/validate endpoints.
- Wire `EXPORT_BOUNDS_ENFORCED` to export endpoints.
- Wire `PUBLIC_SEO_ENABLED` to SEO surfaces (`robots.txt`, `sitemap.xml`, layouts).
- Add deterministic observability metadata (headers/logs) for active policies.
- Update `.env.example`, `README.md`, and runbook docs with flag expectations.

### Out of Scope
- Complete refactoring of all application logging.
- Changing the underlying hardening behavior (only gating it).
- Changes to existing `ADMIN_SESSION_MODE` logic, other than potentially unifying it into the new policy.

## Capabilities

### New Capabilities
- `rollout-policy`: Central typed runtime policy for resolving and observing feature flags.
- `hardened-otp`: Gated by `OTP_HARDENING_ENABLED` flag.
- `bounded-export`: Gated by `EXPORT_BOUNDS_ENFORCED` flag.
- `public-seo`: Gated by `PUBLIC_SEO_ENABLED` flag.

### Modified Capabilities
- None

## Approach
Introduce a central hardening policy module (`src/lib/hardeningPolicy.ts`) that reads environment variables and exposes typed feature flags and observability helpers. Update OTP, export, and SEO entry points to consult this policy module before enforcing hardened behaviors. If a flag is disabled, the system will gracefully fall back to legacy/unbounded behaviors while logging the fallback state.

## PR Slicing Strategy
1. **Core Policy & Docs**: Introduce `src/lib/hardeningPolicy.ts`, observability helpers, and update `.env.example`/docs. (Focus: Pure typing, no behavior change).
2. **OTP & Export Wiring**: Wire `OTP_HARDENING_ENABLED` and `EXPORT_BOUNDS_ENFORCED` flags to API routes and services with deterministic logs. (Focus: Rollback path testing).
3. **SEO Wiring**: Wire `PUBLIC_SEO_ENABLED` to `robots.txt`, `sitemap.xml`, and metadata. (Focus: Public surface gating).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/hardeningPolicy.ts` | New | Central typed policy module |
| `src/services/authService.ts` | Modified | Wire OTP hardening flag |
| `src/app/api/admin/export/users/route.ts` | Modified | Wire export bounds flag |
| `src/app/api/admin/export/consents/route.ts`| Modified | Wire export bounds flag |
| `src/app/robots.ts` | Modified | Wire SEO flag |
| `src/app/sitemap.ts` | Modified | Wire SEO flag |
| `src/app/layout.tsx` | Modified | Wire SEO metadata flag |
| `.env.example` / Docs | Modified | Add new flags and operational expectations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unintended exposure of legacy paths | Medium | Strict default-on for flags if env vars are missing; comprehensive tests for flag-off states. |
| Inconsistent SEO indexing | Low | Ensure `robots.txt`, `sitemap.xml`, and layout metadata all strictly read from the same policy flag. |

## Rollback Plan
Operators can immediately disable a specific feature by toggling its environment variable (`OTP_HARDENING_ENABLED=false`, `EXPORT_BOUNDS_ENFORCED=false`, `PUBLIC_SEO_ENABLED=false`) and restarting the application, falling back to legacy behavior without a code deployment.

## Dependencies
- None

## Success Criteria
- [ ] Central policy module exists and is fully typed.
- [ ] OTP, export, and SEO behaviors can be toggled via environment variables without code changes.
- [ ] Disabling a flag successfully reverts the system to pre-hardening behavior.
- [ ] Active policy state is logged/observable during critical operations.