# Deploy & CI Reference

> **Status**: current
> **Audit date**: 2026-05-24
> **Diátaxis**: Reference
> **Linked sources**: `.github/workflows/ci.yml`, `.github/workflows/lighthouse.yml`, `lighthouserc.json`, `firebase.json`, `.env.example`, `package.json`, `next.config.ts`

Operational reference for the Vercel deployment model, Firebase deploy surface, CI pipeline jobs and checks, Lighthouse performance/SEO/accessibility gates, and day-to-day operational notes.

## 1. Overview

The Jumping Park app is deployed as a **Next.js 16** application on **Vercel** (primary hosting) with **Firebase** as the backend infrastructure layer. Every push to `main` and every pull request triggers automated CI quality gates. A separate Lighthouse workflow runs on PRs to enforce performance, SEO, accessibility, and best-practices budgets.

| Surface | Role | Configuration |
|---|---|---|
| **Vercel** | Next.js hosting, preview deployments, production domain | Vercel dashboard (project settings) |
| **Firebase** | Firestore database, Firebase Auth, Storage (signatures) | `firebase.json` |
| **GitHub Actions** | CI quality gates, Lighthouse audits, dependency scans | `.github/workflows/ci.yml`, `.github/workflows/lighthouse.yml` |

## 2. Vercel Deployment Model

The project uses Vercel's Git-integrated deployment model:

| Trigger | Behavior |
|---|---|
| **Push to `main`** | Production deployment to the primary domain |
| **Pull request (open / sync / reopen)** | Preview deployment with unique URL; Lighthouse audit runs against preview |
| **Dashboard redeploy** | Manual redeploy available via Vercel dashboard for env var changes |

### Build Pipeline

Vercel runs `next build` (`bun run build`) as the build command. The `next.config.ts` includes:
- `@next/bundle-analyzer` — enabled via `ANALYZE=true` env var (opt-in, not on by default)
- Image optimization with WebP/AVIF formats and quality presets from `src/lib/imageOptimization.ts`
- `esbuild-wasm` as a server external package (`serverExternalPackages`)

The build verification job in CI (`ci.yml` → `build-verification`) mirrors this by running `bun run build` after quality gates pass, ensuring the production build compiles cleanly before merge.

### Environment Variables

All runtime configuration flows through environment variables. See `.env.example` for the full reference. Key deployment-relevant variables:

| Variable | Scope | Notes |
|---|---|---|
| `ADMIN_JWT_SECRET` | Server | Generated per-deploy; 32+ random hex chars |
| `OTP_HARDENING_ENABLED` | Server | Toggles OTP hardening (`true` / `false`) |
| `PUBLIC_SEO_ENABLED` | Server | Toggles public SEO surface (`true` / `false`) |
| `NEXT_PUBLIC_*` prefixed vars | Client | Exposed to browser bundle; never include secrets here |
| `RESEND_API_KEY` | Server | Email delivery via Resend (`re_*` format) |

**Secret management**: Vercel dashboard stores production secrets. CI workflows generate ephemeral admin secrets via `openssl rand -hex 32`, generate an RSA key pair for `FIREBASE_PRIVATE_KEY`, and use fixed placeholder values such as `re_ci_placeholder` for `RESEND_API_KEY`. Never commit real secrets to the repository.

After changing any flag (`OTP_*`, `*_ENABLED`), redeploy via Vercel dashboard or push to `main` to apply. Flag changes require a full rebuild — they are not hot-reloaded at runtime.

## 3. Firebase Deploy Surface

The Firebase surface is configured in `firebase.json` and deployed separately from the Next.js application:

| Service | Rules File | Indexes File | Deploy Command |
|---|---|---|---|
| **Firestore** | `firebase/firestore.rules` | `firebase/firestore.indexes.json` | `firebase deploy --only firestore` |
| **Storage** | `firebase/storage.rules` | — | `firebase deploy --only storage` |

Firebase Hosting is defined in `firebase.json` (public directory: `public/`) but the primary web hosting is handled by Vercel. Firebase Hosting serves static assets from the `public/` directory only.

For detailed Firestore collection schemas, security rules access matrix, composite indexes, and auth/OTP flow, see `docs/reference/firebase.md`.

### Deploy Commands

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Deploy all Firebase services
firebase deploy
```

Firebase CLI authentication is required before any deploy. Admin SDK credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are configured via `.env.example` and stored in Vercel dashboard for production.

## 4. CI Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml` and runs on every push to `main`/`master` and on every pull request. It uses **Bun** as the package manager and runtime.

### Job Graph

```
push / PR
  ├── quality          (format, lint, types, tests)
  ├── dependency-audit (bun audit)
  └── build-verification (next build) — depends on quality + dependency-audit
```

### Quality Job (`quality`)

Executes on `ubuntu-latest` with `timeout-minutes: 20`. Uses `concurrency` with `cancel-in-progress: true` to cancel redundant runs.

**Steps**:
1. Checkout (`actions/checkout@v4`)
2. Setup Bun (`oven-sh/setup-bun@v2`, latest version)
3. Install dependencies (`bun install --frozen-lockfile`)
4. Prepare CI secrets (ephemeral `ADMIN_JWT_SECRET` and `ADMIN_SECRET_KEY` via `openssl`, fixed placeholder `RESEND_API_KEY`)
5. Run static quality checks (`bun run check`)

The `bun run check` command composes (`package.json`):
```
check:format → check:lint → check:types → audit
```

| Check | Tool | What It Verifies |
|---|---|---|
| `check:format` | Biome (`biome check --formatter-enabled`) | Code formatting in `src/` |
| `check:lint` | Biome (`biome lint src/`) | Lint rules in `src/` |
| `check:types` | TypeScript (`tsc --noEmit`) | Full type-check, no emit |
| `audit` | Knip + jscpd + dependency-cruiser | Dead code, duplicate code, circular deps |

6. Run tests (`bun test`) — all Bun test suites

### Dependency Audit Job (`dependency-audit`)

Runs `bun audit` against the installed dependency tree:
- **Blocking**: direct dependency vulnerabilities fail the job
- **Non-blocking**: transitive/tooling vulnerabilities are noted but do not block (see `docs/runbooks/dependency-risk-note.md`)
- Results are written to the GitHub step summary

### Build Verification Job (`build-verification`)

Depends on both `quality` and `dependency-audit` passing. Runs `bun run build` (Next.js production build) with CI placeholder Firebase config and ephemeral admin credentials. Proves the app compiles cleanly before merge.

### Concurrency and Timeouts

| Setting | Value |
|---|---|
| **Concurrency group** | `ci-${{ github.workflow }}-${{ github.ref }}` |
| **Cancel in progress** | `true` (redundant CI runs are cancelled) |
| **Quality timeout** | 20 minutes |
| **Dependency audit timeout** | 15 minutes |
| **Build verification timeout** | 20 minutes |

## 5. Lighthouse Gates

The Lighthouse workflow (`.github/workflows/lighthouse.yml`) runs on every pull request (`opened`, `synchronize`, `reopened`). It uses `@lhci/cli` with the configuration in `lighthouserc.json`.

### Audit Target

The audit runs against the **public consent page** at `/consentimiento-digital` (route: `consentimiento-digital`). The Lighthouse CI server is started via `bun run start -- --hostname 127.0.0.1 --port 3000` and the audit waits for the `Ready in` pattern in server output. The audit collects **3 runs** and uses the median score.

### Budget Thresholds

| Category | Minimum Score | Threshold Type |
|---|---|---|
| **Performance** | 0.8 (80) | `error` (blocks merge) |
| **Accessibility** | 0.9 (90) | `error` (blocks merge) |
| **Best Practices** | 0.9 (90) | `error` (blocks merge) |
| **SEO** | 0.9 (90) | `error` (blocks merge) |

### Core Web Vital Thresholds

| Metric | Maximum Value | Notes |
|---|---|---|
| **Largest Contentful Paint (LCP)** | 3800 ms | Must be under 3.8 seconds |
| **Total Blocking Time (TBT)** | 300 ms | Main thread blocking budget |
| **Cumulative Layout Shift (CLS)** | 0.1 | Visual stability budget |

### Report Artifacts

Lighthouse reports are uploaded as workflow artifacts (`lighthouse-reports` from `.lighthouseci/`) on every run, including failures (`if: always()`). They are stored in `temporary-public-storage` via the LHCI upload target.

### CI Placeholder Values

Both CI and Lighthouse workflows use deterministic placeholder values for Firebase config and secrets:

| Variable | Placeholder |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `ci-placeholder` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ci-placeholder` |
| `ADMIN_JWT_SECRET` | `openssl rand -hex 32` (generated per run) |
| `RESEND_API_KEY` | `re_ci_placeholder` |
| `FIREBASE_PRIVATE_KEY` | RSA 2048-bit key pair (generated per run) |

These placeholders ensure the build succeeds in CI without exposing production secrets.

## 6. Operational Notes

### Local Development

```bash
bun dev          # Start Next.js dev server (hot reload)
bun run build    # Production build
bun run start    # Start production server
```

The dev server runs on `http://localhost:3000` by default. Firebase emulators can be used locally via `FIRESTORE_EMULATOR_HOST` in `.env`.

### Quality Checks (pre-commit / pre-push)

```bash
bun run check          # Full quality suite (format + lint + types + audit)
bun run check:format   # Biome formatting only
bun run check:lint     # Biome lint only
bun run check:types    # TypeScript type-check only
bun run check:phase5   # SEO + offline resilience + a11y smoke tests
bun run audit          # Dead code + duplicate code + circular deps
```

### Test Commands

```bash
bun test                                    # All Bun test suites
bun run test:a11y:e2e                      # Playwright a11y E2E tests
bun test tests/seo-public.test.ts          # Specific test file
```

### Database Scripts

```bash
bun run seed                    # Seed demo database
bun run set-admin              # Set admin role for a user
bun run migrate:minors         # Migrate minors data
bun run migrate:search-tokens  # Migrate search tokens
bun run backup                 # Database backup script
```

### Flag Toggle Deployment

Runtime flags (`.env.example` lines 22-34) control feature rollouts:

| Flag | Default | Effect |
|---|---|---|
| `OTP_HARDENING_ENABLED` | `true` | Hardened OTP validation |
| `PUBLIC_SEO_ENABLED` | `false` | Public SEO surface (`/consentimiento-digital`, `robots.ts`, `sitemap.ts`) |
| `EXPORT_BOUNDS_ENFORCED` | `true` | Export bounds enforcement |
| `ADMIN_SESSION_MODE` | `dual` | Admin session mode (`dual` → JWT + session cookie) |

After changing any flag, redeploy via Vercel dashboard or push to `main`. Flag changes require a local server restart (`bun dev`) or full redeploy.

### Merge Requirements

A PR can be merged only when:
1. **CI `quality`** passes (format, lint, types, tests)
2. **CI `dependency-audit`** passes (no direct dependency vulnerabilities)
3. **CI `build-verification`** passes (production build compiles)
4. **Lighthouse** passes all four category thresholds (perf ≥0.8, a11y ≥0.9, best-practices ≥0.9, seo ≥0.9)

The Lighthouse workflow is not configured as a required status check in branch protection by default — it runs on every PR but the merge gate depends on repository settings.

### Troubleshooting

| Symptom | Likely Cause | Action |
|---|---|---|
| CI `quality` fails on `check:types` | Type error in changed files | Run `bun run check:types` locally |
| CI `build-verification` fails | Build error with CI placeholders | Verify `next.config.ts` doesn't depend on real Firebase at build time |
| Lighthouse fails on performance | Heavy client bundle or blocking resources | Run `ANALYZE=true bun run build` for bundle analysis |
| Lighthouse fails on SEO | Missing meta tags or structured data | Check `src/app/(public)/consentimiento-digital/page.tsx` |
| Firebase deploy fails | CLI not authenticated or rules syntax error | Run `firebase login` then `firebase deploy --only firestore` |

## 7. Traceability

| Claim | Source | Verification |
|---|---|---|
| CI has 3 jobs (quality, dependency-audit, build-verification) | `.github/workflows/ci.yml` | `grep '^\s\+\w\+:' .github/workflows/ci.yml` |
| Lighthouse runs on PR open/sync/reopen | `.github/workflows/lighthouse.yml` | Direct file inspection |
| Lighthouse perf threshold is 0.8 | `lighthouserc.json` (`categories:performance[1].minScore`) | `jq '.ci.assert.assertions["categories:performance"][1].minScore'` |
| `bun run check` composes format+lint+types+audit | `package.json` (`scripts.check`) | `grep '"check"' package.json` |
| `check:phase5` runs SEO + offline + a11y tests | `package.json` (`scripts["check:phase5"]`) | Direct inspection |
| Firebase deploy surface is firestore + storage | `firebase.json` | Direct file inspection |
| All env vars are documented in `.env.example` | `.env.example` | `grep -c '=' .env.example` |
| Next.js build uses `@next/bundle-analyzer` | `next.config.ts` | `grep 'bundleAnalyzer' next.config.ts` |
