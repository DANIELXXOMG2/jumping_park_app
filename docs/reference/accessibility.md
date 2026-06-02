# Accessibility Coverage

> **Status**: current
> **Audit date**: 2026-06-02
> **Diátaxis**: Reference
> **Linked sources**: `playwright/accessibility.a11y.ts`, `playwright/helpers.ts`, `playwright.config.ts`, `tests/block-e-a11y-smoke.test.tsx`, `src/lib/a11y/dialog.ts`, `lighthouserc.json`, `package.json`

This reference describes what Jumping Park tests for accessibility today, what it does not, and the next honest coverage targets. Per spec **R11**, automated and manual coverage are kept separate so the doc never overclaims a compliance posture that the current test matrix cannot prove.

## 1. Coverage scope

The Jumping Park project runs three accessibility-related layers:

| Layer | What it covers today | What it does NOT cover today |
| --- | --- | --- |
| Browser automation — Playwright + Axe | Axe rule scan + keyboard flow + 200% reflow on selected kiosk and public routes | Every admin route, every error state, every authenticated admin sub-view, screen-reader walks, color-contrast measured at 200% zoom, touch targets |
| Static markup — unit tests | Landmarks, dialog semantics, focus-loop helpers, and consent-public critical markup via `renderToStaticMarkup` | Lint-time JSX rules, real ARIA validation against the live DOM, role/attribute coverage on admin screens |
| Lighthouse CI | Performance, SEO, accessibility category score, best-practices, LCP, TBT, CLS — on `/consentimiento-digital` only | Other routes; production-only runs (preview deploys are not asserted in the Lighthouse workflow today) |

A "covered" label in this document only ever means: the listed test path has a passing run recorded for the current code. It does not imply WCAG 2.1 AA conformance.

## 2. Automated coverage

Source files: `playwright/accessibility.a11y.ts`, `tests/block-e-a11y-smoke.test.tsx`, `playwright/signature-canvas-warning.a11y.ts`.

### 2.1 Browser smoke matrix

| Route | Axe scan | 200% reflow (640px) | Keyboard / focus flow | Hydration check | Source file |
| --- | --- | --- | --- | --- | --- |
| `/consentimiento-digital` | Yes | Yes | No (no interactive dialog) | No | `playwright/accessibility.a11y.ts` |
| `/ingreso` | Yes (this slice) | Yes (this slice) | No | Yes (this slice keeps the existing check) | `playwright/accessibility.a11y.ts` |
| `/` (kiosk home) | Yes (this slice) | Yes (this slice) | No | No | `playwright/accessibility.a11y.ts` |
| `/offline` | Yes (this slice) | Yes (this slice) | No | No | `playwright/accessibility.a11y.ts` |
| `/admin/login` | Yes (this slice) | Yes (this slice) | No | No (form renders directly) | `playwright/accessibility.a11y.ts` |
| `/registro` | Conditional (this slice — only if the form renders) | Conditional | No | No | `playwright/accessibility.a11y.ts` |
| `/consentimiento` (kiosk consent dialog) | Yes (scoped to `[role="dialog"]`) | Not asserted | Yes — Tab/Shift+Tab focus loop, Escape closes, focus returns to the trigger | Yes | `playwright/accessibility.a11y.ts` |
| `/consentimiento` — signature canvas | Console-warning check only (no Axe) | Not asserted | Mouse-driven | Not asserted | `playwright/signature-canvas-warning.a11y.ts` |

`/registro` is conditional because the route renders a "missing cedula" guard screen when the kiosk store has no active session, instead of the registration form. The test only runs Axe/reflow when the form heading is present.

### 2.2 Static and unit coverage

| Source under test | What is checked | Source file |
| --- | --- | --- |
| Public `/consentimiento-digital` markup | `<main>`, `<h1>`, FAQ `<dl>`, three `aria-labelledby` flow cards, `data-animated-section="hero"` | `tests/block-e-a11y-smoke.test.tsx` |
| Kiosk consent `<Modal>` markup | `role="dialog"`, `aria-modal="true"`, accessible name, `role="document"` | `tests/block-e-a11y-smoke.test.tsx` |
| Dialog focus-loop helper | Shift+Tab wraps `first → last`; Tab wraps `last → first`; null active-element falls back to first or last | `tests/block-e-a11y-smoke.test.tsx` |
| Hydration warnings on `/ingreso` and dialog flow | No `hydration` / `didn't match the client` console or page errors | `playwright/accessibility.a11y.ts` (via `collectHydrationSignals`) |

## 3. Lighthouse CI

`lighthouserc.json` is the assertion source. The Lighthouse workflow (`.github/workflows/lighthouse.yml`) builds the app and runs `bun x lhci autorun` against a single canonical URL.

| Target | Score gate | Reason |
| --- | --- | --- |
| `/consentimiento-digital` accessibility category | `minScore: 0.9` (error) | Only the public SEO surface is asserted today; kiosk and admin routes are intentionally not in the Lighthouse URL list. |
| Same URL: performance, best-practices, SEO | `minScore: 0.8` / `0.9` / `0.9` | Performance/quality budgets, not a11y evidence. |
| LCP / TBT / CLS | Numeric budgets | Performance budgets, not a11y evidence. |

The Lighthouse artifacts upload to `temporary-public-storage`, which expires. Lighthouse is therefore a **gate**, not durable evidence; committed evidence (when produced) belongs in `docs/portfolio/evidence/`, not in this reference.

## 4. Commands to run automated checks

| Need | Command | Notes |
| --- | --- | --- |
| Browser a11y smoke (Axe + reflow + keyboard flow + hydration) | `bun run test:a11y:e2e` | Uses `playwright.config.ts`; starts `bun dev`; targets `playwright/*.a11y.ts`. |
| Browser a11y smoke (single file) | `bunx playwright test --config=playwright.config.ts playwright/accessibility.a11y.ts` | Useful when iterating on a single route. |
| Static + unit a11y checks | `bun test tests/block-e-a11y-smoke.test.tsx` | Runs the `renderToStaticMarkup` and dialog-helper assertions. |
| All static and unit tests | `bun test` | The default regression pass; includes the a11y unit checks. |
| Install Playwright browsers (first local run) | `bun run playwright:install` | One-time per machine. |
| Lighthouse assertion (matches CI) | `bun x lhci autorun --config=./lighthouserc.json` | Requires a built app and the public URL to be reachable. |

`bun run test:a11y:e2e` is intentionally **not** part of `.github/workflows/ci.yml` today. It runs locally and as part of `bun run check:phase5`.

## 5. Manual coverage gaps

These are the routes, interactions, and WCAG criteria that are NOT yet exercised by automation. They remain manual until a corresponding automated test is added.

| Area | Why it is manual today | Where the gap shows up |
| --- | --- | --- |
| Admin post-login screens | Browser automation does not sign in as an admin; all admin routes after `/admin/login` are manual | `/admin/usuarios`, `/admin/consentimientos`, `/admin/menores`, `/admin/roles`, `/admin/dashboard`, `/admin/settings/consent` |
| OTP flow under degraded states | Browser automation only seeds a "happy path" kiosk session; lockout, throttling, and resend paths are manual | `/otp` (locked, throttled, expired challenge) |
| Consent error paths | The browser smoke covers the dialog happy path only | `/consentimiento` (validation errors, network failure, signature rejection) |
| Touch target sizing at 200% zoom | Reflow is asserted, but measured touch-target size (≥ 44×44 CSS px) is not | Every interactive surface |
| Color contrast at 200% zoom and high-contrast mode | Axe covers default contrast at the configured viewport; 200% contrast and forced-colors are not asserted | Every route |
| Screen reader walks (NVDA / VoiceOver) | No assistive-tech automation in this repo | Public consent, kiosk flow, admin login, admin tables |
| Reduced motion compliance | `prefers-reduced-motion` is honored in components, but no automated test asserts the fallbacks | Kiosk home animated background, modals, signature canvas |
| Keyboard tab order on multi-step kiosk forms | Dialog focus loop is asserted; sequential form tab order is not | `/ingreso`, `/otp`, `/consentimiento` form, `/registro` |
| Mobile / touch kiosk | Tests run at 640px and the default 1280px; true phone and tablet sizes are not asserted | Kiosk flows at 360–414px and 768–1024px |

## 6. WCAG 2.1 AA matrix — current state

A row is "automated" only when the corresponding test path exists in this repo today. A "manual" row is honest about the current gap.

| WCAG criterion (2.1 AA) | What it means here | Status |
| --- | --- | --- |
| 1.1.1 Non-text content | Alt text for images; `aria-hidden` on decorative spans | Automated on the routes in §2.1; manual everywhere else |
| 1.3.1 Info and relationships | Landmarks, headings, labels, lists | Automated (`<main>`, `<h1>`, `<dl>`, `aria-labelledby` smoke); manual on admin screens |
| 1.3.5 Identify input purpose | `autocomplete` on form fields | Manual across `/ingreso`, `/registro`, `/admin/login` |
| 1.4.3 Contrast (minimum) | 4.5:1 text contrast | Automated by Axe on the routes in §2.1; manual on 200% zoom and forced-colors |
| 1.4.4 Resize text | Content reflows at 200% zoom | Automated on the routes in §2.1 (640px viewport) |
| 1.4.10 Reflow | No two-dimensional scrolling at 320 CSS px width | Automated on the routes in §2.1; not yet extended to all routes |
| 1.4.11 Non-text contrast | UI components and focus indicators | Manual |
| 1.4.12 Text spacing | Survives increased letter/line/word spacing | Manual |
| 1.4.13 Content on hover or focus | Tooltips and popovers stay accessible | Manual |
| 2.1.1 Keyboard | All functionality via keyboard | Automated for the kiosk consent dialog; manual for every form |
| 2.1.2 No keyboard trap | Dialog focus loop; no traps elsewhere | Automated for the dialog (`getDialogFocusLoopTarget`) |
| 2.4.3 Focus order | Logical reading and tab order | Manual on multi-step kiosk forms |
| 2.4.6 Headings and labels | Headings describe topic; labels describe purpose | Automated (`<h1>` and `aria-labelledby` smoke); manual on admin screens |
| 2.4.7 Focus visible | Visible focus indicator | Manual |
| 2.5.1 Pointer gestures | Multipart or path-based gestures have a single-tap alternative | Manual (signature canvas) |
| 2.5.2 Pointer cancellation | Click down/up is cancelable | Manual |
| 2.5.4 Motion actuation | Device motion has an alternative and a way to disable | Not applicable (no motion-actuated features) |
| 3.3.1 Error identification | Errors described in text | Manual |
| 3.3.2 Labels or instructions | Inputs have labels | Manual on form screens |
| 3.3.7 Redundant entry | Previously entered info is auto-populated or available | Manual (kiosk step 2 → 3 carry-over) |
| 4.1.2 Name, role, value | Custom widgets expose state | Automated for `<Modal>` (role/aria-modal/aria-labelledby); manual elsewhere |
| 4.1.3 Status messages | `role="status"` / `aria-live` regions | Manual |

## 7. Next honest coverage targets

The list below is ordered by cost and reviewer confidence. Each item adds a concrete, runnable test path that future slices can pick up without redoing the analysis.

1. Add an Axe + reflow test for `/exito` and `/otp` once the kiosk happy path is fully reproducible in automation.
2. Add an authenticated admin smoke run (after deciding on a safe admin auth harness — see `scripts/capture-screenshots.ts` for the capture-time pattern) and extend Axe coverage to one admin list and one admin detail route.
3. Assert `prefers-reduced-motion` fallbacks on the kiosk home background and the consent dialog open transition.
4. Add a forced-colors / high-contrast Axe rule pass and an explicit 200% zoom contrast check on the routes in §2.1.
5. Add a screen-reader smoke (e.g. `@axe-core/playwright` plus a tagged accessibility snapshot) for `/consentimiento-digital` and the kiosk consent dialog.
6. Move the `bun run test:a11y:e2e` command into `.github/workflows/ci.yml` once the admin smoke is trustworthy enough to gate merges.

## 8. Reference links

- `docs/runbooks/seo-ai-seo-validation-checklist.md` — release checklist that also captures a11y smoke notes.
- `docs/guides/testing.md` — testing pyramid, tooling map, and CI integration for the same commands.
- `tests/block-e-a11y-smoke.test.tsx` — static and dialog-helper unit tests.
- `playwright/accessibility.a11y.ts` — browser smoke matrix.
- `lighthouserc.json` — Lighthouse assertion source.
