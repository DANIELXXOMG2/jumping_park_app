# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jumping Park is a Next.js 16+ application for managing digital consent forms at a trampoline park. It features a kiosk-based visitor registration flow with OTP authentication, digital signature capture, and an admin panel for managing consents and users.

## Development Commands

All commands use `bun` (not npm/pnpm):

```bash
# Development
bun dev                 # Start dev server (Turbopack) at http://localhost:3000

# Code Quality
bun run check           # Run all checks (format, lint, types, audit)
bun run check:format    # Format with Biome
bun run check:lint      # Lint with Biome
bun run check:types     # TypeScript check
bun run audit:dead      # Find dead code with Knip
bun run audit:dupe      # Find duplicate code with jscpd
bun run audit:circ      # Find circular dependencies

# Build & Deploy
bun run build           # Production build
bun start               # Start production server

# Database Scripts
bun run seed            # Seed database with test data
bun run set-admin       # Set admin role for a user
bun run migrate:minors  # Run minors data migration
```

## Architecture

### Service Layer Pattern

Business logic is separated from API routes through the `src/services/` layer:

- `authService.ts` - OTP generation, validation, and session management
- `consentService.ts` - Consent creation with atomic counter and PDF generation
- `emailService.ts` - Email delivery via Resend (OTP codes, PDF attachments)
- `pdfService.ts` - PDF generation using pdf-lib
- `userService.ts` - User CRUD and search operations
- `minorIndexService.ts` - Denormalized minor data for efficient querying

API routes in `src/app/api/` should delegate to these services rather than implementing business logic directly.

### API Handler Pattern

All API routes use the `apiHandler` wrapper from `src/lib/apiHandler.ts`:

```typescript
import { apiHandler, getValidatedBody, successResponse, ApiError } from "@/lib/apiHandler";
import { mySchema } from "@/lib/schemas";

export const POST = apiHandler(
  async (req) => {
    const data = getValidatedBody<MySchemaType>(req);
    const result = await someService.process(data);
    return successResponse(result, 201);
  },
  { bodySchema: mySchema }
);
```

This provides automatic Zod validation, error handling, and typed responses. Use `ApiError` for controlled HTTP errors (404, 400, etc.).

### Firestore Access

All Firestore operations go through `src/lib/firestoreService.ts`:

- Uses Firebase Admin SDK exclusively (no client-side Firestore access)
- Type-safe collection mapping via `FirestoreCollectionMap`
- Automatic `createdAt`/`updatedAt` timestamp handling
- Functions: `createDoc`, `getDocById`, `getDocs`, `updateDoc`, `deleteDoc`

Document IDs:
- Users: cédula (national ID) as document ID
- OTP challenges: email as document ID
- OTP access sessions: cédula as document ID
- OTP legacy sessions: email or cédula depending on legacy record shape
- Minors: idNumber as document ID (denormalized index)
- Consents: auto-generated ID with atomic consecutivo number

### Authentication

**Kiosk Flow (Visitors):**
1. User enters cédula at `/ingreso`
2. OTP sent to email via `/api/otp`
3. User validates OTP at `/otp`
4. Pending challenge state is stored in `otp_challenges` (request, retry, and lock metadata)
5. Validated kiosk access is stored in `otp_access_sessions` (2 hour validity)
6. Zustand store persists state to localStorage for session recovery

`otp_sessions` remains only as a deprecated transitional/legacy compatibility collection. New kiosk flows should read/write the split model first.

**Admin Flow:**
- Firebase Authentication with Custom Claims for RBAC
- Roles stored in JWT claims (source of truth), not Firestore
- Middleware at `src/lib/api-middleware.ts` protects admin API routes
- Context at `src/contexts/AuthContext.tsx` provides auth state to components

### Route Groups

- `(kiosk)/` - Public kiosk flow (ingreso, otp, registro, consentimiento)
- `(admin)/` - Admin panel with protected sub-routes
  - `admin/login` - Login page
  - `admin/(protected)/` - Protected dashboard and management pages

### State Management

- **Kiosk flow**: Zustand store at `src/store/kioskStore.ts` with localStorage persistence
- **Admin auth**: React Context at `src/contexts/AuthContext.tsx`
- **Server data**: SWR for data fetching (used in admin components)

### Validation

Zod schemas are in `src/lib/schemas/`:
- `auth.schema.ts` - OTP and authentication schemas
- `consent.schema.ts` - Consent form and creation schemas
- `visitor.schema.ts` - User/visitor data schemas
- `crud.schema.ts` - Generic CRUD operation schemas

## Key Conventions

### File Organization

- Use `@/` alias for imports from `src/`
- Types in `src/types/` (firestore.ts for DB types, auth.ts for RBAC types)
- Utils in `src/lib/utils/` (dateUtils, formatters, etc.)
- UI components in `src/components/ui/` (reusable primitives)
- Feature components in `src/components/kiosk/` and `src/components/admin/`

### Repo Hygiene

- `src/`, `public/`, `tests/`, and runtime config files are the primary app surface; update them when behavior, UI, or runtime wiring changes.
- `.github/` holds CI, automation, and agent instructions; touch it when workflow, review, or repository policy guidance changes.
- `.claude/` and `.atl/` are AI/engineering workflow support directories; update them only when the task is explicitly about agent behavior, planning artifacts, or repo guidance.
- `diagramas/` and `postman/` are reference/support assets; update them when architecture flows, API contracts, or operational collections materially change.

### Code Style (Biome)

- Formatter disabled (use Biome's check:format)
- Single quotes, no semicolons (enforced by Biome)
- `useConst` rule disabled - allow `let` when needed
- Unused imports are errors

### Environment Variables

Required in `.env.local`:

```
# Firebase Admin (server)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Email
RESEND_API_KEY=re_...

# Admin Auth
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_JWT_SECRET=
```

Note: `FIREBASE_PRIVATE_KEY` must have `\n` characters for newlines.

### Database Collections

| Collection | Purpose | ID Format |
|------------|---------|-----------|
| `users` | Adult visitor profiles | cédula (string) |
| `consents` | Signed consent forms | autoID |
| `otp_challenges` | Pending OTP challenge state | email (string) |
| `otp_access_sessions` | Validated kiosk access sessions | cédula (string) |
| `otp_sessions` | Legacy mixed OTP records (deprecated/transitional) | email or cédula (legacy) |
| `minors_index` | Denormalized minor records | idNumber (string) |
| `accesses` | Entry/exit logs | autoID |

## Important Implementation Details

### Consent Creation Flow

When creating a consent at `/api/consentimientos`:

1. Verify OTP session is valid via `verifyOtpSession()`
2. Get atomic consecutivo number via transaction on `_counters/consents`
3. Upload signature to Firebase Storage
4. Create consent document with snapshots of user and minor data (denormalized)
5. Generate and attach PDF via email

### OTP Session Management

- OTP codes expire in 60 minutes
- Validated sessions expire in 120 minutes
- Pending OTP challenge metadata lives in `otp_challenges`
- Validated kiosk access sessions live in `otp_access_sessions` with userId (cédula) as document ID
- Reusing an OTP is allowed until it expires
- `otp_sessions` is legacy compatibility only and should not be the baseline for new flows

### Minor Data Architecture

Minors exist in two places:
1. Embedded in `users` document (parent's record)
2. Denormalized in `minors_index` collection for efficient querying

The `minors_index` collection allows searching minors without loading all users.

### PDF Generation

PDFs are generated on-demand via `/api/admin/consents/[id]/pdf`:
- Uses pdf-lib for server-side PDF generation
- Embeds signature image from Firebase Storage
- Returns buffer for download (not stored)

## Testing & Quality

- **Knip**: Detects unused exports and dependencies
- **jscpd**: Detects code duplication (threshold: 5%)
- **dependency-cruiser**: Detects circular dependencies
- **Biome**: Linting and formatting
- **Practical verification**: `bun test` for test suites and `bun run check:types` for fast type-safety validation

Run `bun run check` before committing.

## Deployment

Configured for Vercel:
- Build command: `bun run build`
- Install command: `bun install`
- Requires all environment variables set in Vercel dashboard

Firebase rules deploy separately:
```bash
firebase deploy --only firestore:rules,storage:rules
```
