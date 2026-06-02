# Screenshot capture foundation

> **Status**: foundation only
> **Diátaxis**: How-to
> **Audit date**: 2026-06-01

The `scripts/capture-screenshots.ts` orchestrator plus its Zod config
(`src/lib/schemas/screenshotCapture.schema.ts`) is the foundation for
the portfolio screenshot pipeline. It pairs with
`scripts/optimize-screenshots.ts`, which converts the captured PNGs
into WebP. **This slice establishes the foundation; it does NOT commit
real captures.**

## Quick path

1. Review the default plan:
   ```bash
   bun run screenshot:capture -- --mode dry-run
   ```
2. Run the schema regression (current foundation coverage):
   ```bash
   bun test tests/screenshot-capture-schema.test.ts
   ```
3. When ready to capture for real, follow [Capture runbook](#capture-runbook) below.

## Details

| Topic | Decision |
| --- | --- |
| Capture orchestrator | `scripts/capture-screenshots.ts` (Playwright + Zod) |
| Capture config | `src/lib/schemas/screenshotCapture.schema.ts` (Zod schema, default plan) |
| Output dir | `docs/portfolio/screenshots/*.png` (default) |
| Optimizer input | Same dir, consumed by `scripts/optimize-screenshots.ts` |
| Surface coverage | kiosk, admin, public (see `CAPTURE_SURFACE` const) |
| Naming | `kebab-case`; the optimizer reuses the stem for the WebP file |

## What this slice does

- Adds a typed capture plan (one row per portfolio checklist entry).
- Adds a Playwright-based orchestrator that opens a context per job,
  sets the configured viewport, waits for the heading, and writes a
  PNG.
- Adds a `--mode=dry-run` mode that prints the plan and exits 0. This
  is the safe default; reviewers can confirm scope in PRs without
  launching a browser.
- Wires `bun run screenshot:capture` next to the existing
  `optimize:screenshots` script entry.

## What this slice does NOT do

- It does **not** commit any real capture. PNGs in
  `docs/portfolio/screenshots/` are placeholders only at this point.
- It does **not** run end-to-end Playwright captures in CI. The write
  path requires a live `bun dev` server with demo data; that is a
  manual step described in the runbook below.
- It does **not** land end-to-end Playwright captures in CI. The
  orchestrator + CLI integration regression lives in
  `tests/screenshot-capture-foundation.test.ts` and validates the
  foundation without launching a real browser.
- It does **not** touch HyperFrames, demo script, or any of the other
  Phase 5 media work. Those are separate slices.

## Capture runbook

Use this checklist before committing any real capture to
`docs/portfolio/screenshots/`:

1. Confirm the dev server is up and demo data is seeded.
2. Install Playwright Chromium if needed:
   ```bash
   bun run playwright:install
   ```
3. Run the capture in dry-run to confirm scope:
   ```bash
   bun run screenshot:capture -- --mode dry-run
   ```
4. Run the capture for real:
   ```bash
   bun run screenshot:capture -- --mode write
   ```
5. Run the optimizer to produce WebP assets:
   ```bash
   bun run optimize:screenshots
   ```
6. Manually review each PNG against
   [`docs/portfolio/screenshots/README.md`](./README.md). Reject any
   capture that contains real PII, off-screen breadcrumbs, or partial
   headers.
7. Update
   [`docs/portfolio/artifact-manifest.template.md`](../artifact-manifest.template.md)
   to flip each `pending` row to the asset path once the file lands in
   the repo.

## Environment blockers

If the environment cannot safely capture (e.g. CI without `bun dev`,
blocked network for Playwright, missing demo seed), keep the slice
minimal:

- Do not invent captures. Do not commit empty PNGs.
- The dry-run command is the truthful evidence the foundation is wired.
- The schema test (`tests/screenshot-capture-schema.test.ts`) is the
  truthful evidence the schema accepts the default plan.
- The orchestrator + CLI integration test
  (`tests/screenshot-capture-foundation.test.ts`) validates the
  foundation without a live server.
- Document the blocker in the PR description and link the runbook step
  that will run once the environment recovers.

## Related artifacts

| File | Role |
| --- | --- |
| `scripts/capture-screenshots.ts` | Playwright orchestrator + dry-run + CLI |
| `src/lib/schemas/screenshotCapture.schema.ts` | Zod config schema + default plan |
| `tests/screenshot-capture-schema.test.ts` | Schema regression (current slice) |
| `tests/screenshot-capture-foundation.test.ts` | Orchestrator + CLI integration test |
| `scripts/optimize-screenshots.ts` | PNG → WebP optimizer (consumes capture output) |
| `docs/portfolio/screenshots/README.md` | Portfolio checklist (preserved) |
| `docs/portfolio/screenshots/capture-config.md` | Schema reference (slice 5.2-A) |
| `docs/portfolio/artifact-manifest.template.md` | Asset manifest template |
