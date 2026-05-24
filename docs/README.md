# Documentation hub

This is the entry point for the current documentation information architecture (IA). It uses Diátaxis as the navigation model and keeps every hub entry marked as `current`, `reference`, or `historical`.

## Quick path

1. Start at `README.md` for the repo overview and quality gates.
2. Read `docs/ARQUITECTURA.md` or `docs/reference/architecture.md` for the current system narrative (English reference).
3. Use `docs/runbooks/production-hardening.md` as the operational hub.
4. Open `docs/portfolio/README.md` when you need the portfolio/storytelling workspace.
5. Use historical docs only when you need traceability for older project states.

## Tutorials

No current tutorial is published yet. This hub keeps the IA ready for future tutorials without inventing content that does not exist in the repo today.

| Path | Status | Role |
| --- | --- | --- |
| `docs/MANUAL_USUARIO.md` | historical | Legacy end-user walkthrough kept only for traceability. |

## How-to guides

| Path | Status | Role |
| --- | --- | --- |
| `docs/runbooks/production-hardening.md` | current | Main operator path for release validation, rollout, and rollback checks. |
| `docs/runbooks/rollback-flags.md` | current | Flag-by-flag rollback procedure for staged releases. |
| `docs/runbooks/offline-replay-drill.md` | current | Step-by-step offline replay validation drill. |
| `docs/runbooks/admin-cost-smoke-checklist.md` | current | Procedure for admin cost and aggregates smoke checks. |
| `docs/runbooks/seo-ai-seo-validation-checklist.md` | current | Release checklist for SEO, AI visibility, and a11y smoke notes. |
| `docs/ai-visibility-monthly-checklist.md` | current | Recurring monthly workflow for AI citation and discovery checks. |
| `docs/runbooks/git-history-mp4-purge.md` | reference | Targeted history-rewrite procedure used only when coordinating a purge window. |

## Reference

| Path | Status | Role |
| --- | --- | --- |
| `docs/adr/README.md` | current | ADR index for architecture decisions extracted from the reviewed source branch. |
| `docs/reference/architecture.md` | current | English reference architecture — system planes, data flow, collection contracts, and operational gates. |
| `docs/ARQUITECTURA.md` | current | Current architecture narrative, rollout model, and cross-surface system map. |
| `docs/runbooks/otp-operational-policy.md` | current | OTP runtime values, lockouts, and source-linked operational contract. |
| `docs/runbooks/dependency-risk-note.md` | current | Current dependency risk position and accepted residual tooling debt. |
| `docs/MANUAL_INSTALACION.md` | historical | Legacy installation guide that must be re-validated before reuse. |
| `docs/ESTRUCTURA_PROYECTO.md` | historical | Legacy structure map kept only as historical context. |

## Explanation

| Path | Status | Role |
| --- | --- | --- |
| `docs/portfolio/README.md` | current | Product-storytelling workspace that explains what portfolio evidence should exist and why. |
| `docs/INFORME_TECNICO_SPRINT_3.md` | historical | Older sprint narrative kept for historical context, not current operating truth. |

## Navigation rules

- Deeper leaves stay behind their nearest hub document so the main navigation does not go past `docs/{doc}.md` or `docs/{category}/{doc}.md`.
- Portfolio sub-docs are entered through `docs/portfolio/README.md`, not listed directly from this top-level hub.
- If a document stops matching current code or operations, downgrade it to `reference` or `historical` instead of overstating confidence.
