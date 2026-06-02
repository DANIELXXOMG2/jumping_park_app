# UX Audit — Vercel Web Interface Guidelines (WIG)

> **Status**: current
> **Audit date**: 2026-06-02
> **Diátaxis**: How-to
> **Spec reference**: R12 (portfolio-product-documentation-overhaul)
> **Source guidelines**: Vercel Web Interface Guidelines (WIG), category summaries drawn from the public guideline set as published on the audit date.

This how-to documents the current WIG audit for the Jumping Park app. Each rule below is marked pass / fail / na with a dated review and the evidence type used to reach that label. Nothing in this document is a compliance claim — it is a per-rule audit gate per spec R12.

## 1. Scope

| Axis | What is covered this slice |
| --- | --- |
| WIG categories | Interactions, Forms, Content, Layout (4 of 7) |
| Surfaces | Public consent, Kiosk flow, Admin login, Offline / error state (4 surfaces) |
| Evidence types | `code-reviewed` (line(s) read in this slice), `cited` (source file named in another current reference), `manual` (no automated or unit assertion exists) |
| Audit date pinned | 2026-06-02 — replace the date block when re-running; do not rewrite history |

### 1.1 Categories deferred to a future slice

The following WIG categories are out of scope here. They need either an animated-component assertion, a perf-budget assertion, or a design-token check that the current test matrix does not yet provide:

- Animations — motion + `prefers-reduced-motion` assertions.
- Performance — Core Web Vitals, JS payload, image sizing.
- Design — color tokens, spacing scale, type ramp, dark / light parity.

A future slice should pick these up once their evidence paths land in `tests/`, `playwright/*.a11y.ts`, or `lighthouserc.json`. They are intentionally absent from the tables below so a future auditor can spot the gap at a glance.

## 2. Surfaces audited

| Surface | Representative route(s) | Why it is in scope |
| --- | --- | --- |
| Public consent | `/consentimiento-digital` | SEO + legal public surface; Lighthouse a11y gate runs here. |
| Kiosk flow | `/`, `/ingreso`, `/registro`, `/otp`, `/consentimiento`, `/exito` | The primary user journey; carries the most automated a11y coverage. |
| Admin login | `/admin/login` | The only post-`/admin` entry point currently in the Playwright a11y matrix. |
| Offline / error | `/offline` | Fallback surface; reflow-asserted at 640 px. |

Admin post-login routes (`/admin/usuarios`, `/admin/consentimientos`, `/admin/menores`, `/admin/roles`, `/admin/dashboard`, `/admin/settings/consent`) are explicitly out of scope for this slice because they are not in the current a11y smoke matrix — see `docs/reference/accessibility.md` §5.

## 3. Audit method

A WIG rule is recorded as one of four states:

| State | Meaning |
| --- | --- |
| pass | Evidence exists in the repo today (code-reviewed or cited) and matches the WIG rule. |
| fail | Evidence exists in the repo today (code-reviewed or cited) and contradicts the WIG rule. |
| na | The rule does not apply to this surface (e.g. a Forms rule on a no-form landing page) or it belongs to a deferred category. |
| manual | The rule cannot be decided from code alone and has no automated or unit assertion in the current test matrix. |

`manual` is never the same as `pass`. A rule that is `manual` today is a known gap, not a green check.

## 4. Findings

### 4.1 Interactions

| Surface | Rule | Status | Evidence | Note |
| --- | --- | --- | --- | --- |
| Public consent | Tap targets ≥ 24 CSS px | manual | n/a | Axe flags semantics, not pixel size. No `getBoundingClientRect` assertion exists. |
| Public consent | Visible focus indicator | manual | n/a | Focus styling is defined in `globals.css`; no test asserts visibility. |
| Public consent | `prefers-reduced-motion` honored | manual | n/a | Honored in components; not asserted (see `docs/reference/accessibility.md` §5). |
| Kiosk flow | Tap targets ≥ 44 CSS px on kiosk screens | manual | n/a | Reflow at 640 px is asserted; pixel-size check is not. |
| Kiosk flow | `prefers-reduced-motion` honored | manual | n/a | Honored in components; not asserted. |
| Kiosk flow | Dialog focus loop (Tab / Shift+Tab wrap, Escape closes) | pass | cited | `tests/block-e-a11y-smoke.test.tsx` (cited from `docs/reference/accessibility.md` §2.2). |
| Admin login | No keyboard trap on form | manual | n/a | Not asserted (no admin auth smoke). |
| Offline / error | Single static action, no timed redirect | manual | n/a | No automated test for redirect behavior. |

### 4.2 Forms

| Surface | Rule | Status | Evidence | Note |
| --- | --- | --- | --- | --- |
| Public consent | Inputs have visible labels | na | n/a | No input on this surface. |
| Kiosk flow | Inputs have associated `<label>` | manual | n/a | Unit tests cover dialog semantics, not sequential form labels. |
| Kiosk flow | Errors described in text | manual | n/a | Manual gap in `docs/reference/accessibility.md` §5. |
| Kiosk flow | `autocomplete` for known input purpose | manual | n/a | Manual gap. |
| Kiosk flow | Sequential tab order across steps | manual | n/a | Manual gap. |
| Admin login | Inputs have associated `<label>` | manual | n/a | Axe runs; label association is not a separate assertion. |
| Admin login | Errors described in text | manual | n/a | Not asserted. |
| Offline / error | n/a | na | n/a | No form on this surface. |

### 4.3 Content

| Surface | Rule | Status | Evidence | Note |
| --- | --- | --- | --- | --- |
| Public consent | Single `<h1>` per page | pass | cited | `tests/block-e-a11y-smoke.test.tsx` asserts the public `<h1>` (cited from `docs/reference/accessibility.md` §2.2). |
| Public consent | Reading order matches DOM order | pass | cited | Static-markup smoke covers FAQ `<dl>` and flow cards (cited from `docs/reference/accessibility.md` §2.2). |
| Kiosk flow | Page-level landmarks (`<main>`, `<nav>`, `<header>`) | manual | n/a | Modal markup is asserted; full-page landmark assertion is not. |
| Kiosk flow | Locale-correct strings (no Lorem Ipsum) | pass | code-reviewed | Real Spanish strings in the source tree (e.g. `Ingreso`, `Verificacion`, `Consentimiento`). `next.config.ts` does not enable i18n; the kiosk is Spanish-only by design. |
| Kiosk flow | Status messages announced (`role="status"` / `aria-live`) | manual | n/a | Manual gap (WCAG 4.1.3 in `docs/reference/accessibility.md` §6). |
| Admin login | Single `<h1>` per page | manual | n/a | Form renders directly; not asserted. |
| Admin login | Locale-correct strings | pass | code-reviewed | Real Spanish strings on the admin login route. |
| Offline / error | Page has an `<h1>` describing the state | manual | n/a | Not asserted. |

### 4.4 Layout

| Surface | Rule | Status | Evidence | Note |
| --- | --- | --- | --- | --- |
| Public consent | Reflows at 320 CSS px (no 2-D scroll) | pass | cited | Playwright reflow assertion at 640 px (`playwright/accessibility.a11y.ts`, cited from `docs/reference/accessibility.md` §2.1). |
| Public consent | Content reflows at 200% zoom | fail | code-reviewed | See §5.1 — viewport config disables user scaling. |
| Kiosk flow | Reflows at 320 CSS px | pass | cited | Playwright reflow assertion covers the kiosk routes (cited from `docs/reference/accessibility.md` §2.1). |
| Kiosk flow | Skip-to-content link as first focusable element | fail | code-reviewed | See §5.2 — no skip link exists in the current source. |
| Admin login | Reflows at 320 CSS px | pass | cited | Playwright reflow assertion covers `/admin/login` (cited from `docs/reference/accessibility.md` §2.1). |
| Admin login | Skip-to-content link present | fail | code-reviewed | See §5.2 — same global FAIL applies. |
| Offline / error | Reflows at 320 CSS px | pass | cited | Playwright reflow assertion covers `/offline` (cited from `docs/reference/accessibility.md` §2.1). |
| Offline / error | Skip-to-content link present | fail | code-reviewed | See §5.2 — same global FAIL applies. |

## 5. Concrete FAILs (code-reviewed)

### 5.1 FAIL — `userScalable: false` blocks 200% zoom

| Field | Value |
| --- | --- |
| WIG category | Layout (reflow + resize text) |
| Surface | All — global viewport config |
| Source | `src/app/layout.tsx:91-97` (Next.js `viewport` export) |
| Why it fails | The exported `Viewport` object sets `maximumScale: 1` and `userScalable: false`, which together prevent mobile users from pinching to zoom. The Playwright reflow test runs against the rendered DOM at 640 px, not against the device's pinch behavior, so this configuration is not caught by the existing matrix. |
| Fix path | Drop `maximumScale: 1` and `userScalable: false` from the viewport export, re-verify the kiosk flow on a real device, and add a Playwright assertion that the served viewport meta allows user scaling. Tracked as a follow-up. |

### 5.2 FAIL — no skip-to-content link in any layout

| Field | Value |
| --- | --- |
| WIG category | Layout (bypass blocks) |
| Surface | All — global absence |
| Source | Repo-wide grep for `skip-link`, `SkipToContent`, `skip_to_content`, and `skip.*content` returns zero matches in `src/`, `app/`, or the root layout. |
| Why it fails | Keyboard-only and screen-reader users have no first-stop shortcut to the page main content. The WIG layout rule for a bypass block is violated, and the corresponding WCAG 2.4.1 row is already logged as a manual gap in `docs/reference/accessibility.md` §5. |
| Fix path | Add a visually-hidden-until-focused skip link as the first focusable child of the root layout, target it at the `<main>` landmark, and add a Playwright assertion for its presence and focus target. Tracked as a follow-up. |

## 6. Honest gaps (not in this audit)

The items below are not part of the WIG tables above but are the manual gaps this audit re-uses without relabeling — see `docs/reference/accessibility.md` §5 for the source of truth:

- No Axe run on admin post-login routes.
- No touch-target pixel assertion anywhere (reflow is asserted, `getBoundingClientRect` is not).
- No contrast assertion at 200% zoom or in forced-colors mode.
- No screen-reader walk recorded in this repo.
- No `prefers-reduced-motion` assertion in the current test matrix.
- No sequential form tab-order assertion for kiosk multi-step forms.

## 7. How to re-run this audit in a future slice

1. Open this file alongside the linked sources (`src/app/layout.tsx`, `playwright/accessibility.a11y.ts`, `tests/block-e-a11y-smoke.test.tsx`) at the new commit.
2. Re-verify each pass / fail entry by reading the cited line(s).
3. Convert any `manual` entry that gained an automated assertion into pass or fail with the new evidence type.
4. Move the **Categories deferred** list (§1.1) into a new section once their evidence paths exist.
5. Update the `Audit date` block at the top of this file. Do not erase the historical date — spec R23 uses the last-reviewed date for the stale-audit gate.

## 8. Reference links

- `docs/reference/accessibility.md` — source of truth for the manual gaps and the automated a11y matrix cited above.
- `docs/runbooks/seo-ai-seo-validation-checklist.md` — release-time a11y smoke notes.
- `playwright/accessibility.a11y.ts` — automated a11y matrix (Axe, reflow, keyboard, hydration).
- `tests/block-e-a11y-smoke.test.tsx` — static and dialog-helper unit tests.
- `src/app/layout.tsx` — root layout; cited in §5.1.
- `docs/portfolio/screenshots/capture-foundation.md` — capture harness used to revisit surface visuals.
