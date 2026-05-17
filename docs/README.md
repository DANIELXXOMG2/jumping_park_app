# Documentation index

This index is the canonical map of the active documentation surface for Jumping Park. Start here when you need to understand what is current, what is planned next, and what is archived for historical traceability.

## Quick path

1. Start at `README.md` for the repo overview, runtime surfaces, and quality gates.
2. Read `docs/ARQUITECTURA.md` for the current system narrative and rollout model.
3. Use `docs/runbooks/production-hardening.md` as the operational hub for validation and rollback.
4. Open `docs/guides/` when you need contributor setup, testing, or deployment workflows.
5. Open `docs/adr/README.md` when you need the repo-backed architecture rationale behind the current system shape.
6. Open `docs/portfolio/README.md` for the portfolio capture workspace and asset-planning references.
7. Open `docs/archive/archive-README.md` only when you need historical material.

## Active surfaces

| Path | Role | Status |
| --- | --- | --- |
| `docs/ARQUITECTURA.md` | Current architecture narrative, data flow, rollout evidence, and decision traceability. | Active |
| `docs/guides/` | Getting started, testing, and deployment walkthroughs for day-to-day contributors. | Active |
| `docs/api/` | Service and schema reference for the API surface and shared Zod contracts. | Active |
| `docs/adr/` | Architecture decision records that turn Engram-backed history into repo-readable context. | Active |
| `docs/runbooks/` | Operational procedures for rollout, rollback, offline replay, admin cost validation, dependency risk, and SEO/AI-SEO checks. | Active |
| `docs/portfolio/` | Portfolio capture planning, screenshot checklists, diagram storytelling notes, and branding guidance. | Active planning surface |
| `diagramas/` | Editable Mermaid source files that support the architecture narrative from outside the `docs/` tree. | Active companion |

## Planned next slices

| Planned path | Purpose |
| --- | --- |
| `docs/assets/` | Curated rendered diagrams and portfolio-ready screenshots once the tooling slice lands. |

## Historical material

- `docs/archive/` stores frozen legacy documents and research artifacts.
- `docs/archive/README.md` is the archived Spanish docs index, kept for traceability only.
- Do not use archived files as the primary source of truth for current operations.

## Documentation rules

- Keep new documentation in English.
- Keep claims tied to files, runbooks, or verified repository behavior.
- Prefer the active surfaces above before consulting historical material.
