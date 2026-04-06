# Design: Rollout Flags and Observability Hardening

## Technical Approach

Add a small server-only policy resolver, `src/lib/hardeningPolicy.ts`, as the single source of truth for rollout flags and hardening telemetry. OTP routes/services, admin export handlers, and SEO metadata/routes read that resolver instead of `process.env` directly. The change stays incremental: first pure policy + docs, then OTP/export wiring, then SEO wiring.

## Architecture Decisions

| Decision | Options | Choice / Rationale |
|---|---|---|
| Policy source | Inline `process.env`; shared module | Use a shared module with typed resolvers. This matches the existing service-layer pattern, keeps route handlers thin, and prevents drift between OTP, export, and SEO surfaces. |
| Telemetry transport | New vendor SDK; ad-hoc `console.*`; structured server logs + headers | Use structured `console.info`/`console.warn` plus additive response headers. This gives deterministic observability without new infra and supports curl/smoke verification. |
| OTP fallback | Leave strict logic always on; re-enable permissive branch | Add explicit strict/permissive execution modes in the request/validate orchestration helpers, without changing session creation or admin auth. This satisfies spec rollback while keeping the diff local to OTP codepaths. |

## Data Flow

```text
request -> route.ts / robots.ts / sitemap.ts / metadata
        -> hardeningPolicy.resolve()
        -> { flags, telemetry helpers, response headers }

OTP request/validate -> authService strict|permissive branch
                     -> emit hardening event
                     -> NextResponse headers

Admin export -> resolve export policy -> bounded|permissive range
             -> build CSV -> emit hardening event + export headers

SEO route/metadata -> resolve SEO policy -> allowlist|block-all robots
                   -> emit hardening event
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/lib/hardeningPolicy.ts` | Create | Typed flag parsing, secure defaults, telemetry/header helpers. |
| `src/services/authService.ts` | Modify | Add strict/permissive OTP orchestration and event emission. |
| `src/app/api/otp/route.ts` | Modify | Attach policy headers from OTP request flow. |
| `src/app/api/otp/validate/route.ts` | Modify | Attach policy headers from OTP validate flow. |
| `src/services/exportRangeService.ts` | Modify | Introduce policy-aware bounded vs permissive range resolution. |
| `src/app/api/admin/export/users/route.ts` | Modify | Use policy-aware export resolution and telemetry headers. |
| `src/app/api/admin/export/consents/route.ts` | Modify | Same as users export. |
| `src/lib/seo.ts` | Modify | Centralize SEO robots metadata builders driven by policy. |
| `src/app/robots.ts` | Modify | Return allowlist or block-all rules from shared SEO helpers. |
| `src/app/sitemap.ts` | Modify | Return public entries only when SEO is enabled. |
| `src/app/(public)/layout.tsx` | Modify | Switch to policy-driven robots metadata via `generateMetadata`. |
| `tests/auth-hardening.test.ts` | Modify | Cover flag-on/off OTP behavior and emitted headers/events. |
| `tests/operational-hardening.test.ts` | Modify | Cover policy defaults and export bypass/enforced branches. |
| `tests/seo-public.test.ts` | Modify | Cover SEO enabled/disabled across robots, sitemap, metadata. |
| `.env.example`, `README.md`, `docs/runbooks/production-hardening.md` | Modify | Document flags and rollout/rollback procedure per environment. |

## Interfaces / Contracts

```ts
const HARDENING_FLAG = {
  OTP_HARDENING: 'otp-hardening',
  EXPORT_BOUNDS: 'export-bounds',
  PUBLIC_SEO: 'public-seo',
} as const

interface HardeningPolicy {
  otpHardeningEnabled: boolean
  exportBoundsEnabled: boolean
  publicSeoEnabled: boolean
}

interface HardeningEvent {
  eventName: 'hardening.policy.evaluated'
  featureName: (typeof HARDENING_FLAG)[keyof typeof HARDENING_FLAG]
  status: 'enabled' | 'disabled' | 'defaulted'
  source: 'otp-request' | 'otp-validate' | 'admin-export-users' | 'admin-export-consents' | 'robots' | 'sitemap' | 'public-metadata'
  envKey: string
  fallbackApplied: boolean
  requestId?: string
  route?: string
  details?: Record<string, string | number | boolean>
}
```

Headers are additive, not authoritative: `X-Hardening-Policy`, `X-Hardening-Feature`, `X-Hardening-Status`. Export routes keep existing `X-Export-*` headers.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Env parsing, malformed fallback, header/event builders, SEO metadata builders | Bun tests with module re-import after env mutation. |
| Service | OTP strict vs permissive request/validate flow; export range enforced vs bypassed | Extend current dependency-injected service tests; assert no extra client churn. |
| Route/integration | OTP/export headers and SEO route outputs | Existing Bun route-style tests for `robots`, `sitemap`, and route handlers. |

## Migration / Rollout

No data migration required. Rollout order: (1) ship policy module with all flags defaulting secure-on, (2) enable OTP/export wiring in dev, then preview, (3) enable SEO wiring after smoke checks. In local/dev, flag flips require server restart. In preview/prod on Vercel, env changes require a new deployment to affect bundled route handlers and metadata. Keep `ADMIN_SESSION_MODE` untouched; the policy module may read it later, but this change does not alter admin-session behavior.

## Open Questions

- [ ] When `EXPORT_BOUNDS_ENFORCED=false`, keep the existing 5000-row Firestore query limit as a safety cap while removing date-window rejection.
