# Deployment guide

This guide explains the lowest-risk path to deploy Jumping Park today: Vercel runs the Next.js app, while Firebase remains the backing platform for Auth, Firestore, Storage, indexes, and rules. Use it when you need one truthful release path that covers infra order, environment variables, and the first post-deploy verification pass.

## Quick path

1. Run `bun run check`, `bun test`, and `bun run build` locally.
2. Deploy Firebase config from the repository: indexes, Firestore rules, and Storage rules.
3. Configure Vercel with the required runtime env vars plus explicit rollout-flag values.
4. Deploy the app on Vercel with `bun install` and `bun run build`.
5. Verify `/`, `/consentimiento-digital`, and `/admin/login`, then enable non-default rollout flags only after the corresponding runbook passes.

## Deployment split

| Surface | Platform | What lives there |
| --- | --- | --- |
| Next.js runtime | Vercel | App Router pages, route handlers, admin API, public SEO surface, kiosk flow |
| Auth + database + files | Firebase | Auth, Firestore, Storage, composite indexes, and security rules |
| Email delivery | Resend | OTP and consent-related email delivery |
| Release verification | Local + CI | Bun checks/tests/build locally, then the same quality/build gates in GitHub Actions |

The current `.firebaserc` default project is `jumping-park-consents`. If you deploy to a different Firebase project, update `.firebaserc` or pass an explicit `--project` value to the Firebase CLI command you run.

## Before you deploy

- You need a Vercel project connected to this repository.
- You need a Firebase project with Auth, Firestore, and Storage enabled.
- You need real Firebase app credentials and a Firebase Admin service account.
- You need a Resend API key if OTP emails must work in the target environment.
- Keep release evidence honest: run the repository gates before touching production config.

Minimum preflight:

```bash
bun run check
bun test
bun run build
```

## Firebase preparation

### 1. Confirm the tracked Firebase config

The repository already tracks the Firebase files that matter for rollout parity:

- `firebase/firestore.indexes.json`
- `firebase/firestore.rules`
- `firebase/storage.rules`
- `firebase.json`

Do not enable `ADMIN_AGGREGATES_ENABLED`, `CURSOR_PAGINATION_ENABLED`, `OFFLINE_QUEUE_ENABLED`, or `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` until those tracked files are deployed and verified.

### 2. Deploy indexes and rules first

This repo does not wrap Firebase CLI in a package script, so the Bun-friendly path is to use `bunx firebase-tools`.

```bash
bunx firebase-tools deploy --only firestore:indexes
bunx firebase-tools deploy --only firestore:rules
bunx firebase-tools deploy --only storage
```

If you already have the Firebase CLI installed globally, the same commands can be run with `firebase` instead of `bunx firebase-tools`.

### 3. Gather the real Firebase values

You need two groups of values:

| Group | Variables | Source |
| --- | --- | --- |
| Firebase Admin SDK | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET` | Firebase service account + project settings |
| Firebase browser SDK | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app config |

Important detail: `src/lib/firebaseAdmin.ts` converts escaped newlines with `privateKeyRaw.replace(/\\n/g, "\n")`. Store `FIREBASE_PRIVATE_KEY` as the raw PEM content from Firebase so the runtime can reconstruct the multiline key correctly.

Use the real bucket name that Firebase gives you. The repo contains placeholder examples in multiple places, and CI uses synthetic values only to prove buildability.

## Vercel environment configuration

Start from `.env.example`, then make the production/preview values explicit in Vercel instead of relying on runtime defaults.

### Required runtime values

| Variable | Why it matters |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Server-side Firebase Admin project wiring |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account identity |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key |
| `FIREBASE_STORAGE_BUCKET` | Signature/file bucket wiring |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser Firebase bootstrap |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser Firebase project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser Storage bucket config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser Firebase app wiring |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser Firebase app wiring |
| `RESEND_API_KEY` | OTP and consent-related email delivery |
| `ADMIN_JWT_SECRET` | Required for admin sessions |

### Session, timing, and setup values

| Variable | Recommended deployment value | Notes |
| --- | --- | --- |
| `ADMIN_SESSION_MODE` | `dual` | Matches the current documented/admin-tested path |
| `ADMIN_IDLE_TIMEOUT_MINUTES` | `30` | Current repo default and CI value |
| `OTP_EXPIRATION_MINUTES` | `60` | Invalid or missing values fall back in code |
| `OTP_SESSION_DURATION_MINUTES` | `120` | Invalid or missing values fall back in code |
| `OTP_LOCKOUT_MINUTES` | `15` | Current backend lockout window |
| `ALLOW_ADMIN_SETUP` | `false` | Keep the setup endpoint closed in preview/production by default |
| `ADMIN_SECRET_KEY` | unset unless you intentionally open setup | Only needed if you temporarily allow `/api/admin/set-admin` |
| `ANALYZE` | `false` | Optional bundle analysis toggle |

### Rollout flags

Set these explicitly in Vercel so deploy behavior is reviewable:

| Variable | Safe starting value | Why |
| --- | --- | --- |
| `OTP_HARDENING_ENABLED` | `true` | Keep OTP throttling and lockouts active |
| `EXPORT_BOUNDS_ENFORCED` | `true` | Keep wide export protections active |
| `PUBLIC_SEO_ENABLED` | `false` until public validation passes | Runtime defaults are secure, but the public route should only open after `docs/runbooks/seo-ai-seo-validation-checklist.md` passes on a real deployment |
| `CURSOR_PAGINATION_ENABLED` | `false` | Enable later only after Firebase index parity is confirmed |
| `ADMIN_AGGREGATES_ENABLED` | `false` | Enable later only after read-model/IaC validation |
| `OFFLINE_QUEUE_ENABLED` | `false` | Keep disabled until the replay drill is intentionally run |
| `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED` | `false` | Keep aligned with `OFFLINE_QUEUE_ENABLED` |
| `CSP_REPORT_ONLY_ENABLED` | `false` | Enable only when you are actively observing the canary CSP |

## Vercel project settings and deploy

Use these Vercel project settings for the active repo workflow:

| Setting | Value |
| --- | --- |
| Framework preset | `Next.js` |
| Install command | `bun install` |
| Build command | `bun run build` |
| Output directory | `.next` |
| Root directory | project root |

Recommended release flow:

1. Add or update the environment variables in the target Vercel environment.
2. Trigger a fresh deploy.
3. Wait for the deploy to finish before checking public/admin routes.
4. If you changed Firebase indexes or rules, validate those before turning on rollout flags that depend on them.

## Post-deploy verification

Check the happy path first:

- `/` loads the kiosk landing route.
- `/consentimiento-digital` loads the public explainer route.
- `/admin/login` renders without missing-env failures.
- OTP mail delivery works with the real `RESEND_API_KEY`.

Then verify the deployment boundaries that can hurt you later:

- If `PUBLIC_SEO_ENABLED=true`, run `docs/runbooks/seo-ai-seo-validation-checklist.md`.
- If `CURSOR_PAGINATION_ENABLED=true` or `ADMIN_AGGREGATES_ENABLED=true`, run `docs/runbooks/admin-cost-smoke-checklist.md`.
- If `OFFLINE_QUEUE_ENABLED=true` and `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=true`, run `docs/runbooks/offline-replay-drill.md`.
- Keep rollback steps ready in `docs/runbooks/rollback-flags.md`.
- Use `docs/runbooks/production-hardening.md` as the release hub for the final smoke pack.

### Post-deploy admin bootstrap

Preferred path: create the user in Firebase Auth first, then assign the role with the local Bun script:

```bash
bun run set-admin <email> admin
```

The user must already exist in Firebase Auth, and the user must sign out and sign back in after the claim update.

For operator scripts such as `bun run set-admin` or `bun run seed`, you can use `FIREBASE_SERVICE_ACCOUNT_KEY` locally as a full service-account JSON blob instead of exporting the individual Firebase Admin variables one by one.

## Next step

- Use `docs/guides/testing.md` for the quality-gate map before future releases.
- Use `docs/runbooks/production-hardening.md` when the deployment becomes a real release decision instead of a simple environment push.
