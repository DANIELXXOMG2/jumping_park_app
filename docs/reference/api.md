# API Reference

> **Status**: current
> **Audit date**: 2026-05-24
> **Diátaxis**: Reference
> **Linked sources**: `src/app/api/*/route.ts` (32 route handlers), `src/services/` (13 service files), `src/lib/schemas/` (6 schema files)

Manual source map of the Jumping Park API surface. Use this reference to find the shortest truthful path from a route handler to its service, validation contract, or schema helper.

## 1. Quick path

1. Start in **Route surface** (§3) to find the public, kiosk, or admin endpoint.
2. Jump to **Service layer** (§2) to see which file owns the behavior.
3. Check **Validation surface** (§4) when the request body or stored content is shaped by Zod.
4. For local development verification, run `bun test` (the project's Bun test runner with 158+ test assertions).

## 2. Service layer

13 service files under `src/services/`. Every route delegates business logic to one of these.

| File | Primary exports | Consumed by | Owns |
|---|---|---|---|
| `src/services/authService.ts` | `requestOtpChallenge`, `validateOtpChallengeRequest`, `verifyOtpSession`, OTP helpers | `POST /api/otp`, `POST /api/otp/validate`, `POST /api/consentimientos`, `GET /api/usuarios/[uid]/menores` | OTP challenge lifecycle, permissive/strict validation, short-lived access sessions. |
| `src/services/rateLimitService.ts` | `checkRateLimit` | Indirect via `authService.ts` | Firestore-backed rate-limit buckets for OTP request throttling. |
| `src/services/emailService.ts` | `sendOtpEmail`, `sendConsentEmail` | Indirect via `authService.ts`; `POST /api/admin/consents/[id]/resend` | Resend integration for OTP delivery and manual consent resend. |
| `src/services/consentService.ts` | `consentService`, asset helpers | `POST /api/consentimientos`, `GET /api/settings/consent`, `GET /api/admin/verificar-consentimiento`, `GET/DELETE /api/admin/consents/[id]`, `GET /api/admin/consents/[id]/pdf` | Consent creation, signature storage access, lookups, validity checks, and consent-settings reads. |
| `src/services/pdfService.ts` | `generateConsentPdf` | `GET /api/admin/consents/[id]/pdf`, `POST /api/admin/consents/[id]/resend` | On-demand branded consent PDF generation. |
| `src/services/minorIndexService.ts` | `minorIndexService` | `GET /api/usuarios/[uid]/menores`, `POST/GET /api/admin/migrate/minors`, indirect via `consentService.ts` | Denormalized `minors_index` read model, sync logic, and migration helpers. |
| `src/services/userService.ts` | `userService`, `staffService`, `minorService` | `/api/admin/users*`, `/api/admin/staff*`, `/api/admin/minors*` | Visitor, staff, and admin-minor listing/detail/delete, plus staff creation and permission checks. |
| `src/services/adminSessionService.ts` | `exchangeAdminSessionFromIdToken`, `refreshAdminSessionFromRequest` | `/api/admin/session` | Admin cookie-session exchange and refresh on top of Firebase ID tokens. |
| `src/services/adminMetricsService.ts` | `adminMetricsService`, aggregate builders | `/api/admin/stats`, `/api/admin/stats/detailed`, `/api/admin/activity` | Aggregate and live admin metrics, detailed KPI rollups, and activity snapshots. |
| `src/services/adminConsentListService.ts` | `listAdminConsents`, `buildAdminConsentsListResponse` | `GET /api/admin/consents` | Paginated admin consent listing with search, cursor support, and freshness metadata. |
| `src/services/adminExportService.ts` | `buildUsersCsvExport`, `buildConsentsCsvExport` | `/api/admin/export/users`, `/api/admin/export/consents` | CSV payload generation for users and consents. |
| `src/services/exportRangeService.ts` | `resolveExportRange`, `resolveBoundedExportRange`, export metadata helpers | `/api/admin/export/users`, `/api/admin/export/consents` | Export date-range hardening, bounded-range validation, and response headers. |
| `src/services/adminAuditService.ts` | Audit entry builders and writers | `/api/admin/users/[id]`, `/api/admin/users/[id]/permissions`, `/api/admin/staff*`, `/api/admin/minors/[id]`, `/api/admin/settings/consent`, `/api/admin/roles` | Audit-log payload construction plus single-write and batch-write helpers for admin mutations. |

## 3. Route surface

### 3.1 Public & kiosk endpoints

| Route | Methods | Auth | Validation → Service | Notes |
|---|---|---|---|---|
| `/api/otp` | `POST` | None (rate-limited per IP) | `sendOtpSchema` → `requestOtpChallenge` | Starts OTP challenge; applies hardening/rate-limit policy. |
| `/api/otp/validate` | `POST` | None | `validateOtpSchema` → `validateOtpChallengeRequest` | Verifies 6-digit code; opens short-lived OTP access session. |
| `/api/consentimientos` | `POST` | OTP session cookie | `consentSubmissionSchema` → `verifyOtpSession` + `consentService.createConsent` | Creates public consent record after OTP gate passes. |
| `/api/settings/consent` | `GET` | None | `consentService.getConsentSettings` | Reads localized consent content with Firestore-first, default-content fallback. |
| `/api/usuarios` | `GET`, `POST` | POST: none; GET: none | `createCrudRoutes` + `usuarioCreateSchema` | Generic Firestore CRUD wrapper for user documents. |
| `/api/usuarios/check` | `POST` | None | Route-local Zod parse + Firestore lookup | Blind-check; returns only masked email metadata. |
| `/api/usuarios/[uid]/menores` | `GET` | OTP session cookie | `verifyOtpSession` + `minorIndexService.getMinorsByParentId` | Parent-facing minor lookup after OTP session validation. |
| `/api/menores` | `GET`, `POST` | None | `createCrudRoutes` + `menorCreateSchema` | Generic CRUD wrapper for standalone minors. |
| `/api/accesos` | `GET`, `POST` | None | `createCrudRoutes` + `accesoCreateSchema` | Generic CRUD wrapper for access logs. |

### 3.2 Admin endpoints

| Route group | Methods | Auth | Primary service/helper | Notes |
|---|---|---|---|---|
| `/api/admin/session` | `GET`, `POST`, `DELETE` | Firebase ID token (POST) / session cookie (GET, DELETE) | `adminSessionService` + `adminAuth` cookie helpers | Exchanges Firebase ID tokens for admin cookies, refreshes them, clears on logout. |
| `/api/admin/verificar-consentimiento` | `GET` | Admin session cookie | `consentService.findConsentByCedula` | Verifies whether a document ID maps to a valid consent. |
| `/api/admin/users`, `/api/admin/users/recent`, `/api/admin/users/[id]`, `/api/admin/users/[id]/permissions` | `GET`, `DELETE`, `PATCH` | Admin session cookie | `userService` + `adminAuditService` | Admin visitor lookup, recent-user view, deletion, and custom-permission mutation. |
| `/api/admin/staff`, `/api/admin/staff/[id]` | `GET`, `POST`, `DELETE` | Admin session cookie | `staffService` + `adminAuditService` | Staff listing, creation, lookup, and removal. |
| `/api/admin/minors`, `/api/admin/minors/[id]`, `/api/admin/migrate/minors` | `GET`, `DELETE`, `POST` | Admin session cookie | `minorService`, `minorIndexService`, `adminAuditService` | Admin minor listing/detail/delete plus migration path into `minors_index`. |
| `/api/admin/consents`, `/api/admin/consents/[id]`, `/api/admin/consents/[id]/pdf`, `/api/admin/consents/[id]/resend` | `GET`, `DELETE`, `POST` | Admin session cookie | `adminConsentListService`, `consentService`, `pdfService`, `emailService`, `adminAuditService` | Consent list/detail/delete plus on-demand PDF generation and manual resend. |
| `/api/admin/export/users`, `/api/admin/export/consents` | `GET` | Admin session cookie | `exportRangeService` + `adminExportService` | CSV export routes with bounded-range hardening metadata. |
| `/api/admin/stats`, `/api/admin/stats/detailed`, `/api/admin/activity` | `GET` | Admin session cookie | `adminMetricsService` | Overview KPIs, detailed period rollups, and same-day activity snapshots. |
| `/api/admin/settings/consent` | `GET`, `POST`, `DELETE` | Admin session cookie | Route-local Firestore settings orchestration + `adminAuditService` | Admin authoring surface for consent-copy settings; no dedicated service wrapper yet. |
| `/api/admin/roles` | `GET`, `POST`, `DELETE` | Admin session cookie | Route-local admin/user management + `adminAuditService` | Role management; most orchestration inside the route handler. |
| `/api/admin/set-admin` | `POST` | Env-guarded | Route-local Firebase Admin/Auth orchestration | Emergency/admin-bootstrap endpoint; toggled by environment variables. |

### 3.3 Route handler patterns

All route handlers follow one of two patterns:

- **Service-driven**: thin route handler that validates input via `apiHandler` / `getValidatedBody`, then delegates to a service function. Example: `POST /api/otp` → `requestOtpChallenge`.
- **Route-local orchestration**: keeps request parsing and Firestore operations inside the route file itself. Currently used by `/api/admin/settings/consent`, `/api/admin/roles`, `/api/admin/set-admin`, and `/api/usuarios/check`.

## 4. Validation surface

### 4.1 Route-entry schemas

Six Zod contracts gate the main public CRUD/auth submission routes.

| Schema | File | Used by | Validates |
|---|---|---|---|
| `sendOtpSchema` | `src/lib/schemas/auth.schema.ts` | `POST /api/otp` | OTP request: email and/or document ID. |
| `validateOtpSchema` | `src/lib/schemas/auth.schema.ts` | `POST /api/otp/validate` | OTP validation: 6-digit code + email/document ID. |
| `usuarioCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/usuarios` | Direct visitor/user creation payloads. |
| `menorCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/menores` | Standalone minor creation, built on `minorSchema`. |
| `accesoCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/accesos` | Access-log writes for park entry/exit records. |
| `consentSubmissionSchema` | `src/lib/schemas/consent.schema.ts` | `POST /api/consentimientos` | Public consent: adult identity, minors, signature, optional offline replay metadata. |

### 4.2 Supporting shared/domain validators

| Contract | File | Role |
|---|---|---|
| `minorSchema`, `birthDateSchema`, `consentSchema`, `getConsentSchema` | `src/lib/schemas/consent.schema.ts` | Shared minor and consent-form validation reused underneath the public consent flow and CRUD extension points. |
| `localizedConsentSchema` | `src/lib/schemas/legalContent.schema.ts` | Structural validation for localized legal-content documents stored under settings data. |
| `visitorSchema` | `src/lib/schemas/visitor.schema.ts` | Visitor-form validation for UI flows; not gating a direct API route today. |
| `UTF8_NAME_REGEX`, `ALPHANUMERIC_DOC_REGEX` | `src/lib/schemas/shared.regex.ts` | Shared regex primitives used by multiple Zod schemas for document-ID and UTF-8 name rules. |

## 5. Auth model

| Layer | Mechanism | Source |
|---|---|---|
| **Public OTP** | Email or document-ID → 6-digit code → short-lived access session cookie | `src/app/api/otp/route.ts`, `src/services/authService.ts` |
| **Admin session** | Firebase ID token → server-side cookie exchange (`ADMIN_SESSION_COOKIE_NAME`) | `src/app/api/admin/session/route.ts`, `src/services/adminSessionService.ts` |
| **Custom claims** | Firebase Auth custom claims for RBAC (`admin`, `trabajador`) | `src/lib/adminAuth.ts`, `src/types/auth.ts` |
| **Rate limiting** | Firestore-backed buckets: max 3 OTP requests / 5 min per email; IP multiplier of 3 | `src/services/rateLimitService.ts`, `src/app/api/otp/route.ts` lines 10-11 |

## 6. What is not centralized yet

- `src/app/api/usuarios/check/route.ts` owns its own schema and Firestore lookup instead of delegating to a service.
- `/api/admin/settings/consent`, `/api/admin/roles`, and `/api/admin/set-admin` keep meaningful request parsing and orchestration inside the route file.
- The schema layer is stronger than the documentation/export layer: validation exists, but OpenAPI generation does not.
- No dedicated service wrapper exists yet for the admin settings consent route.

## 7. Next step

- Read [`docs/reference/architecture.md`](../reference/architecture.md) for the broader rollout, Firebase, and admin-surface context behind these endpoints.
- Read [`docs/reference/firebase.md`](../reference/firebase.md) for collection contracts, security rules, and the auth/OTP flow in detail.
- Run `bun test` before changing route handlers or service contracts to catch regressions quickly.
