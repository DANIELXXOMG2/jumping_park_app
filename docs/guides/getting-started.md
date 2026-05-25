# Getting started

> **Status**: current
> **Diátaxis**: Tutorial
> **Audit date**: 2026-05-24

This guide gets a contributor from clone to a real local walkthrough of the active Jumping Park surfaces. Use it when you need the shortest truthful path to install dependencies, configure the required services, boot the app, and verify that the public, kiosk, and admin entrypoints respond.

## Quick path

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env.local` with `cp .env.example .env.local` and fill the Firebase, Resend, and admin-session values.
3. Start the app with `bun dev`.
4. Open `http://localhost:3000/`, `http://localhost:3000/consentimiento-digital`, and `http://localhost:3000/admin/login`.
5. Run `bun test` and `bun run check:types` before you hand the slice to someone else.

## Before you start

- **Runtime**: Bun is the package manager, script runner, and test runner for this repository.
- **Framework**: The app runs on Next.js 16 + React 19.
- **Required services**: Firebase (Auth + Firestore + Storage) and Resend.
- **Admin testing**: If you want to log into the admin surface, create the user in Firebase Auth first.
- **Current UI reality**: The documentation canon is English, but many in-app labels and flows still render Spanish copy. That is current implementation, not a docs bug.

## Local setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill the required values from your Firebase project, Resend account, and local admin-session policy:

| Variable | Why it matters |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Server-side Firebase Admin bootstrap. |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account identity. |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key (`\n` must stay escaped inside `.env.local`). |
| `FIREBASE_STORAGE_BUCKET` | Signature and PDF storage bucket. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser Firebase bootstrap for auth-enabled surfaces. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain for browser sign-in flows. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser-visible Firebase project identifier. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser-visible storage bucket configuration. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser Firebase app wiring. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser Firebase app wiring. |
| `RESEND_API_KEY` | Email delivery for OTP and consent-related mail flows. |
| `ADMIN_JWT_SECRET` | Protects the admin session cookie/bearer flow. |

Recommended explicit local defaults already shown in `.env.example`:

- `ADMIN_SESSION_MODE=dual`
- `ADMIN_IDLE_TIMEOUT_MINUTES=30`
- `OTP_EXPIRATION_MINUTES=60`
- `OTP_SESSION_DURATION_MINUTES=120`
- `OTP_LOCKOUT_MINUTES=15`
- `OTP_HARDENING_ENABLED=true`
- `EXPORT_BOUNDS_ENFORCED=true`
- `PUBLIC_SEO_ENABLED=false`

Optional local-only helpers:

- `ALLOW_ADMIN_SETUP=false`
- `ADMIN_SECRET_KEY=`
- `FIRESTORE_EMULATOR_HOST=`
- `FIREBASE_SERVICE_ACCOUNT_KEY=`

Restart `bun dev` after any env or flag change.

### 3. Start the application

```bash
bun dev
```

The default local entrypoint is `http://localhost:3000/`.

## First-run walkthrough

### 1. Check the public route

Open `http://localhost:3000/consentimiento-digital`.

You should see the public SEO/AI-SEO surface that explains the consent flow before a visitor arrives at the park. This is the shareable public route, not the admin or kiosk UI.

### 2. Check the kiosk route

Open `http://localhost:3000/`.

This is the kiosk landing surface. From there, the visitor flow continues into `/ingreso`, `/otp`, `/registro`, `/consentimiento`, and `/exito`. The full OTP flow requires working Firebase + Resend configuration because the app sends and validates real access codes.

### 3. Check the admin route

Open `http://localhost:3000/admin/login`.

If you need a local admin account:

1. Create or reuse a user in Firebase Auth.
2. Run `bun run set-admin <email> admin`.
3. Sign out and sign back in after the claim update.

The target user must already exist in Firebase Auth.

### 4. Know the first-run boundaries

- The root route can redirect an already-authenticated admin to `/admin/usuarios`.
- The admin surface depends on Firebase Auth plus the custom-claim role assignment.
- Kiosk and public routes are safe first checks when you only want to validate boot + routing.

## Verification

Run the smallest useful checks after the first boot:

```bash
bun test
bun run check:types
```

Use this checklist before you call the local setup healthy:

- [ ] `bun dev` starts without missing-env crashes.
- [ ] `http://localhost:3000/` loads the kiosk landing page.
- [ ] `http://localhost:3000/consentimiento-digital` loads the public explainer route.
- [ ] `http://localhost:3000/admin/login` renders the admin login screen.

## Next step

- Read `docs/runbooks/production-hardening.md` for the operational validation path.
- Read `docs/runbooks/rollback-flags.md` before enabling or disabling rollout flags.
- Read `CONTRIBUTING.md` for the current quality-gate map before opening a PR.
