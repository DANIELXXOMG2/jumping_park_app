# Testing guide

> **Status**: current
> **Diátaxis**: How-to
> **Audit date**: 2026-05-24

This guide explains which verification layers exist in Jumping Park today, when to run them, and how they connect to CI. Use it when you need the shortest truthful path from a local code change to the same quality gates the repository enforces in automation.

## Quick path

1. Run `bun test` for the default regression pass.
2. Run `bun run check` before you hand work to review.
3. If you changed public or kiosk UI behavior, run `bun run playwright:install` once on the machine and then `bun run test:a11y:e2e`.
4. If the change can affect production build behavior, run `bun run build`.

## Testing pyramid

| Layer | What lives here today | How to run it | When to use it |
| --- | --- | --- | --- |
| Foundation — unit and contract tests | Most automated coverage lives in `tests/*.test.ts*`, including service logic, route handlers, configuration helpers, rollout policy checks, and documentation contracts such as `tests/batch1-docs-hygiene-reapply.test.ts` and `tests/docs-getting-started-guide.test.ts`. | `bun test` or `bun test tests/<file>.test.ts` | Default for almost every slice. Start here first because it is fast and already matches the repo's main test runner. |
| Middle — route and service behavior with injected dependencies | The repo exercises many multi-step behaviors inside the same Bun layer by creating `NextRequest` objects, injecting fake dependencies, and asserting real outputs (for example `tests/consent-route.test.ts` and `tests/admin-session-service.test.ts`). There is no separate `test:integration` script in this repository today. | `bun test tests/<file>.test.ts` | Use this when the behavior crosses parsing, validation, service calls, or response mapping but does not need a browser. |
| Top — browser accessibility smoke | Playwright + Axe smoke coverage lives in `playwright/accessibility.a11y.ts` and currently verifies `/consentimiento-digital`, `/ingreso`, the kiosk home, `/offline`, `/admin/login`, the kiosk consent dialog flow, and the `/registro` form when it renders. | `bun run test:a11y:e2e` | Use this when you touch rendering, keyboard flow, hydration stability, or accessibility-sensitive UI. |

The pyramid is intentionally bottom-heavy today: Bun tests carry most regression coverage, and browser automation is still a focused smoke layer rather than a full end-to-end matrix.

## Tooling map

| Need | Command | Notes |
| --- | --- | --- |
| Run the default automated regression pass | `bun test` | This is the canonical test command from `package.json`. |
| Run one file during TDD or slice verification | `bun test tests/<file>.test.ts` | Fastest loop for docs contracts, services, and route handlers. |
| Get a coverage snapshot | `bun test --coverage` | Useful when you add new logic and want a quick signal about untested branches. |
| Run all static quality gates together | `bun run check` | Expands to `check:format && check:lint && check:types && audit`. |
| Inspect the format gate directly | `bun run check:format` | Non-mutating formatter verification via Biome (`biome check src/`). |
| Inspect the lint gate directly | `bun run check:lint` | Biome lint over `src/`. |
| Inspect the type gate directly | `bun run check:types` | `tsc --noEmit`. |
| Inspect repository audits directly | `bun run audit` | Runs dead-code, duplicate-code, and circular-dependency checks. |
| Install Playwright browsers on a fresh machine | `bun run playwright:install` | Needed before the first local browser smoke run. |
| Run the browser accessibility smoke suite | `bun run test:a11y:e2e` | Uses `playwright.config.ts`, starts `bun dev`, and targets `playwright/*.a11y.ts`. |
| Match CI build verification locally | `bun run build` | Good follow-up when the change can affect Next.js build output or env wiring. |

## CI integration

### Main CI workflow

`.github/workflows/ci.yml` is the primary automation entrypoint for pushes to `main`/`master` and for pull requests.

| Job | What it does | Why it matters locally |
| --- | --- | --- |
| `quality` | Runs `bun install --frozen-lockfile`, prepares placeholder secrets/env values, then runs `bun run check` and `bun test`. | Your local minimum parity path is `bun run check` + `bun test`. |
| `dependency-audit` | Runs `bun audit` and only blocks when the report includes a direct runtime dependency vulnerability. | If audit noise appears locally, distinguish direct dependency risk from tooling/transitive noise before escalating it. |
| `build-verification` | Waits for quality + audit to pass, injects build placeholders, then runs `bun run build`. | Run a local build when you change env handling, routing, metadata, or server/client boundaries. |

### Lighthouse workflow

`.github/workflows/lighthouse.yml` is a separate pull-request workflow. It builds the app and runs `bun x lhci autorun --config=./lighthouserc.json`, then uploads the Lighthouse reports artifact.

That workflow complements testing, but it is not a substitute for `bun test` or the Playwright accessibility smoke layer.

### Current boundary to remember

- `bun run test:a11y:e2e` exists and is valuable, but it is **not** part of `.github/workflows/ci.yml` today.
- Browser coverage is intentionally narrow and should be expanded carefully instead of being described as full E2E parity.
- Placeholder Firebase/Auth/Resend values in CI prove wiring and buildability, not live-service correctness.

## Before you merge

- [ ] Run `bun test`.
- [ ] Run `bun run check`.
- [ ] Run `bun run build` if the slice can affect build output, routing, env wiring, or metadata.
- [ ] Run `bun run test:a11y:e2e` if you changed public or kiosk UI behavior.
- [ ] Use `bun test --coverage` when you add new logic and want a quick signal about untested branches.

## Next step

- Read `docs/guides/getting-started.md` if you still need the local bootstrapping path.
- Read `docs/runbooks/production-hardening.md` when you are validating release readiness instead of day-to-day contributor checks.
- Read `docs/reference/accessibility.md` for the full automated-vs-manual accessibility coverage matrix, the WCAG 2.1 AA status table, and the next honest coverage targets.
