# Apply Progress: safe-apply-scope-docs-repo-hygiene

## Batch Scope

- Close the remaining docs/hygiene verify gaps from the prior micro-scope.
- Remove the confusing tracked-file ignore while preserving the narrow local-only `.tmp_vercel_link/` ignore.
- Fix the stale non-archived OpenSpec reference in `docs/portfolio/diagrams/README.md`.
- Keep the batch docs/hygiene only and avoid runtime code changes.

## Completed Work

- Updated `README.md` to label the roadmap links as archived and point them to the real archived OpenSpec change directory.
- Added `.tmp_vercel_link/` to `.gitignore` so temporary local Vercel link artifacts do not create future repo noise.
- Removed `.claude/settings.local.json` from `.gitignore` because that file is tracked by git and ignoring it was misleading hygiene.
- Updated `docs/portfolio/diagrams/README.md` so its OpenSpec design reference points to the archived roadmap change path that actually exists.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| `README.md` truthfulness fix | N/A | Structural docs | N/A | ✅ Not applicable — text-only path correction | ✅ Link targets updated to existing archived artifacts | ➖ Skipped: single truthful destination swap | ✅ Kept wording minimal and status-explicit |
| `.gitignore` hygiene correction | N/A | Structural config | N/A | ✅ Not applicable — ignore-list correction for tracked file truthfulness | ✅ Removed the misleading tracked-file ignore while preserving `.tmp_vercel_link/` | ➖ Skipped: single-purpose ignore correction | ✅ Kept scope minimal; no runtime files touched |
| `docs/portfolio/diagrams/README.md` archival reference fix | N/A | Structural docs | N/A | ✅ Not applicable — text-only path correction | ✅ Archived OpenSpec design path now matches an existing file | ➖ Skipped: single truthful destination swap | ✅ Kept wording/source-of-truth guidance unchanged |

## Validation

- Verified the archived OpenSpec paths referenced by both `README.md` and `docs/portfolio/diagrams/README.md` exist under `openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/`.
- Verified `.gitignore` still includes `.tmp_vercel_link/` and no longer ignores the tracked `.claude/settings.local.json` file.
- No runtime/test/build commands were run because the batch is docs/repo-hygiene only and the user explicitly requested no runtime code changes.

## Files Changed

- `README.md` — corrected broken OpenSpec references and made archival status explicit.
- `.gitignore` — preserved `.tmp_vercel_link/` while removing the misleading ignore for the tracked Claude settings file.
- `docs/portfolio/diagrams/README.md` — corrected the stale non-archived OpenSpec design reference.

## Remaining Work

- None within this micro-scope.
