/**
 * Playwright Coverage Gap Analysis — Slice 4 (RED phase)
 *
 * This test DEFINES the truth the gap analysis must satisfy.
 * It parses existing Playwright test files to extract covered routes,
 * compares them against all page routes in src/app/, and asserts that
 * the documented gaps match reality.
 *
 * The test WILL FAIL until the gap analysis implementation is written (GREEN phase).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { describe, expect, it } from 'bun:test'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = join(import.meta.dir, '..')
const PLAYWRIGHT_DIR = join(PROJECT_ROOT, 'playwright')
const APP_DIR = join(PROJECT_ROOT, 'src', 'app')

// ---------------------------------------------------------------------------
// Helpers — extract covered routes from Playwright test files
// ---------------------------------------------------------------------------

interface RouteCoverage {
  route: string
  covered: boolean
  coveredBy: string[]
  notes: string
}

function extractGotoCalls(content: string): string[] {
  const paths: string[] = []
  // Match page.goto('...') or page.goto("...")
  const gotoRegex = /page\.goto\(['"`]([^'"`]+)['"`]\)/g
  let match: RegExpExecArray | null
  while ((match = gotoRegex.exec(content)) !== null) {
    paths.push(match[1]!)
  }
  // Also match page.goto(URL) with variable, we only catch string literals
  return paths
}

function extractTestFileRoutes(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8')
  const gotoPaths = extractGotoCalls(content)
  // Normalize: remove leading slash, dedupe
  return [...new Set(gotoPaths.map((p) => p.replace(/^\/+/, '')))]
}

function findAllPageRoutes(appDir: string): string[] {
  const routes: string[] = []

  function walk(dir: string, base: string) {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        // Skip route groups: (kiosk), (admin), (public) — they don't appear in URLs
        if (/^\([^)]+\)$/.test(entry.name)) {
          walk(fullPath, base)
        } else {
          walk(fullPath, base ? `${base}/${entry.name}` : entry.name)
        }
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        // Build route path
        let routePath = base
          .replace(/[\\]/g, '/')
          .replace(/\[([^\]]+)\]/g, ':$1')

        if (routePath === '') routePath = '/' // Root
        else routePath = '/' + routePath.replace(/\/+/g, '/')

        routes.push(routePath)
      }
    }
  }

  walk(appDir, '')
  return [...new Set(routes)].sort()
}

function normalizePath(p: string): string {
  return p.replace(/^\/+/, '').replace(/\/+$/, '')
}

function routeMatches(route: string, testPath: string): boolean {
  const r = normalizePath(route)
  const t = normalizePath(testPath)

  // Root path — only matches root, nothing else
  // r='', t='' → root matches root → true
  // r='admin', t='' → admin does NOT match root → false
  // r='', t='admin/login' → root does NOT match admin/login → false
  if (r === '' && t === '') return true
  if (r === '' || t === '') return false

  // Exact match
  if (r === t) return true

  // Sub-path match: /admin/login is covered by a test that visits /admin/login
  // /admin/login/foo is covered by a test visiting /admin/login
  if (r.startsWith(t + '/')) return true

  return false
}

function buildCoverageMatrix(
  allRoutes: string[],
  coveredPaths: string[],
): RouteCoverage[] {
  const normalizedCovered = coveredPaths.map(normalizePath)

  return allRoutes.map((route) => {
    const matchingFiles: string[] = []

    for (const testFile of ['accessibility.a11y.ts', 'portfolio-homepage-optimization.a11y.ts', 'signature-canvas-warning.a11y.ts']) {
      const filePath = join(PLAYWRIGHT_DIR, testFile)
      if (!existsSync(filePath)) continue
      const testRoutes = extractTestFileRoutes(filePath)

      if (testRoutes.some((tr) => routeMatches(route, tr))) {
        matchingFiles.push(testFile)
      }
    }

    return {
      route,
      covered: matchingFiles.length > 0,
      coveredBy: matchingFiles,
      notes: '',
    }
  })
}

// ---------------------------------------------------------------------------
// Critical Paths — defined by the spec
// ---------------------------------------------------------------------------

const CRITICAL_PATHS = {
  KIOSK_FLOW: ['/ingreso', '/otp', '/consentimiento', '/exito'],
  ADMIN_FLOW: ['/admin/login', '/admin'],
  PUBLIC_CONSENT: ['/consentimiento-digital'],
} as const

const HIGH_RISK_GAPS_EXPECTED = ['/otp', '/exito']

// ---------------------------------------------------------------------------
// Tests — RED phase (will fail until GREEN)
// ---------------------------------------------------------------------------

describe('Playwright Coverage Gap Analysis (Slice 4)', () => {
  const allRoutes = findAllPageRoutes(APP_DIR)

  // Collect all covered paths from all test files
  const testFiles = ['accessibility.a11y.ts', 'portfolio-homepage-optimization.a11y.ts', 'signature-canvas-warning.a11y.ts']
  let allCoveredPaths: string[] = []
  for (const testFile of testFiles) {
    const filePath = join(PLAYWRIGHT_DIR, testFile)
    if (existsSync(filePath)) {
      allCoveredPaths = allCoveredPaths.concat(extractTestFileRoutes(filePath))
    }
  }
  const uniqueCoveredPaths = [...new Set(allCoveredPaths)]

  const matrix = buildCoverageMatrix(allRoutes, uniqueCoveredPaths)
  const coveredRoutes = matrix.filter((r) => r.covered).map((r) => r.route)
  const uncoveredRoutes = matrix.filter((r) => !r.covered).map((r) => r.route)

  // -------------------------------------------------------------------
  // 4.1a — Assert all page routes are enumerated (safety: no stale list)
  // -------------------------------------------------------------------
  it('enumerates all src/app/ page routes (≥ 14 pages)', () => {
    expect(allRoutes.length).toBeGreaterThanOrEqual(14)
    // Sanity: known routes must appear
    expect(allRoutes).toContain('/')
    expect(allRoutes).toContain('/ingreso')
    expect(allRoutes).toContain('/otp')
    expect(allRoutes).toContain('/consentimiento')
    expect(allRoutes).toContain('/exito')
    expect(allRoutes).toContain('/registro')
    expect(allRoutes).toContain('/consentimiento-digital')
    expect(allRoutes).toContain('/admin/login')
    expect(allRoutes).toContain('/offline')
  })

  // -------------------------------------------------------------------
  // 4.1b — Identify covered routes with specific test file provenance
  // -------------------------------------------------------------------
  it('documents which routes have Playwright coverage and from which files', () => {
    const coveredSet = new Set(coveredRoutes)

    // Routes that MUST be covered based on the existing test surface
    expect(coveredSet.has('/')).toBe(true)
    expect(coveredSet.has('/consentimiento-digital')).toBe(true)
    expect(coveredSet.has('/offline')).toBe(true)
    expect(coveredSet.has('/ingreso')).toBe(true)
    expect(coveredSet.has('/admin/login')).toBe(true)

    // Verify coveredBy attribution is not empty for covered routes
    for (const entry of matrix) {
      if (entry.covered) {
        expect(entry.coveredBy.length).toBeGreaterThan(0)
      }
    }
  })

  // -------------------------------------------------------------------
  // 4.1c — High-risk uncovered routes must be explicitly documented
  // -------------------------------------------------------------------
  it('identifies /otp and /exito as high-risk gaps (kiosk critical path)', () => {
    for (const gap of HIGH_RISK_GAPS_EXPECTED) {
      expect(uncoveredRoutes).toContain(gap)
    }
    // Verify these are part of the kiosk critical path
    for (const step of CRITICAL_PATHS.KIOSK_FLOW) {
      expect(allRoutes).toContain(step)
    }
    // /ingreso is covered
    expect(coveredRoutes).toContain('/ingreso')
    // /consentimiento is covered (via seedAuthenticatedKioskSession + goto)
    const consentEntry = matrix.find((r) => r.route === '/consentimiento')
    expect(consentEntry?.covered).toBe(true)
  })

  // -------------------------------------------------------------------
  // 4.1d — Admin dashboard beyond login is uncovered
  // -------------------------------------------------------------------
  it('documents admin protected routes as uncovered beyond /admin/login', () => {
    const adminUncovered = uncoveredRoutes.filter((r) => r === '/admin' || r.startsWith('/admin/'))
    // At minimum, admin dashboard and protected routes should be uncovered
    expect(adminUncovered.length).toBeGreaterThanOrEqual(2)
    expect(adminUncovered).toContain('/admin')
  })

  // -------------------------------------------------------------------
  // 4.1e — Public consent route has coverage
  // -------------------------------------------------------------------
  it('confirms /consentimiento-digital is covered (public consent critical path)', () => {
    expect(coveredRoutes).toContain('/consentimiento-digital')
  })

  // -------------------------------------------------------------------
  // 4.1f — Coverage matrix is complete (no undefined entries)
  // -------------------------------------------------------------------
  it('produces a complete coverage matrix with no undefined entries', () => {
    expect(matrix.length).toBe(allRoutes.length)
    for (const entry of matrix) {
      expect(entry.route).toBeTruthy()
      expect(typeof entry.covered).toBe('boolean')
      expect(Array.isArray(entry.coveredBy)).toBe(true)
      expect(typeof entry.notes).toBe('string')
    }
  })

  // -------------------------------------------------------------------
  // 4.1g — Gap document artifact exists (playwright coverage gap analysis)
  // -------------------------------------------------------------------
  const docPath = join(PROJECT_ROOT, 'docs', 'reference', 'playwright-coverage.md')
  it('gap analysis document exists at docs/reference/playwright-coverage.md', () => {
    expect(existsSync(docPath)).toBe(true)
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Content validation — document contains required sections
  // -------------------------------------------------------------------
  it('gap analysis document contains all required section headers', () => {
    expect(existsSync(docPath)).toBe(true)
    const content = readFileSync(docPath, 'utf8')

    const requiredSections = [
      '# Playwright Coverage Gap Analysis',
      '## 1. Current coverage',
      '## 2. Route coverage matrix',
      '### 2.1 Covered routes',
      '### 2.2 Uncovered routes',
      '## 3. Critical path analysis',
      '### 3.1 Kiosk flow',
      '### 3.2 Admin flow',
      '### 3.3 Public consent flow',
      '## 4. Risk-based recommendations',
    ]

    for (const section of requiredSections) {
      expect(content).toContain(section)
    }
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Content validation — HIGH-risk gaps are named
  // -------------------------------------------------------------------
  it('gap document explicitly names /otp and /exito as HIGH risk gaps', () => {
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('/otp')
    expect(content).toContain('/exito')
    expect(content).toContain('HIGH')
    // Both should appear in the uncovered routes table
    const uncoveredSection = content.split('### 2.2 Uncovered routes')[1]?.split('###')[0] ?? ''
    expect(uncoveredSection).toContain('/otp')
    expect(uncoveredSection).toContain('/exito')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Kiosk critical path steps are correctly enumerated
  // -------------------------------------------------------------------
  it('kiosk critical path (ingreso → otp → consentimiento → exito) spans 4 steps', () => {
    expect(CRITICAL_PATHS.KIOSK_FLOW).toHaveLength(4)
    expect(CRITICAL_PATHS.KIOSK_FLOW).toEqual(['/ingreso', '/otp', '/consentimiento', '/exito'])

    // All 4 steps must exist as page routes
    for (const step of CRITICAL_PATHS.KIOSK_FLOW) {
      expect(allRoutes).toContain(step)
    }
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Route groups do not leak into coverage matrix
  // -------------------------------------------------------------------
  it('no route group names (kiosk, admin, public) appear in coverage matrix', () => {
    for (const entry of matrix) {
      expect(entry.route).not.toContain('(kiosk)')
      expect(entry.route).not.toContain('(admin)')
      expect(entry.route).not.toContain('(public)')
    }
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Verify no false positives — uncovered routes are truly untested
  // -------------------------------------------------------------------
  it('admin protected routes are truly uncovered except /admin/login', () => {
    // /admin/login IS covered
    expect(coveredRoutes).toContain('/admin/login')
    // All other admin routes are uncovered
    const adminCoveredButLogin = coveredRoutes.filter(
      (r) => r.startsWith('/admin/') && r !== '/admin/login',
    )
    expect(adminCoveredButLogin).toEqual([])

    // /admin itself is uncovered
    expect(uncoveredRoutes).toContain('/admin')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Helper functions are documented in the gap analysis
  // -------------------------------------------------------------------
  it('gap document references the 4 Playwright helper functions', () => {
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('seedAuthenticatedKioskSession')
    expect(content).toContain('expectNoAxeViolations')
    expect(content).toContain('readViewportOverflow')
    expect(content).toContain('collectHydrationSignals')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Test file count and total test count are accurate
  // -------------------------------------------------------------------
  it('gap document references the correct number of test files and tests', () => {
    const content = readFileSync(docPath, 'utf8')
    // Should mention 3 test files and 10 tests
    expect(content).toContain('3 files')
    expect(content).toContain('10 tests')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: Regression guard — this very test file is referenced
  // -------------------------------------------------------------------
  it('gap document references this regression guard test file', () => {
    const content = readFileSync(docPath, 'utf8')
    expect(content).toContain('tests/playwright-coverage-gap-analysis.test.ts')
  })
})
