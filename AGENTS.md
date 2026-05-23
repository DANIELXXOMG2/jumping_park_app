# Code Review Rules

## General
- Use Bun-based workflows and commands.
- Keep changes truthful to current implementation.
- Prefer small, focused commits.

## TypeScript
- Keep TypeScript strict.
- Do not introduce `any`.
- Reuse shared types and schemas.
- No `as` casts — prefer type guards or Zod `.parse()`.
- Colocate Zod schemas with the domain they validate (`src/lib/schemas/`).

## Zod
- Schemas in `src/lib/schemas/` — shared between client and server.
- Never use `z.any()` — always narrow to the expected shape.
- Prefer `.parse()` over `.safeParse()` when the caller must handle the error.
- One schema file per domain: auth, visitor, consent, crud, legalContent.

## Next.js / React
- Keep route handlers thin and service-driven.
- Prefer server-safe configuration handling.
- Preserve accessibility behavior in kiosk/admin flows.
- Default to Server Components — `"use client"` only at leaf boundaries.
- No `useMemo`/`useCallback` boilerplate (React 19 Compiler).
- Validate API route input with Zod at the top of each handler.

## Tailwind v4
- Merge classes with `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- Import Tailwind via `@import "tailwindcss"` in `globals.css` — v4 syntax.
- No inline `style={}` when Tailwind utilities cover the same effect.
- Design tokens live as CSS variables in `globals.css`.

## Zustand
- One store per domain boundary (`useKioskStore`).
- All mutations go through store actions — never mutate state outside.
- Use `set((state) => ({ ... }))` for derived updates.

## SWR
- Derive stable keys from route + params — no anonymous inline strings.
- Call `mutate(key)` after write operations to invalidate caches.
- Prefer `useSWR` over bare `fetch()` — dedup, revalidation, error boundary.

## Firebase
- Client SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`): `"use client"` modules only.
- Admin SDK (`firebase-admin`): server routes and scripts only — never in client bundles.
- `NEXT_PUBLIC_` prefix only for client-safe config keys.
- Never hardcode credentials — all values from environment variables.

## react-hook-form
- Always pair `useForm` with `zodResolver(schema)` for type-safe validation.
- Form schemas must match API-side Zod schemas — no drift.
- Use `useFieldArray` for dynamic lists — no manual index management.

## framer-motion
- Motion components are client-only — wrap in `"use client"`.
- Use `whileInView` with `once: true` for scroll-triggered reveals.
- Respect `prefers-reduced-motion` — provide a static fallback.
- Use `AnimatePresence` for enter/exit transitions on conditional rendering.

## Resend
- Templates live in `src/components/emails/` — isolated from app logic.
- Never embed secrets, API keys, or tokenized URLs in templates.
- One Resend singleton per process (`src/services/emailService.ts`).

## Playwright
- Tests in `playwright/` with `*.a11y.ts` naming — run via `bun test`.
- Every page interaction test includes an Axe check (`new AxeBuilder({ page }).analyze()`).
- Locator-based waits only (`toBeVisible`, `toBeHidden`) — no `page.waitForTimeout()`.
- Test isolation: each test seeds its own state, no cross-test dependencies.

## Biome
- Defer to `biome.json` — no duplicate lint config in `.eslintrc` or inline.
- Key rules: `noUnusedImports: error`, `noUnusedVariables: warn`, `useExhaustiveDependencies: warn`.
- Run `bun biome check` pre-commit — blocked on `error` severity.

## Commit Conventions
- Conventional Commits: `type(scope): description` (e.g., `feat(kiosk): add session restore`).
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.
- English, lowercase, imperative mood.
- One logical work unit per commit.

## Repository Hygiene
- Do not commit secrets or local-only artifacts.
- Keep docs aligned with the implementation they describe.
