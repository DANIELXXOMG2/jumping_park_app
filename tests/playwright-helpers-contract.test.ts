/**
 * Playwright Helpers Contract — Slice 4 (RED phase, task 4.2)
 *
 * Approval test capturing the existing Playwright helper API contract
 * before refactoring. Verifies:
 * 1. Existing helper functions maintain their signatures
 * 2. New BasePage class provides expected API surface
 * 3. Refactored helpers.ts exports everything correctly
 *
 * WILL FAIL until BasePage and refactored helpers are implemented.
 */

import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PROJECT_ROOT = join(import.meta.dir, '..')
const PLAYWRIGHT_DIR = join(PROJECT_ROOT, 'playwright')

// ---------------------------------------------------------------------------
// Contract: Existing helpers MUST preserve their function names and arity
// ---------------------------------------------------------------------------

describe('Playwright Helpers API Contract (Slice 4)', () => {
  // -------------------------------------------------------------------
  // 4.2a — helpers.ts exports the 4 known functions (approval test)
  // -------------------------------------------------------------------
  it('exports all 4 existing helper functions with correct names', async () => {
    const helpersPath = join(PLAYWRIGHT_DIR, 'helpers.ts')
    expect(existsSync(helpersPath)).toBe(true)

    // Dynamic import to exercise the module
    const helpers = await import(join(PLAYWRIGHT_DIR, 'helpers.ts'))

    // All 4 known helpers must still be exported
    expect(typeof helpers.expectNoAxeViolations).toBe('function')
    expect(typeof helpers.seedAuthenticatedKioskSession).toBe('function')
    expect(typeof helpers.readViewportOverflow).toBe('function')
    expect(typeof helpers.collectHydrationSignals).toBe('function')

    // Verify arity (parameter count) hasn't changed
    expect(helpers.expectNoAxeViolations.length).toBe(1) // (violations)
    expect(helpers.seedAuthenticatedKioskSession.length).toBe(1) // (page)
    expect(helpers.readViewportOverflow.length).toBe(1) // (page)
    expect(helpers.collectHydrationSignals.length).toBe(1) // (page)
  })

  // -------------------------------------------------------------------
  // 4.2b — base-page.ts exists and exports PageObject base class (NEW)
  // -------------------------------------------------------------------
  it('base-page.ts exports a PageObject class with goto and common methods', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')

    // RED: This WILL fail until base-page.ts is created
    expect(existsSync(bpPath)).toBe(true)

    const bp = await import(join(PLAYWRIGHT_DIR, 'base-page.ts'))

    // BasePage must be a class (constructor is a function)
    expect(typeof bp.BasePage).toBe('function')

    // BasePage must have a prototype with expected methods
    const proto = bp.BasePage.prototype
    expect(typeof proto.goto).toBe('function')
    expect(typeof proto.waitForPageLoad).toBe('function')
  })

  // -------------------------------------------------------------------
  // 4.2c — helpers.ts re-exports or imports from base-page.ts cleanly
  // -------------------------------------------------------------------
  it('helpers module imports cleanly without errors and all exports are callable', async () => {
    const helpers = await import(join(PLAYWRIGHT_DIR, 'helpers.ts'))

    // Verify no missing exports from refactoring
    const exportedNames = Object.keys(helpers)
    expect(exportedNames.length).toBeGreaterThanOrEqual(4)

    // Every export must be a function (consistent with current API)
    for (const name of exportedNames) {
      expect(
        typeof helpers[name]).toBe('function')
    }
  })

  // -------------------------------------------------------------------
  // 4.2d — seedAuthenticatedKioskSession accepts Page and is async
  // -------------------------------------------------------------------
  it('seedAuthenticatedKioskSession is an async function accepting a Page', async () => {
    const helpers = await import(join(PLAYWRIGHT_DIR, 'helpers.ts'))
    const fn = helpers.seedAuthenticatedKioskSession

    // Must be async (returns a Promise when called — but we can't call without a real Page)
    expect(fn.constructor.name).toBe('AsyncFunction')
    expect(fn.length).toBe(1) // accepts exactly 1 argument (Page)
  })

  // -------------------------------------------------------------------
  // 4.2e — No circular imports between base-page.ts and helpers.ts
  // -------------------------------------------------------------------
  it('base-page.ts does not import from helpers.ts (no circular deps)', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')
    if (!existsSync(bpPath)) return // Skip if not created yet (RED)

    const content = await import('node:fs').then((fs) =>
      fs.readFileSync(bpPath, 'utf8'),
    )

    // base-page.ts should NOT import from ./helpers
    const importsFromHelpers =
      /from\s+['"]\.\/helpers['"]/.test(content) ||
      /from\s+['"]\.\.?\/playwright\/helpers['"]/.test(content)
    expect(importsFromHelpers).toBe(false)
  })

  // -------------------------------------------------------------------
  // 4.2f — BasePage constructor signature accepts a single Page argument
  // -------------------------------------------------------------------
  it('BasePage constructor signature accepts a single Page argument', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')
    if (!existsSync(bpPath)) return

    const bp = await import(join(PLAYWRIGHT_DIR, 'base-page.ts'))
    expect(bp.BasePage.length).toBe(1) // Constructor takes 1 param (Page)
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: BasePage has exactly the expected public method count
  // -------------------------------------------------------------------
  it('BasePage exposes 7 public methods (goto, waitForPageLoad, expectUrl, expectHeading, expectButton, expectTextbox, getCurrentUrl)', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')
    if (!existsSync(bpPath)) return

    const bp = await import(join(PLAYWRIGHT_DIR, 'base-page.ts'))
    const proto = bp.BasePage.prototype
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== 'constructor' && typeof proto[n] === 'function',
    )

    expect(methodNames.length).toBe(7)
    expect(methodNames).toContain('goto')
    expect(methodNames).toContain('waitForPageLoad')
    expect(methodNames).toContain('expectUrl')
    expect(methodNames).toContain('expectHeading')
    expect(methodNames).toContain('expectButton')
    expect(methodNames).toContain('expectTextbox')
    expect(methodNames).toContain('getCurrentUrl')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: BasePage.goto accepts exactly 1 string argument
  // -------------------------------------------------------------------
  it('BasePage.goto accepts exactly 1 argument (path: string)', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')
    if (!existsSync(bpPath)) return

    const bp = await import(join(PLAYWRIGHT_DIR, 'base-page.ts'))
    expect(bp.BasePage.prototype.goto.length).toBe(1)
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: BasePage can be extended by a child class
  // -------------------------------------------------------------------
  it('BasePage can be subclassed (extensibility guard)', async () => {
    const bpPath = join(PLAYWRIGHT_DIR, 'base-page.ts')
    if (!existsSync(bpPath)) return

    const bp = await import(join(PLAYWRIGHT_DIR, 'base-page.ts'))

    // Simulate a subclass (just verifying prototype chain works)
    class TestPage extends bp.BasePage {
      readonly someLocator = 'test'
    }
    // @ts-expect-error: TestPage extends dynamically-imported BasePage;
    // constructor type is lost; we only verify prototype chain here.
    const instance = new TestPage({})
    expect(instance).toBeInstanceOf(bp.BasePage)
    expect(instance.someLocator).toBe('test')
  })

  // -------------------------------------------------------------------
  // TRIANGULATE: helpers.ts does NOT export BasePage (it's in its own file)
  // -------------------------------------------------------------------
  it('helpers.ts does not re-export BasePage (separation of concerns)', async () => {
    const helpers = await import(join(PLAYWRIGHT_DIR, 'helpers.ts'))
    expect('BasePage' in helpers).toBe(false)
    expect('PageObject' in helpers).toBe(false)
  })
})
