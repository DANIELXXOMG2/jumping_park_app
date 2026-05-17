# API reference

This reference is the current manual map of the API surface for Jumping Park. Use it when you need the shortest truthful path from a route handler to the service file, validation contract, or schema helper that actually owns the behavior today.

## Quick path

1. Start in **Main route surface** to find the public or admin endpoint.
2. Jump to **Service layer** to see which file owns the behavior behind that endpoint.
3. Check **Shared validation surface** when the route body or stored content is shaped by Zod.
4. Fall back to `docs/guides/testing.md` when you need the fastest Bun test loop for the area you touched.

## Current boundary

| Topic | Current truth |
| --- | --- |
| Source of truth | Route handlers live in `src/app/api/`; service logic lives in `src/services/`; shared Zod contracts live in `src/lib/schemas/`. |
| API format | No generated OpenAPI document ships with this repository today. This file is the manual source map until an API-generation slice is added later. |
| Service count | The repo currently has 13 files under `src/services/`. `src/services/userService.ts` is notable because it exports three service entrypoints: `userService`, `staffService`, and `minorService`. |
| Validation count | The main request-entry surface is gated by six route-facing Zod schemas. The same schema layer also exposes supporting validators for minors, legal-content documents, and visitor forms. |
| Route style | Public CRUD routes use `createCrudRoutes`, most OTP/consent/admin reporting routes stay thin and service-driven, and a few admin settings/roles/setup endpoints still keep some orchestration inside the route file itself. |

## Service layer

| File | Primary exports | Main consumers today | What it owns |
| --- | --- | --- | --- |
| `src/services/authService.ts` | `requestOtpChallenge`, `validateOtpChallengeRequest`, `verifyOtpSession`, OTP helpers | `POST /api/otp`, `POST /api/otp/validate`, `POST /api/consentimientos`, `GET /api/usuarios/[uid]/menores` | OTP challenge lifecycle, permissive/strict validation flow, and short-lived OTP access sessions. |
| `src/services/rateLimitService.ts` | `checkRateLimit` | Indirect via `src/services/authService.ts` | Firestore-backed rate-limit buckets for OTP request throttling. |
| `src/services/emailService.ts` | `sendOtpEmail`, `sendConsentEmail` | Indirect via `src/services/authService.ts`; `POST /api/admin/consents/[id]/resend` | Resend integration for OTP delivery and manual consent resend. |
| `src/services/consentService.ts` | `consentService`, asset helpers | `POST /api/consentimientos`, `GET /api/settings/consent`, `GET /api/admin/verificar-consentimiento`, `GET/DELETE /api/admin/consents/[id]`, `GET /api/admin/consents/[id]/pdf` | Consent creation, signature storage access, consent lookups, validity checks, and consent-settings reads. |
| `src/services/pdfService.ts` | `generateConsentPdf` | `GET /api/admin/consents/[id]/pdf`, `POST /api/admin/consents/[id]/resend` | On-demand branded consent PDF generation. |
| `src/services/minorIndexService.ts` | `minorIndexService` | `GET /api/usuarios/[uid]/menores`, `POST/GET /api/admin/migrate/minors`, indirect via `src/services/consentService.ts` | The denormalized `minors_index` read model, sync logic, and migration helpers. |
| `src/services/userService.ts` | `userService`, `staffService`, `minorService` | `/api/admin/users*`, `/api/admin/staff*`, `/api/admin/minors*` | Visitor, staff, and admin-minor listing/detail/delete workflows, plus staff creation and permission checks. |
| `src/services/adminSessionService.ts` | `exchangeAdminSessionFromIdToken`, `refreshAdminSessionFromRequest` | `/api/admin/session` | Admin cookie-session exchange and refresh on top of Firebase ID tokens. |
| `src/services/adminMetricsService.ts` | `adminMetricsService`, aggregate builders | `/api/admin/stats`, `/api/admin/stats/detailed`, `/api/admin/activity` | Aggregate and live admin metrics, detailed KPI rollups, and activity snapshots. |
| `src/services/adminConsentListService.ts` | `listAdminConsents`, `buildAdminConsentsListResponse` | `GET /api/admin/consents` | Paginated admin consent listing with search, cursor support, and freshness metadata. |
| `src/services/adminExportService.ts` | `buildUsersCsvExport`, `buildConsentsCsvExport` | `/api/admin/export/users`, `/api/admin/export/consents` | CSV payload generation for users and consents. |
| `src/services/exportRangeService.ts` | `resolveExportRange`, `resolveBoundedExportRange`, export metadata helpers | `/api/admin/export/users`, `/api/admin/export/consents` | Export date-range hardening, bounded-range validation, and export response headers. |
| `src/services/adminAuditService.ts` | audit entry builders and writers | `/api/admin/users/[id]`, `/api/admin/users/[id]/permissions`, `/api/admin/staff*`, `/api/admin/minors/[id]`, `/api/admin/settings/consent`, `/api/admin/roles` | Audit-log payload construction plus single-write and batch-write helpers for admin mutations. |

## Shared validation surface

### Route-facing request-entry schemas

These are the six Zod contracts that directly gate the main public CRUD/auth submission routes today.

| Schema | File | Used by | What it validates |
| --- | --- | --- | --- |
| `sendOtpSchema` | `src/lib/schemas/auth.schema.ts` | `POST /api/otp` | OTP request payloads keyed by email and/or document id. |
| `validateOtpSchema` | `src/lib/schemas/auth.schema.ts` | `POST /api/otp/validate` | OTP validation payloads with the 6-digit code. |
| `usuarioCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/usuarios` | Direct visitor/user creation payloads. |
| `menorCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/menores` | Standalone minor creation payloads, built on top of `minorSchema`. |
| `accesoCreateSchema` | `src/lib/schemas/crud.schema.ts` | `POST /api/accesos` | Access-log writes for park entry/exit records. |
| `consentSubmissionSchema` | `src/lib/schemas/consent.schema.ts` | `POST /api/consentimientos` | Public consent submissions, including adult identity, minors, signature, and optional offline replay metadata. |

### Supporting shared/domain validators

| Contract | File | Role |
| --- | --- | --- |
| `minorSchema`, `birthDateSchema`, `consentSchema`, `getConsentSchema` | `src/lib/schemas/consent.schema.ts` | Shared minor and consent-form validation reused underneath the public consent flow and CRUD extension points. |
| `localizedConsentSchema` | `src/lib/schemas/legalContent.schema.ts` | Structural validation for localized legal-content documents stored under settings data. |
| `visitorSchema` | `src/lib/schemas/visitor.schema.ts` | Visitor-form validation for UI flows rather than a direct `src/app/api/` route today. |
| `UTF8_NAME_REGEX`, `ALPHANUMERIC_DOC_REGEX` | `src/lib/schemas/shared.regex.ts` | Shared regex primitives used by multiple Zod schemas to keep document-id and UTF-8 name rules consistent. |

## Main route surface

### Public and kiosk endpoints

| Route | Methods | Validation / service path | Notes |
| --- | --- | --- | --- |
| `/api/otp` | `POST /api/otp` | `sendOtpSchema` → `requestOtpChallenge` | Starts the OTP challenge flow and applies the OTP hardening/rate-limit policy. |
| `/api/otp/validate` | `POST /api/otp/validate` | `validateOtpSchema` → `validateOtpChallengeRequest` | Verifies the 6-digit code and opens the short-lived OTP access session. |
| `/api/consentimientos` | `POST /api/consentimientos` | `consentSubmissionSchema` → `verifyOtpSession` + `consentService.createConsent` | Creates the public consent record after the OTP gate passes. |
| `/api/settings/consent` | `GET /api/settings/consent` | `consentService.getConsentSettings` | Reads localized consent content, with Firestore-first and default-content fallback behavior. |
| `/api/usuarios` | `GET /api/usuarios`, `POST /api/usuarios` | `createCrudRoutes` + `usuarioCreateSchema` | Generic Firestore CRUD wrapper for direct user documents. |
| `/api/usuarios/check` | `POST /api/usuarios/check` | Route-local Zod parse + Firestore lookup | Blind-check endpoint that returns only masked email metadata. |
| `/api/usuarios/[uid]/menores` | `GET /api/usuarios/[uid]/menores` | `verifyOtpSession` + `minorIndexService.getMinorsByParentId` | Parent-facing minor lookup after OTP session validation. |
| `/api/menores` | `GET /api/menores`, `POST /api/menores` | `createCrudRoutes` + `menorCreateSchema` | Generic CRUD wrapper for standalone minors. |
| `/api/accesos` | `GET /api/accesos`, `POST /api/accesos` | `createCrudRoutes` + `accesoCreateSchema` | Generic CRUD wrapper for access logs. |

### Admin endpoints

| Route group | Methods present today | Primary service/helper path | Notes |
| --- | --- | --- | --- |
| `/api/admin/session` | `GET`, `POST`, `DELETE` | `adminSessionService` + `adminAuth` cookie helpers | Exchanges Firebase ID tokens for admin cookies, refreshes them, and clears them on logout. |
| `/api/admin/verificar-consentimiento` | `GET` | `consentService.findConsentByCedula` | Verifies whether a document id currently maps to a valid consent. |
| `/api/admin/users`, `/api/admin/users/recent`, `/api/admin/users/[id]`, `/api/admin/users/[id]/permissions` | `GET`, `DELETE`, `PATCH` | `userService` + `adminAuditService` | Admin visitor lookup, recent-user view, deletion, and custom-permission mutation. |
| `/api/admin/staff`, `/api/admin/staff/[id]` | `GET`, `POST`, `DELETE` | `staffService` + `adminAuditService` | Staff listing, creation, lookup, and removal. |
| `/api/admin/minors`, `/api/admin/minors/[id]`, `/api/admin/migrate/minors` | `GET`, `DELETE`, `POST` | `minorService`, `minorIndexService`, `adminAuditService` | Admin minor listing/detail/delete plus the migration path into `minors_index`. |
| `/api/admin/consents`, `/api/admin/consents/[id]`, `/api/admin/consents/[id]/pdf`, `/api/admin/consents/[id]/resend` | `GET`, `DELETE`, `POST` | `adminConsentListService`, `consentService`, `pdfService`, `emailService`, `adminAuditService` | Consent list/detail/delete plus on-demand PDF generation and manual resend. |
| `/api/admin/export/users`, `/api/admin/export/consents` | `GET` | `exportRangeService` + `adminExportService` | CSV export routes with bounded-range hardening metadata. |
| `/api/admin/stats`, `/api/admin/stats/detailed`, `/api/admin/activity` | `GET` | `adminMetricsService` | Overview KPIs, detailed period rollups, and same-day activity snapshots. |
| `/api/admin/settings/consent` | `GET`, `POST`, `DELETE` | Route-local Firestore settings orchestration + `adminAuditService` | Admin authoring surface for consent-copy settings; it does not yet have a dedicated service wrapper. |
| `/api/admin/roles` | `GET`, `POST`, `DELETE` | Route-local admin/user management + `adminAuditService` | Role management still keeps most orchestration inside the route handler. |
| `/api/admin/set-admin` | `POST` | Route-local Firebase Admin/Auth orchestration | Emergency/admin-bootstrap endpoint guarded by env toggles. |

## What is not centralized yet

- `src/app/api/usuarios/check/route.ts` owns its own schema and Firestore lookup instead of delegating to `src/services/authService.ts` or `src/services/userService.ts`.
- `src/app/api/admin/settings/consent/route.ts`, `src/app/api/admin/roles/route.ts`, and `src/app/api/admin/set-admin/route.ts` still keep meaningful request parsing and orchestration inside the route file.
- The schema layer is stronger than the documentation/export layer right now: validation exists, but OpenAPI generation does not.

## Next step

- Read `docs/guides/testing.md` before changing route handlers or service contracts so you can pick the fastest Bun verification loop.
- Read `docs/ARQUITECTURA.md` when you need the broader rollout, Firebase, and admin-surface context behind these endpoints.
