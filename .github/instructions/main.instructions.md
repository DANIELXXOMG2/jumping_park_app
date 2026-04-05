# Jumping Park Engineering Baseline

## Quality Gates
- Use Bun commands only in examples and runbooks.
- Default validation gate is `bun run check` before merge or handoff.
- Use `bun run check:types` for fast iteration when you only need type safety.
- Use `bun test` when behavior changes or when touching code with existing coverage.
- Do not treat formatting-only success as sufficient if types or tests are still unverified.

## API and Service Patterns
- Keep `route.ts` handlers thin: validate with `apiHandler`, parse with the shared schema helpers, and delegate business rules to `src/services/`.
- Keep Firestore access inside `src/lib/firestoreService.ts`; do not scatter direct collection calls across routes or UI code.
- Prefer additive, typed contracts over ad-hoc response shapes.
- When documenting or extending OTP flows, treat `otp_challenges` as pending challenge state and `otp_access_sessions` as validated kiosk access; `otp_sessions` is legacy compatibility only.

## Typing and Frontend Reuse
- Keep TypeScript strict: avoid `any`, avoid unsafe casts, and reuse shared domain types from `src/types/`.
- Reuse schemas, utilities, and shared UI primitives before creating parallel implementations.
- Do not duplicate admin/kiosk UI logic when a shared component, hook, or service can own the behavior.
- Keep presentational concerns in components and business/data rules in services, hooks, or shared libs.

## Directory Relevance / Ignore Rules
- Source-of-truth app code lives in `src/`, `public/`, `tests/`, and root runtime config files such as `package.json`, `next.config.ts`, `firebase.json`, and `tsconfig.json`.
- Infra and tooling folders such as `.github/`, `.claude/`, `.atl/`, `openspec/`, and root editor/tool configs should not be modified unless the task explicitly changes workflow, automation, planning artifacts, or agent guidance.
- `diagramas/` is reference material for architecture and flow documentation; update it only when the underlying system design or operational flow materially changes.
- `postman/` is contract/support material for API operations; update it when request/response contracts, auth flows, or operational collections change in a way operators need to replay.
- Ignore generated or local-only folders such as `.next/`, `node_modules/`, `.playwright-mcp/`, and similar workspace artifacts unless the task is specifically about local tooling.

## Practical Working Rules
- Preserve the service-layer architecture: routes orchestrate, services own business logic, and the Firestore access layer owns persistence details.
- Match existing naming and file placement patterns before adding new abstractions.
- Keep docs and guidance aligned with the current implementation, especially for auth/session flows and repository scripts.
