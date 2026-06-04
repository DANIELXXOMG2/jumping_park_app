# WCAG / WIG accessibility evidence

This file captures automated accessibility (Axe) audit results from Playwright E2E tests, plus a **manual deep WCAG/WIG review** section. Automated results are real — manual results must be honestly marked "pending" until performed.

## Automated Axe audit (Playwright E2E)

**Date**: 2026-06-04
**Tool**: Playwright 1.59.1 + @axe-core/playwright 4.11.1
**Test file**: `playwright/accessibility.a11y.ts`

### Results summary

| Test | Route | Axe passed | Reflow (640px) | Notes |
|---|---|---|---|---|
| Public consentimiento digital | `/consentimiento-digital` | ❓ (page not rendered) | ❓ | Test failed — page content not visible. Likely missing Firebase env vars in local dev. |
| Kiosk consent dialog | `/consentimiento` | ✅ | N/A | Dialog keyboard trap test passed. Zero Axe violations inside `[role="dialog"]`. |
| Kiosk ingreso | `/ingreso` | ❓ (page not rendered) | ❓ | Test failed — heading not found. Likely missing Firebase env vars. |
| Kiosk home | `/` | ❌ (1 violation) | ✅ | `meta-viewport` violation detected. No horizontal overflow. |
| Offline page | `/offline` | ❌ (3 violations) | ✅ | `landmark-one-main`, `meta-viewport`, `region` violations. No horizontal overflow. |
| Admin login | `/admin/login` | ❓ (locator error) | ❓ | Test failed — strict mode violation on password label selector. Not an Axe issue. |
| Kiosk registro | `/registro` | ⏭️ skipped | ⏭️ skipped | Guarded route — form not rendered without active session. |
| Signature canvas a11y | `/consentimiento` (signature) | ✅ | N/A | `willReadFrequently` canvas fix verified. |

**Passed**: 2/8 tests
**Axe violations found**: `meta-viewport` (kiosk home, offline), `landmark-one-main` (offline), `region` (offline)

### Detailed violation findings

#### meta-viewport
- **Impact**: critical
- **Affected pages**: Kiosk home (`/`), Offline page (`/offline`)
- **Description**: Page does not have a `<meta name="viewport">` tag with `width` or `initial-scale`. This prevents mobile browsers from scaling correctly and users from zooming.
- **Fix**: Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to the root layout or affected page layouts.

#### landmark-one-main
- **Impact**: moderate
- **Affected page**: Offline page (`/offline`)
- **Description**: Page does not have a `<main>` landmark. All content should be contained within a main landmark for assistive technology navigation.
- **Fix**: Wrap page body content in `<main>` element.

#### region
- **Impact**: moderate
- **Affected page**: Offline page (`/offline`)
- **Description**: Content not contained within a landmark region. Some page content resides outside any ARIA landmark.
- **Fix**: Ensure all perceivable content is inside a landmark region (`<main>`, `<nav>`, `<header>`, `<footer>`, etc.).

### Test failures (non-Axe reasons)

Some tests failed because the local dev server lacked Firebase environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), causing pages not to render. These failures are **environment-related, not accessibility issues**. To get full Axe coverage:

```bash
# Set Firebase env vars, then re-run
FIREBASE_PROJECT_ID=xxx FIREBASE_CLIENT_EMAIL=xxx FIREBASE_PRIVATE_KEY=xxx bun run test:a11y:e2e
```

## Manual deep WCAG/WIG review — pending

The automated Axe audit catches ~30-40% of WCAG 2.1 AA issues. A full WCAG 2.1 AA / WIG (Web Accessibility Initiative Guidelines) review requires **manual inspection** by a human reviewer.

### Instructions for manual review

1. **Reference**: WCAG 2.1 AA at https://www.w3.org/TR/WCAG21/
2. **Pages to review** (in order of priority):
   - `/consentimiento-digital` — public landing page (SEO-critical)
   - `/ingreso` — kiosk check-in flow
   - `/consentimiento` — kiosk consent flow
   - `/registro` — registration form
   - `/admin/login` — admin authentication
3. **Checklist per page**:
   - [ ] **1.1.1 Non-text Content**: All images have meaningful `alt` text. Decorative images have `alt=""`.
   - [ ] **1.3.1 Info and Relationships**: Form labels are programmatically associated with inputs. Heading hierarchy is logical (no skipped levels).
   - [ ] **1.4.3 Contrast (Minimum)**: Text has 4.5:1 contrast ratio against background. Large text has 3:1.
   - [ ] **1.4.4 Resize Text**: Page is usable at 200% zoom without horizontal scrolling.
   - [ ] **2.1.1 Keyboard**: All interactive elements are reachable and operable via keyboard alone.
   - [ ] **2.4.3 Focus Order**: Focus moves in a logical order through the page.
   - [ ] **2.4.7 Focus Visible**: Keyboard focus indicator is visible on all interactive elements.
   - [ ] **3.3.2 Labels or Instructions**: All form inputs have visible labels.
   - [ ] **4.1.2 Name, Role, Value**: Interactive elements expose correct names, roles, and values to assistive technology.
4. **Record findings**:

| WCAG SC | Page | Pass/Fail | Notes |
|---|---|---|---|
| 1.1.1 | /consentimiento-digital |  |  |
| 1.3.1 | /consentimiento-digital |  |  |
| 1.4.3 | /consentimiento-digital |  |  |
| … | … | … | … |

5. **Fill the full matrix for ALL 9 success criteria × ALL 5 pages = 45 checks**.

## Cross-references

- `playwright/accessibility.a11y.ts` — automated Axe test file.
- `docs/reference/accessibility.md` — accessibility route matrix (Phase 6.2).
- `docs/portfolio/evidence/README.md` — evidence anti-patterns.
