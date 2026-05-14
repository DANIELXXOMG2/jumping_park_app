# Tasks: Clean-Clone Reapply Workflow

## Phase 1: Clean Clone Foundation

- [ ] 1.1 Clone fresh repository from remote `main` into `jumping_park_app_clean`
- [ ] 1.2 Inventory corrupted working tree files grouped into 4 batches
- [ ] 1.3 Verify clean clone baseline: `bun install` and `bun run check` pass

## Phase 2: Batch 1 — Docs / Hygiene / Diagrams

- [x] 2.1 Reapply `README.md`, `CONTRIBUTING.md`, `AGENTS.md` with truthful claims only
- [ ] 2.2 Reapply `docs/**`, `diagramas/**`, and `.vercelignore`
- [ ] 2.3 Commit batch 1: `docs: reapply hygiene and diagrams`
- [ ] 2.4 Gate 1: docs claims validated against repo, `bun run check` passes (targeted docs truthfulness test and path/reference sanity now covered; full `bun run check` still pending)

## Phase 3: Batch 2 — Env / OTP Timing

- [x] 3.1 Reapply `.env.example` with OTP timing variables
- [x] 3.2 Reapply `src/lib/utils/otpConfig.ts` and `src/services/authService.ts`
- [x] 3.3 Reapply OTP tests: `tests/otp-timing-config.test.ts`, `tests/auth-hardening.test.ts`
- [x] 3.4 Reapply `CLAUDE.md` and `docs/runbooks/otp-operational-policy.md`
- [ ] 3.5 Commit batch 2: `feat: reapply configurable OTP timing`
- [x] 3.6 Gate 2: targeted Bun tests pass, env contract matches code

## Phase 4: Batch 3 — Production Hardening

- [x] 4.1 Reapply `src/app/**`, `src/components/**`, `src/lib/**`, `src/services/**` runtime changes
- [x] 4.2 Reapply Firebase IaC under `firebase/**`
- [x] 4.3 Reapply Playwright tests, `playwright/**`, and `.github/workflows/ci.yml`
- [x] 4.4 Reapply `package.json` and `bun.lock` as single reviewed dependency contract
- [x] 4.5 Reapply `knip.json`, `public/offline-sw.js`, and rollout flags
- [ ] 4.6 Commit batch 3: `feat: reapply production hardening`
- [ ] 4.7 Gate 3: full test suite passes, Playwright a11y checks pass, CI workflow valid

## Phase 5: Batch 4 — Archive & Traceability

- [x] 5.1 Reapply `openspec/config.yaml` and `openspec/specs/**` reflecting final state
- [x] 5.2 Reapply `openspec/changes/**` archive with clean-clone provenance
- [ ] 5.3 Commit batch 4: `chore: reapply OpenSpec archive traceability`
- [x] 5.4 Gate 4: OpenSpec specs match reapplied implementation
- [ ] 5.5 Final integration gate: `bun run check`, zero uncommitted changes, git log reviewed
