# Playwright Coverage Gap Analysis

> **Status**: current
> **Audit date**: 2026-06-05
> **Diátaxis**: Reference
> **Linked sources**: `playwright/accessibility.a11y.ts`, `playwright/portfolio-homepage-optimization.a11y.ts`, `playwright/signature-canvas-warning.a11y.ts`, `playwright/helpers.ts`, `playwright.config.ts`, `tests/playwright-coverage-gap-analysis.test.ts`

This reference documents the Playwright E2E coverage surface, identifies gaps against critical user paths, and makes risk-based recommendations for test additions (Slice 4 of the repo surface audit).

## 1. Current coverage

### 1.1 Test files (3 files, 10 tests)

| File | Tests | Routes Exercised |
|------|-------|------------------|
| `playwright/accessibility.a11y.ts` | 6 | `/`, `/consentimiento-digital`, `/ingreso`, `/consentimiento`, `/offline`, `/admin/login`, `/registro` |
| `playwright/portfolio-homepage-optimization.a11y.ts` | 3 | `/`, `/ingreso` (via click nav) |
| `playwright/signature-canvas-warning.a11y.ts` | 1 | `/consentimiento` (full signature submission flow) |

### 1.2 Helper utilities

| Helper | Purpose | Used By |
|--------|---------|---------|
| `expectNoAxeViolations` | Axe result assertion | All a11y tests |
| `seedAuthenticatedKioskSession` | Inject kiosk session via localStorage | Consent dialog + signature tests |
| `readViewportOverflow` | Detect horizontal overflow at 640px | Reflow tests |
| `collectHydrationSignals` | Capture hydration mismatch warnings | Kiosk ingreso, consent dialog |

## 2. Route coverage matrix

16 page routes across 3 route groups. Coverage determined by explicit `page.goto()` calls in Playwright test files.

### 2.1 Covered routes (7 of 16)

| Route | Group | Coverage Type | Source File |
|-------|-------|---------------|-------------|
| `/` | `(public)` | Axe + reflow + functional nav | `accessibility.a11y.ts`, `portfolio-homepage-optimization.a11y.ts` |
| `/consentimiento-digital` | `(public)` | Axe + reflow | `accessibility.a11y.ts` |
| `/ingreso` | `(kiosk)` | Axe + reflow + hydration | `accessibility.a11y.ts` |
| `/consentimiento` | `(kiosk)` | Axe (dialog) + keyboard flow + signature submission | `accessibility.a11y.ts`, `signature-canvas-warning.a11y.ts` |
| `/offline` | — | Axe + reflow | `accessibility.a11y.ts` |
| `/registro` | `(kiosk)` | Axe + reflow (conditional — guarded by session state) | `accessibility.a11y.ts` |
| `/admin/login` | `(admin)` | Axe + reflow | `accessibility.a11y.ts` |

### 2.2 Uncovered routes (9 of 16)

| Route | Group | Risk | Justification |
|-------|-------|------|---------------|
| `/otp` | `(kiosk)` | **HIGH** | Part of kiosk critical path (ingreso → otp → consentimiento → exito). OTP verification is the authentication gate for the entire consent flow. |
| `/exito` | `(kiosk)` | **HIGH** | Terminal step of kiosk critical path. Signature test navigates here implicitly via form submission but makes no assertions about the success page. |
| `/admin` | `(admin)` | Medium | Admin dashboard behind Firebase Auth. Requires authenticated session setup. |
| `/admin/configuracion` | `(admin)` | Low | Settings page. Low-traffic internal tool. |
| `/admin/consentimientos` | `(admin)` | Medium | Consent management — data integrity concern. |
| `/admin/estadisticas` | `(admin)` | Low | Statistics dashboard. Read-only, low risk. |
| `/admin/menores` | `(admin)` | Medium | Minor registration management. |
| `/admin/usuarios` | `(admin)` | Medium | User management. |
| `/admin/usuarios/:id` | `(admin)` | Medium | Individual user detail/edit. |

## 3. Critical path analysis

### 3.1 Kiosk flow — OTP → Consent → Signature → Success

```
/ingreso → /otp → /consentimiento → /exito
  ✅         ❌         ✅               ❌
```

**Gap severity**: HIGH. Two of four steps in the highest-risk user journey have zero Playwright coverage.

The existing `signature-canvas-warning.a11y.ts` test exercises the consent form's full submission flow (form fill → signature draw → policy accept → API submit → redirect to /exito), but:
- It bypasses the OTP verification step entirely by seeding `localStorage` with `seedAuthenticatedKioskSession`
- It does not assert anything about the `/exito` success page after redirect
- The `/otp` page (SMS code entry, validation, error states) has never been tested

### 3.2 Admin flow — Login → Dashboard

```
/admin/login → /admin
     ✅            ❌
```

**Gap severity**: MEDIUM. Login is tested; dashboard rendering behind Firebase Auth is not. The admin surface has 7 uncovered routes total.

### 3.3 Public consent flow

```
/consentimiento-digital
         ✅
```

**Gap severity**: NONE. Fully covered with Axe, reflow, and heading assertions.

## 4. Risk-based recommendations

### 4.1 Implement now (Slice 4)

- **`playwright/kiosk-flow.e2e.ts`**: New test covering the kiosk critical path exit nodes — `/exito` (success page Axe + reflow) and `/consentimiento` → `/exito` (full form fill → signature → API submit → success redirect, 1 test). This closes the `/exito` HIGH-risk gap.

### 4.2 Known limitations (accepted)

- **`/otp` page**: Cannot be tested via Playwright with seeded sessions because the `KioskSessionRestorer` component redirects authenticated sessions from `/otp` to `/consentimiento`. Testing `/otp` requires either a non-authenticated session with valid `visitorData` (not supported by the store's `restoreSession()`) or completing the full `/ingreso` document lookup flow against Firebase, which requires Firebase emulation not configured in the Playwright environment. The gap is accepted for Slice 4.
- **`meta-viewport` Axe violation**: A known Axe `meta-viewport` violation appears on `/exito` and `/ingreso` when rendered with seeded kiosk sessions. This is pre-existing and tracked outside Slice 4. The kiosk-flow test filters this known violation to avoid false-negative failures.

### 4.2 Defer to future phase

- Admin route coverage requires authenticated Firebase sessions, which adds significant setup complexity. The admin surface is internal-only and protected by Firebase Auth + Admin SDK server-side checks. Deferring admin E2E coverage to a dedicated hardening phase is a reasonable risk trade-off.
- `/registro` full-form coverage requires a kiosk session with document data pre-populated. The current conditional coverage (Axe + reflow when the guard renders) is adequate for the current scope.

## 5. Regression guard

The `tests/playwright-coverage-gap-analysis.test.ts` unit test programmatically verifies this gap analysis remains truthful. If new page routes are added without corresponding Playwright tests, the test will flag them as undocumented gaps. If Playwright tests are added for previously uncovered routes, the analysis will detect the coverage improvement.

## 6. Config note

`playwright.config.ts` currently matches only `**/*.a11y.ts`. When adding functional E2E tests (e.g., `kiosk-flow.e2e.ts`), the `testMatch` pattern must be updated to include `**/*.e2e.ts`.
