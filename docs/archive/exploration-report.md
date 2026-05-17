# Documentation Overhaul — Exploration Report

> **Project**: jumping_park_app
> **Role**: Research-only exploratory audit
> **Date**: 2026-05-15

---

## Executive Summary

Jumping Park's current documentation is **better than average** — the README, CLAUDE.md, CONTRIBUTING.md, architecture doc, and eight runbooks form a solid operational backbone. The docs index at `docs/README.md` with editorial status markers is itself a best practice.

However, the docs surface **does not match the ambition** of a flagship portfolio project. Four critical gaps stand out:

1. **No API or service-layer documentation** despite 13 backend services and a complex Zod-validated API surface.
2. **Portfolio assets don't exist** — the `docs/portfolio/` directory is a plan with zero actual screenshots, zero demo motion, and zero curated diagrams.
3. **Bilingual fragmentation without a language policy** — six current docs in English, four in Spanish, no consistency rule.
4. **~1500 lines of historical clutter** (`MANUAL_USUARIO.md`, `MANUAL_INSTALACION.md`, `INFORME_TECNICO_SPRINT_3.md`, `ESTRUCTURA_PROYECTO.md`) still living in `docs/`, competing for attention with current material.

The good news: the foundation is strong. What's needed is curation, consolidation, and creation — not a rewrite from scratch.

---

## Current-State Map

### Tier 1: Active / Operational (Current)

| Doc | Lines | Language | Quality |
| --- | --- | --- | --- |
| `README.md` | 149 | EN | **Excellent** — product story, architecture, rollout flags, docs IA, quality gates, portfolio links |
| `CLAUDE.md` | 260 | EN | **Excellent** — full AI agent onboarding with commands, architecture, conventions, patterns |
| `docs/ARQUITECTURA.md` | 210 | ES | **Good** — thorough plane-by-plane architecture with Mermaid flowcharts |
| `CONTRIBUTING.md` | 53 | EN | **Good** — workflow, engineering expectations, quality gates, SDD expectations |
| `docs/README.md` | 51 | ES | **Excellent** — docs map with current/reference/historical markers |
| `AGENTS.md` | 20 | EN | **Adequate** — brief code review rules for the AI |
| `.github/instructions/main.instructions.md` | 32 | EN | **Good** — engineering baseline for AI agents |
| `.env.example` | 41 | EN | **Good** — well-commented environment documentation |

### Tier 1: Runbooks (active, high quality)

| File | Lines | Purpose |
| --- | --- | --- |
| `production-hardening.md` | 53 | Operational entry point, smoke pack, approval criteria |
| `rollback-flags.md` | 63 | Flag rollback matrix and procedure |
| `admin-cost-smoke-checklist.md` | 50 | Cursor/aggregate cost validation |
| `offline-replay-drill.md` | 55 | Offline replay staged drill |
| `seo-ai-seo-validation-checklist.md` | 57 | SEO + AI-SEO + a11y smoke checklist |
| `dependency-risk-note.md` | 36 | Current dependency audit status |
| `otp-operational-policy.md` | 55 | OTP throttle, lockout, session policy |
| `git-history-mp4-purge.md` | 110 | History rewrite procedure |

### Tier 1: Reference / Supplementary

| Doc | Purpose |
| --- | --- |
| `diagramas/README.md` | Diagram usage guide |
| `diagramas/Diagrama-Secuencia.mmd` | Sequence diagram (editable Mermaid) |
| `diagramas/Diagrama-de-Entidad-Relacion.mmd` | ER diagram (editable Mermaid) |

### Tier 1: Portfolio (all plan, zero assets)

| Doc | Purpose | Status |
| --- | --- | --- |
| `docs/portfolio/README.md` | Portfolio capture plan | **Plan only** |
| `docs/portfolio/screenshots/README.md` | Screenshot checklist | **Plan only** |
| `docs/portfolio/motion/demo-script.md` | Demo video script | **Plan only** |
| `docs/portfolio/branding/logo-usage.md` | Logo guidelines | **Plan only** |
| `docs/portfolio/diagrams/README.md` | Diagram curation guidance | **Plan only** |
| `docs/portfolio/artifact-manifest.template.md` | Asset inventory template | **Template only** |

### Tier 2: Historical / Read-with-context (legacy, kept for reference)

| Doc | Lines | Language |
| --- | --- | --- |
| `docs/MANUAL_USUARIO.md` | 746 | ES — old user manual |
| `docs/MANUAL_INSTALACION.md` | 337 | ES — old deployment guide |
| `docs/INFORME_TECNICO_SPRINT_3.md` | 336 | ES — old sprint report |
| `docs/ESTRUCTURA_PROYECTO.md` | 79 | ES — old project structure |

### Engram-Backed (not in repo filesystem)

- All SDD artifacts: `sdd/<change-name>/{proposal,spec,design,tasks,apply-progress,verify-report}`
- User preference: "make jumping_park_app the flagship portfolio project"

---

## Critical Gaps

### 1. Missing documentation categories

| Category | Current state | Impact |
| --- | --- | --- |
| **API reference** | None | 13 services, ~20 API routes, complex Zod schemas — undocumented |
| **Component library** | None | Organized `src/components/ui/`, `kiosk/`, `admin/` — no catalog |
| **Architecture Decision Records** | None in repo | ADRs only in Engram; invisible to contributors without Engram |
| **Testing guide** | None | 24 test files (Playwright + Jest + Axe + Lighthouse) — no doc on patterns or how to extend |
| **Deployment guide** | Historical only | Old `MANUAL_INSTALACION.md` marked historical; no current deployment doc |
| **Getting-started tutorial** | None | `CLAUDE.md` has commands but no "build your first feature" walkthrough |
| **Accessibility guide** | Runbook smoke only | a11y exists in runbooks but no comprehensive doc |
| **i18n guide** | None | `src/lib/i18n/` directory exists — completely undocumented |
| **Performance guide** | None | Lighthouse CI configured — no doc explaining how to interpret or act on scores |
| **Changelog** | None | No `CHANGELOG.md` — no release history |
| **Troubleshooting guide** | OTP-only | Only `otp-operational-policy.md` covers troubleshooting |
| **Security/CSP guide** | Inline only | CSP documented in README and proxy.ts — no dedicated security doc |

### 2. Portfolio completeness gap

Every single asset in `docs/portfolio/` is marked `pending`. The artifact manifest lists 7 required stills with zero captured. The demo script has no video. There are no real diagrams — only Mermaid sources. The full portfolio capture surface is **unstarted**.

### 3. Bilingual fragmentation

| Language | Current docs |
| --- | --- |
| English | `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `AGENTS.md`, all runbooks, `diagramas/README.md`, `docs/portfolio/*` |
| Spanish | `docs/README.md`, `docs/ARQUITECTURA.md`, all 4 historical docs |

No language policy exists. The docs index is in Spanish but indexes English runbooks. The architecture doc is in Spanish but `CLAUDE.md` architecture section is in English. Contradictory signals for contributors.

### 4. Historical doc weight

~1,498 lines of historical material live in `docs/` alongside current docs. While marked "historical" in the index, their mere presence in the same directory adds cognitive load. They should be moved to a `docs/archive/` directory or removed entirely.

### 5. Missing Engram↔Repo bridge

Key decision records live only in Engram: the OTP session split model, the cursor-vs-offset decision, the offline architecture choices. A new contributor cloning the repo gets none of this context. The architecture doc mentions "ADR candidates" but doesn't resolve them.

---

## Recommended Documentation Structure

```
docs/
├── README.md                    # Documentation map (consolidated, EN)
├── ARCHITECTURE.md              # Updated architecture (consolidate ARQUITECTURA.md, EN)
├── DECISIONS.md                 # ADR log — formalize Engram ADRs in repo
│
├── guides/
│   ├── getting-started.md       # First-time walkthrough
│   ├── development.md           # Dev setup, commands, quality gates (migrate from CLAUDE.md)
│   ├── deployment.md            # Production deployment (replace old MANUAL_INSTALACION)
│   ├── testing.md               # Test patterns, running, extending
│   ├── accessibility.md         # A11y approach, tools, patterns
│   └── i18n.md                  # Internationalization guide
│
├── api/
│   ├── overview.md              # Service layer, handler pattern, validation
│   ├── kiosk.md                 # Visitor-facing API endpoints
│   ├── admin.md                 # Admin API endpoints
│   └── public.md                # Public SEO surface
│
├── runbooks/                    # Keep all 8 existing runbooks (already excellent)
│   ├── production-hardening.md
│   ├── rollback-flags.md
│   ├── admin-cost-smoke-checklist.md
│   ├── offline-replay-drill.md
│   ├── seo-ai-seo-validation-checklist.md
│   ├── dependency-risk-note.md
│   ├── otp-operational-policy.md
│   └── git-history-mp4-purge.md
│
├── portfolio/
│   ├── README.md                # Updated capture plan
│   ├── screenshots/             # REAL stills (replace placeholders)
│   │   ├── kiosk-ingreso.png
│   │   ├── kiosk-otp.png
│   │   ├── kiosk-consentimiento.png
│   │   ├── admin-dashboard.png
│   │   ├── admin-consents-list.png
│   │   ├── public-consentimiento-digital.png
│   │   └── llms-txt.png
│   ├── diagrams/                # CURATED portfolio diagrams
│   │   ├── data-plane.png
│   │   └── rollout-map.png
│   ├── motion/
│   │   ├── demo-script.md
│   │   └── demo.mp4             # REAL demo capture
│   └── branding/
│       └── logo-usage.md
│
├── archive/                     # Historical docs moved here, not deleted
│   ├── MANUAL_USUARIO.md
│   ├── MANUAL_INSTALACION.md
│   ├── INFORME_TECNICO_SPRINT_3.md
│   └── ESTRUCTURA_PROYECTO.md
│
└── assets/                      # Diagrams, images used in docs
    ├── architecture-flow.png
    └── data-plane.png
```

### Root-level changes

- `README.md` — update Docs IA section to match new structure
- `CLAUDE.md` — keep as AI agent guide, deconflict with docs/guides/development.md
- `CHANGELOG.md` — **new file** for release history
- `diagramas/` — keep as editable Mermaid sources, link from docs
- `AGENTS.md`, `CONTRIBUTING.md` — minor updates for doc map changes

---

## Top 10 Deliverables

Ordered by impact for a portfolio-grade rework:

| # | Deliverable | Effort | Why it matters |
| --- | --- | --- | --- |
| 1 | **Archive 4 historical docs** into `docs/archive/` | Trivial | Immediately cleans cognitive load; clears 1,498 lines of clutter |
| 2 | **Capture 7 portfolio screenshots** | 1-2h | Turns `docs/portfolio/` from a plan into real evidence; highest portfolio ROI per hour |
| 3 | **Create API reference** (kiosk + admin + public) | 4-6h | The codebase has 13 services and ~20 routes — this is the single biggest documentation gap |
| 4 | **Create ADR log** (`docs/DECISIONS.md`) | 2-3h | Formalize the 3 ADR candidates + key Engram decisions so contributors can read them from the repo |
| 5 | **Create testing guide** (`docs/guides/testing.md`) | 2h | 24 test files, multiple frameworks — needs a pattern doc |
| 6 | **Consolidate language** — translate `docs/README.md` and `docs/ARQUITECTURA.md` to English | 2-3h | Resolves bilingual fragmentation; English for an international portfolio |
| 7 | **Create deployment guide** (`docs/guides/deployment.md`) | 2h | Replace the old `MANUAL_INSTALACION.md` with a current, concise guide |
| 8 | **Create getting-started guide** (`docs/guides/getting-started.md`) | 2h | Lowers barrier for new contributors and portfolio reviewers |
| 9 | **Curate portfolio diagrams** (data-plane + rollout map) | 2-3h | Turn Mermaid sources into polished SVGs suitable for a case study |
| 10 | **Create CHANGELOG.md** | 1h | Professional release history for the portfolio |

**Bonus**: Demo video capture (motion/demo.mp4) is the highest-effort but highest-impact portfolio asset — pair with deliverable #2.

---

## Risks and Unknowns

### Risks

1. **Engram lock-in**: SDD artifacts live exclusively in Engram. If Engram ever loses context or the agent system changes, all planning history is orphaned. Mitigation: formalize key ADRs in `docs/DECISIONS.md` as a repo-backed source of truth.
2. **Historical doc deletion**: The user may want to keep historical docs as reference. Mitigation: move to `docs/archive/` instead of deleting, clearly marked as historical.
3. **Bilingual cleanup scope creep**: Translating ARQUITECTURA.md (210 lines) is straightforward, but the 4 historical docs (~1,500 lines) would be a massive translation effort. Mitigation: archive them as-is, no translation required.
4. **Portfolio asset staleness**: Screenshots capture a moment in time; the product may evolve and make them obsolete. Mitigation: use a date-naming convention and version-bound captures.

### Unknowns

1. **What is the language policy going forward?** The current split (Spanish docs index, Spanish architecture, English everything else) needs an explicit decision.
2. **Does the user want Storybook or a lighter component catalog?** `src/components/ui/` is shadcn/ui-based — Storybook would be the standard choice but adds CI/build complexity.
3. **What level of API documentation?** OpenAPI/Swagger generated from Zod schemas (ideal for portfolio) vs. handwritten docs vs. a reference-only approach.
4. **Should CLAUDE.md stay as the development guide, or should docs/guides/development.md become the canonical source?** Currently CLAUDE.md is the de facto developer onboarding doc, which is an unusual pattern for non-AI contributors.

---

## Skill Resolution

| Skill | Used? | Why |
| --- | --- | --- |
| `sdd-explore` | ✅ Loaded | Canonical explore phase — provided the structured analysis workflow |
| `cognitive-doc-design` | Not loaded | Relevant for the documentation structure design, but the task asked for audit+report, not doc authoring |
| `work-unit-commits` | Not relevant | No code changes in this phase |
| `next-best-practices` | Not relevant | Pure docs audit, no code changes |

---

## Ready for Proposal

**Yes**. The exploration is comprehensive enough to proceed to proposal. The orchestrator should:

1. Review the 10 deliverables and the recommended docs structure.
2. Decide on the language policy (recommendation: English for all current docs).
3. Choose an API doc approach (recommendation: Schema-first, potentially generated from Zod).
4. Set portfolio asset capture as the highest-visibility sprint.

---

*Report generated by sdd-explore sub-agent for the documentation overhaul research task.*
