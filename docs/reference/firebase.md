# Firebase Configuration & Operations

> **Status**: current
> **Audit date**: 2026-06-05
> **Diátaxis**: Reference
> **Linked sources**: `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase/storage.rules`, `src/services/authService.ts`, `src/lib/adminAuth.ts`, `src/types/auth.ts`

Comprehensive reference for the Firestore data model, security rules, composite indexes, auth/OTP flow, storage rules, and operational notes for the Jumping Park consent system.

## 1. Overview

The project uses Firebase as its sole backend infrastructure:

| Service | Purpose | Configuration |
|---|---|---|
| **Firestore** | Document database — users, consents, OTP, offline sync, metrics, audit | `firebase/firestore.rules` |
| **Firebase Auth** | Custom Claims RBAC + admin session cookies | `src/lib/adminAuth.ts`, `src/types/auth.ts` |
| **Firebase Storage** | Signature storage for consent artifacts; generated PDFs are returned inline and not persisted | `firebase/storage.rules` |
| **Admin SDK** | Server-side privileged operations (OTP session creation, consent writes, aggregate recompute) | `src/lib/firebaseAdmin.ts` |

Firebase project ID: `jumping-park-consents`. All runtime configuration flows through environment variables documented in `.env.example`.

## 2. Firestore Collections

### 2.1 User & Identity Collections

| Collection | Purpose | Access Pattern | Source |
|---|---|---|---|
| `users` | Visitor profiles keyed by cedula (document ID) | Self-read/write; admin read all | `firebase/firestore.rules` (`match /users/{userId}`) |
| `admin_users` | Admin/trabajador profiles with role claims | Admin-only read; write via Admin SDK only | `firebase/firestore.rules` (`match /admin_users/{userId}`) |

**`users` schema** (governed by `src/types/firestore.ts`):
- `email` — contact email for OTP delivery
- `firstName`, `lastName` — identity fields
- `createdAt`, `updatedAt` — Firestore timestamps

**`admin_users` schema**:
- `uid`, `fullName`, `email`
- `role` — `admin` or `trabajador`
- `phone`, `avatar`
- `customPermissions` — granular permission overrides (additive model)
- `createdAt`, `updatedAt`, `createdBy`

### 2.2 OTP Collections (Server-Side Only)

All OTP collections are **server-side only** — client reads and writes are denied at the rules level. All operations go through `src/services/authService.ts` via Admin SDK.

| Collection | Purpose | Lifecycle | Source |
|---|---|---|---|
| `otp_challenges` | Active OTP codes pending validation | Created on OTP request; deleted on expiry. Successful validation resets attempts/lockout and stamps `lastValidatedAt` on the same challenge document. | `firebase/firestore.rules` (`match /otp_challenges/{documentId}`) |
| `otp_access_sessions` | Post-validation kiosk access session (split model) | Created on successful OTP validation; expires after `OTP_SESSION_DURATION_MINUTES` (default 120 min) | `firebase/firestore.rules` (`match /otp_access_sessions/{documentId}`) |
| `otp_sessions` | Legacy OTP session format (fallback compatibility) | Maintained for backward compatibility; read during session verification fallback | `firebase/firestore.rules` (`match /otp_sessions/{documentId}`) |

**OTP challenge schema** (`OtpChallenge` type in `src/types/firestore.ts`):
- `email`, `code` — challenge identity
- `expiresAt` — `OTP_EXPIRATION_MINUTES` from env (default 60 min)
- `attempts` — failed validation counter (max 5 before lockout)
- `lockedUntil`, `lastSentAt`, `lastValidatedAt`

**OTP access session schema** (`OtpAccessSession`):
- `userId` — cedula
- `email`, `validatedAt`, `expiresAt`
- `challengeEmail` — linked challenge for traceability

### 2.3 Consent & Domain Collections

| Collection | Purpose | Access Pattern | Source |
|---|---|---|---|
| `consents` | Signed consent records | Self-read by userId; admin read all; write via Admin SDK only | `firebase/firestore.rules` (`match /consents/{consentId}`) |
| `accesses` | Park entry records | Admin-only read/write | `firebase/firestore.rules` (`match /accesses/{accessId}`) |

**`consents` schema**:
- `userId`, `responsibleAdult` — identity linkage
- `minors` — array of minor records
- `signature` — storage path reference
- `signedAt`, `validUntil`, `createdAt` — temporal fields
- `consentType`, `consecutiveNumber`

### 2.4 Operational Collections (Server-Side Only)

| Collection | Purpose | Source |
|---|---|---|
| `offline_sync` | Idempotent ledger for offline consent replay deduplication | `firebase/firestore.rules` (`match /offline_sync/{documentId}`) |
| `minors_index` | Denormalized projection for fast minor lookups by parent | `firebase/firestore.rules` (`match /minors_index/{documentId}`) |
| `admin_metrics` | Read model for admin dashboard aggregates | `firebase/firestore.rules` (`match /admin_metrics/{documentId}`) |
| `admin_audit_logs` | Immutable audit trail for admin operations | `firebase/firestore.rules` (`match /admin_audit_logs/{documentId}`) |
| `_counters` | Atomic document counters for sequential consent numbering and minor index ID assignment | `firebase/firestore.rules` (`match /_counters/{documentId}`) |
| `settings` | Consent content configuration for multilingual Firestore-sourced legal copy | `firebase/firestore.rules` (`match /settings/{documentId}`) |
| `rate_limits` | OTP/security rate-limiting buckets (per identifier/IP window) | `firebase/firestore.rules` (`match /rate_limits/{documentId}`) |

All seven collections are **server-side only** — no client access. Operations go through dedicated services: `src/services/adminMetricsService.ts`, `src/services/minorIndexService.ts`, `src/services/consentService.ts`, `src/services/rateLimitService.ts`.

## 3. Security Rules (firestore.rules)

Rules file: [`firebase/firestore.rules`](../../firebase/firestore.rules) — Syntax version `2`.

### 3.1 RBAC Model

Access control uses Firebase Custom Claims stored in the JWT token:

```
function isAdmin() {
  return request.auth != null &&
    (request.auth.token.role == 'admin' || request.auth.token.admin == true);
}

function isAuthenticated() {
  return request.auth != null;
}
```

Roles are defined in `src/types/auth.ts`:
- `admin` — full access to admin panel, all collections
- `trabajador` — limited dashboard + minor view
- `visitor` — kiosk consent flow only

### 3.2 Access Matrix

| Collection | Client Read | Client Write | Admin SDK |
|---|---|---|---|
| `users` | Self or admin | Self only | Full |
| `admin_users` | Admin only | Denied | Full |
| `consents` | Self (by userId) or admin | Denied | Full |
| `accesses` | Admin only | Admin only | Full |
| `otp_challenges` | Denied | Denied | Full |
| `otp_access_sessions` | Denied | Denied | Full |
| `otp_sessions` | Denied | Denied | Full |
| `offline_sync` | Denied | Denied | Full |
| `minors_index` | Denied | Denied | Full |
| `admin_metrics` | Denied | Denied | Full |
| `admin_audit_logs` | Denied | Denied | Full |
| `_counters` | Denied | Denied | Full |
| `settings` | Denied | Denied | Full |
| `rate_limits` | Denied | Denied | Full |
| `{document=**}` (default) | Denied | Denied | Denied |

### 3.3 Default Deny

The catch-all rule at the bottom of `firestore.rules` denies all unlisted access:

```
match /{document=**} {
  allow read, write: if false;
}
```

This enforces a **default-deny** posture — every collection must be explicitly authorized.

## 4. Composite Indexes

Indexes file: [`firebase/firestore.indexes.json`](../../firebase/firestore.indexes.json)

### 4.1 consents Indexes

Three indexes support consent queries by user:

| Index | Fields | Use Case |
|---|---|---|
| `consents` composite #1 | `userId ASC`, `createdAt DESC`, `__name__ DESC` | List user consents by recency |
| `consents` composite #2 | `userId ASC`, `signedAt DESC` | Filter by signature date |
| `consents` composite #3 | `userId ASC`, `validUntil ASC` | Find expiring consents |

### 4.2 admin_users Index

| Index | Fields | Use Case |
|---|---|---|
| `admin_users` composite | `role ASC`, `createdAt DESC` | List staff by role |

### 4.3 minors_index Indexes

Two indexes support minor lookups by parent:

| Index | Fields | Use Case |
|---|---|---|
| `minors_index` composite #1 | `parentId ASC`, `updatedAt DESC` | Recent minor updates by parent |
| `minors_index` composite #2 | `parentId ASC`, `createdAt DESC`, `__name__ DESC` | Full minor history by parent |

### 4.4 Index Deployment

Indexes are deployed with `firebase deploy --only firestore:indexes`. The `firebase.json` file references `firebase/firestore.indexes.json` as the authoritative index source. No field overrides are configured.

## 5. Auth & OTP Flow

The auth system combines Firebase Custom Claims (admin/trabajador) with email-based OTP for kiosk visitors. For a visual walkthrough, see the [auth sequence diagram](../../diagramas/auth-sequence.mmd).

### 5.1 Admin Authentication

Admin/trabajador users authenticate through Firebase Auth with Custom Claims (role in JWT token). Implementation: `src/lib/adminAuth.ts` (session mode + idle timeout at lines 15-22; `verifyAdminToken` at lines 282-298; `verifyFullAdminToken` at lines 300-304; `verifyAdminTokenWithPermission` at lines 306-323). Role definitions and the `ROUTE_ACCESS` map live in `src/types/auth.ts` (roles at line 27, `ROUTE_ACCESS` at lines 173-180).

- **Session mode**: `ADMIN_SESSION_MODE` env var — `cookie` or `dual` (cookie + bearer)
- **Session cookie**: `jp_admin_session` — HMAC-SHA256 signed, httpOnly, 30-min idle timeout
- **Bearer fallback**: Firebase ID token verification via Admin SDK
- **Role enforcement**: `verifyAdminToken()`, `verifyFullAdminToken()`, `verifyAdminTokenWithPermission()`

Routes are guarded via `src/lib/adminAuth.ts` middleware pattern. Route-level access control is defined in `src/types/auth.ts` (see `ROUTE_ACCESS` map).

### 5.2 Visitor OTP Flow

OTP lifecycle is implemented in `src/services/authService.ts` (collection constants at lines 22-24, `OTP_MAX_FAILED_ATTEMPTS` at line 29, challenge persistence at lines 213-235, transactional validation at lines 244-366, session creation at lines 368-395, `requestOtpChallenge` at lines 654-835, `validateOtpChallengeRequest` at lines 837-995). See also `docs/runbooks/otp-operational-policy.md` for operational runbook.

**Phase 1 — Challenge Request** (`POST /api/otp`):
1. Use the provided email directly when present; otherwise resolve the visitor by cedula and fetch email from `users`
2. Check existing active challenge → if locked or already sent, return `429`
3. Rate-limit check: 3 requests per 5 min per identifier, 3× multiplier per IP
4. Generate 6-digit code, persist to `otp_challenges` with 60-min expiry
5. Send code via Resend email (`src/services/emailService.ts`)

**Phase 2 — Validation** (`POST /api/otp/validate`):
1. Resolve validation context (email or cedula)
2. Rate-limit check: 5 attempts per 5 min per identifier
3. Transactional validation against `otp_challenges`:
   - Expired → delete challenge, return `OTP_EXPIRED`
   - Locked → return `OTP_LOCKED` with retry-after
   - Wrong code → increment attempts; after 5 failures, lock for `OTP_LOCKOUT_MINUTES` (default 15)
   - Correct → clear attempts/lockout, mark validated
4. On success, create `otp_access_sessions` with `OTP_SESSION_DURATION_MINUTES` expiry (default 120)

**Phase 3 — Session Guard**:
- Consent creation validates OTP session via `verifyOtpSession()` before allowing signature
- Valid sessions remain readable until expiry; only expired split/legacy sessions are deleted during verification
- Legacy `otp_sessions` fallback handles pre-split model data

### 5.3 Operational Controls

All controlled by environment variables:

| Variable | Default | Runtime Location |
|---|---|---|
| `OTP_EXPIRATION_MINUTES` | 60 | `src/lib/utils/otpConfig.ts` |
| `OTP_SESSION_DURATION_MINUTES` | 120 | `src/lib/utils/otpConfig.ts` |
| `OTP_LOCKOUT_MINUTES` | 15 | `src/services/authService.ts` |
| `OTP_HARDENING_ENABLED` | — | `src/lib/hardeningPolicy.ts` |

Hardening flag (`OTP_HARDENING_ENABLED`) controls whether rate-limiting and lockout logic is active. When disabled, the system operates in permissive mode (no rate limits, no lockouts). This is documented in `.env.example`.

## 6. Storage Rules

Rules file: [`firebase/storage.rules`](../../firebase/storage.rules) — Syntax version `2`.

### 6.1 Signature Storage

```
match /signatures/{userId}/{assetPath=**} {
  allow read: if isAdmin();
  allow write: if false;
}
```

Signature blobs are stored under `signatures/{userId}/` with admin-only read access. All writes go through the Admin SDK via `src/services/consentService.ts` (`file.save(...)`) — signed URLs are used later for controlled reads, not for client-side uploads.

### 6.2 Generated PDFs

```
match /generated-pdfs/{documentPath=**} {
  allow read, write: if false;
}
```

Consent PDFs are generated on-demand via API (`src/app/api/consentimientos/pdf/`) and returned inline — they are never persisted to Storage. This namespace is explicitly blocked to prevent accidental persistence.

### 6.3 Default Deny

```
match /{allPaths=**} {
  allow read, write: if false;
}
```

Same default-deny posture as Firestore rules. No unlisted paths are accessible.

## 7. Operational Notes

### 7.1 Deployment

- Local repo changes do **not** affect production until an explicit Firebase deploy is run.
- Deploy rules: `firebase deploy --only firestore:rules`
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Deploy storage rules: `firebase deploy --only storage`
- All references managed in `firebase.json`

### 7.2 Admin SDK Initialization

The Admin SDK (`src/lib/firebaseAdmin.ts`) uses server-only environment variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (with `\n` replacement). `FIREBASE_STORAGE_BUCKET` is optional and enables Storage bucket wiring.

### 7.3 Rate Limiting

OTP rate limiting uses Firestore-backed counters in the `rate_limits` collection via `src/services/rateLimitService.ts`. Counters survive process restarts, consume Firestore read/write operations, and are transactionally updated per identifier/IP window.

### 7.4 Offline Sync Ledger

`offline_sync` collection provides idempotent deduplication for offline consent replay. The dedupe key is a SHA-256 hash of the seed `userId|policyVersion|signedAtLocal`, produced client-side and persisted server-side. On replay, the service checks for an existing ack before creating a new consent — this prevents double-writes when kiosks regain connectivity.

### 7.5 Audit Trail

`admin_audit_logs` is an append-only collection written with auto-generated document IDs. The payload shape is `{ action, actor, target, request, details?, createdAt }`, matching `src/services/adminAuditService.ts`. Query by `createdAt` range and request metadata for incident investigation.

### 7.6 Index Performance

The composite indexes on `consents` enable efficient queries for:
- "Show my recent consents" (userId + createdAt DESC)
- "Find consents expiring soon" (userId + validUntil ASC)
- Admin cursor pagination (userId + signedAt for sorted exports)

The `minors_index` projection avoids repeated sub-collection queries when listing minors by parent.

## 8. Traceability

Every claim in this document is linked to a source file in the repository. To verify:
1. Compare collection list against `firebase/firestore.rules` match blocks
2. Compare index definitions against `firebase/firestore.indexes.json`
3. Compare env vars against `.env.example`
4. Cross-reference auth flow against `src/services/authService.ts`
5. Validate admin auth against `src/lib/adminAuth.ts` and `src/types/auth.ts`

For automated verification, run `bun test tests/batch1-docs-hygiene-reapply.test.ts` (Firebase assertions).

## See Also

- [`docs/reference/architecture.md`](../reference/architecture.md) — system planes, data flow, and collection contracts in broader architectural context
- [`docs/runbooks/otp-operational-policy.md`](../runbooks/otp-operational-policy.md) — operational runbook for OTP troubleshooting
- [`diagramas/auth-sequence.mmd`](../../diagramas/auth-sequence.mmd) — visual sequence diagram of OTP lifecycle
- [`docs/adr/0003-admin-session-and-otp-split.md`](../adr/0003-admin-session-and-otp-split.md) — ADR for OTP split model decision
- [`docs/adr/0005-offline-consent-queue-and-sync-ledger.md`](../adr/0005-offline-consent-queue-and-sync-ledger.md) — ADR for offline sync ledger design
