# Script Archive

> **Non-operational — for historical reference only.**
> These scripts are no longer part of the daily workflow and are preserved for audit,
> institutional knowledge, and potential future re-use. None of these scripts appear
> in `package.json` scripts.

To run any archived script directly:

```bash
bun run scripts/archive/migrations/migrate-roles.ts
bun run scripts/archive/one-time/optimize-assets.ts
```

---

## Migrations

One-time Firestore data migrations that have already been applied to production.
They remain for reference and disaster-recovery documentation.

| Script | Purpose | Last Known Working Commit | Replacement |
|--------|---------|---------------------------|-------------|
| `migrate-roles.ts` | Seed initial roles (admin, cashier, visitor) into Firestore `roles` collection for dynamic role management | `758bb64` | None — one-time migration, already applied |
| `migrate-minors.ts` | Migrate minors into optimized `minors_index` collection | `46f024e` | None — one-time migration, already applied |
| `migrate-consent-multilang.ts` | Migrate consent settings from flat format to multilanguage `{ es, en }` structure | `66043a3` | None — one-time migration, already applied |
| `migrate-search-tokens.ts` | Add `searchTokens` fields to `users`, `minors_index`, and `consents` collections for efficient name search | `3721167` | None — one-time migration, already applied |
| `migrate-search-tokens-tildes.ts` | Regenerate `searchTokens` with accent normalization (e.g., "María" → "maria") for accent-insensitive search | `3721167` | None — one-time migration, already applied |
| `migrate-minor-search-tokens.ts` | Regenerate `searchTokens` for documents in `minors_index` to ensure correct token generation | `3721167` | None — one-time migration, already applied |
| `migrate-consent-minor-tokens.ts` | Add minor participant search tokens to existing consent documents for name/ID-based lookup | `3721167` | None — one-time migration, already applied |

---

## One-Time / Superseded

Scripts that were run once, are superseded by newer tooling, or served a
temporary purpose.

| Script | Purpose | Last Known Working Commit | Replacement |
|--------|---------|---------------------------|-------------|
| `optimize-assets.ts` | Convert Jumping Park logo to optimized WebP, generate favicons from source PNG | `b4a7e8c` | Superseded by `scripts/optimize-images.ts` (covers broader image optimization pipeline) |
| `git-history-mp4-precheck.ts` | Pre-flight check for MP4 history purge: identifies large binary objects in git history that are candidates for `git-filter-repo` | `d9878f8` | None — one-time pre-check for a completed git history cleanup |

---

## Former Package.json Entries (Removed)

These npm script aliases were removed from `package.json` as part of this archival:

| Script Key | Equivalent Direct Command |
|------------|--------------------------|
| `migrate:minors` | `bun run scripts/archive/migrations/migrate-minors.ts` |
| `migrate:search-tokens` | `bun run scripts/archive/migrations/migrate-search-tokens.ts` |
| `migrate:consent-minor-tokens` | `bun run scripts/archive/migrations/migrate-consent-minor-tokens.ts` |
| `migrate:minor-search-tokens` | `bun run scripts/archive/migrations/migrate-minor-search-tokens.ts` |
| `migrate:tildes` | `bun run scripts/archive/migrations/migrate-search-tokens-tildes.ts` |
| `check:phase5` | Historical test gate — hardcoded specific test file paths. Removed in favor of `bun test` and `bun run test:a11y:e2e` used independently. |

---

## Former Package.json Entries (Surface Reduction)

These npm script aliases were removed from `package.json` as part of the
script surface reduction (Slice 5). None affect capability — every command
remains executable via its direct equivalent.

### Check Pipeline (composed into `check`)

These sub-commands were previously top-level scripts referenced by `check`.
They are now inlined directly in the `check` script body and remain runnable
independently:

| Script Key | Equivalent Direct Command |
|------------|--------------------------|
| `check:format` | `biome check src/ --formatter-enabled=true --linter-enabled=false --assist-enabled=false` |
| `check:lint` | `biome lint src/` |
| `check:types` | `tsc --noEmit` |
| `check:docs` | `bun run scripts/check-docs.ts` |

### Docs Sub-Phase Entry Points

Each docs check phase can still be run independently:

| Script Key | Equivalent Direct Command |
|------------|--------------------------|
| `check:docs:lint` | `bun run scripts/check-docs-lint.ts` |
| `check:docs:links` | `bun run scripts/check-docs-links.ts` |
| `check:docs:redact` | `bun run scripts/check-docs-redact.ts` |
| `check:docs:drift` | `bun run scripts/check-docs-drift.ts` |

### Individual Audit Sub-Commands

The `audit` script (`bun run scripts/audit.ts`) runs all checks automatically.
Individual checks remain directly runnable:

| Script Key | Equivalent Direct Command |
|------------|--------------------------|
| `audit:dead` | `knip` |
| `audit:dupe` | `jscpd src/ --config .jscpd.json` |
| `audit:circ` | `depcruise src --include-only "^src" --config .dependency-cruiser.js` |

### Low-Frequency / CI-Only Commands

These commands are used less than once per sprint or are CI-only. They remain
fully functional via direct invocation:

| Script Key | Equivalent Direct Command |
|------------|--------------------------|
| `playwright:install` | `playwright install chromium` |
| `test:a11y:e2e` | `playwright test --config=playwright.config.ts` |
| `screenshot:capture` | `bun run scripts/capture-screenshots.ts` |
| `optimize:images` | `bun run scripts/optimize-images.ts` |
| `optimize:screenshots` | `bun run scripts/optimize-screenshots.ts` |
| `validate:evidence` | `bun run scripts/validate-pagespeed.ts -- --url ${URL:-https://www.jumpingpark.lat} && bun run scripts/extract-jsonld.ts -- --url ${URL:-https://www.jumpingpark.lat} && bun run scripts/validate-public-crawl.ts -- --url ${URL:-https://www.jumpingpark.lat}` |
