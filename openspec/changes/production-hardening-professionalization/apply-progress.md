# Apply Progress

**Change**: `production-hardening-professionalization`
**Scope**: PR-01.5 to close PR-01 verification gap
**Mode**: Standard
**Date**: 2026-04-05

## Completed

- Added a standard Bun test entrypoint with `bun test` in `package.json`.
- Added lightweight Bun test type declarations so the new test files pass `tsc --noEmit` without extra dependencies.
- Added perimeter tests covering protected `/admin/*` access without cookie, expired cookie invalidation, and security headers via `src/proxy.ts`.
- Added OTP hardening tests covering `>3` requests in `5` minutes and explicit `OTP_LOCKED` behavior via deterministic dependency injection in `src/services/authService.ts`.
- Re-ran required validation commands: `bun run check:types` and `bun test`.

## Tasks

- `openspec/changes/production-hardening-professionalization/tasks.md` already had PR-01 tasks `1.1`-`1.4` marked complete; no checkbox changes were required for this verification-focused follow-up.

## Validation Evidence

- `bun run check:types` -> PASS
- `bun test` -> PASS (`5` tests, `0` failures)

## Risks

- OTP request automation currently verifies the documented primary document-based limiter with injected dependencies, but it does not exercise real Firestore transaction behavior end-to-end.
- Security-header coverage is focused on the current proxy contract; future CSP tightening will require test updates if directives change.
