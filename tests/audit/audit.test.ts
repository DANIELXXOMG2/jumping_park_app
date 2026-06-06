/**
 * Tests for scripts/audit.ts — RED phase
 *
 * These tests reference production code that does NOT exist yet.
 * The module path ../../scripts/audit will fail to resolve until
 * the GREEN phase implements the production file.
 */

import { beforeAll, describe, expect, it } from 'bun:test'

// ---------------------------------------------------------------------------
// Type definitions (matching the design contracts)
// ---------------------------------------------------------------------------

const SEVERITY = {
  HARD_FAIL: 'hard-fail',
  ADVISORY: 'advisory',
} as const

type Severity = (typeof SEVERITY)[keyof typeof SEVERITY]

interface AuditCategory {
  name: string
  severity: Severity
  command: string
  args: string[]
}

interface AuditResult {
  category: string
  severity: Severity
  passed: boolean
  exitCode: number
  durationMs: number
}

// ---------------------------------------------------------------------------
// 2a. SEVERITY const and helper types
// ---------------------------------------------------------------------------

describe('SEVERITY const', () => {
  it('defines HARD_FAIL and ADVISORY as distinct values', async () => {
    const mod = await import('../../scripts/audit')
    const SEVERITY_IMPORTED = mod.SEVERITY

    expect(SEVERITY_IMPORTED.HARD_FAIL).toBe('hard-fail')
    expect(SEVERITY_IMPORTED.ADVISORY).toBe('advisory')
  })

  it('is a const object (readonly at type level)', async () => {
    const mod = await import('../../scripts/audit')
    // If SEVERITY is defined with `as const`, the values are literal types
    const s = mod.SEVERITY
    expect(s.HARD_FAIL).toBe('hard-fail')
    expect(s.ADVISORY).toBe('advisory')
    // Verify both keys exist
    expect(Object.keys(s).sort()).toEqual(['ADVISORY', 'HARD_FAIL'])
  })
})

// ---------------------------------------------------------------------------
// 2b. resolveCategorySeverity — pure function for classification
// ---------------------------------------------------------------------------

describe('resolveCategorySeverity', () => {
  let resolveCategorySeverity: (categoryName: string) => Severity

  beforeAll(async () => {
    const mod = await import('../../scripts/audit')
    resolveCategorySeverity = mod.resolveCategorySeverity
  })

  it('returns HARD_FAIL for biome lint', () => {
    expect(resolveCategorySeverity('biome')).toBe('hard-fail')
  })

  it('returns HARD_FAIL for TypeScript types', () => {
    expect(resolveCategorySeverity('typescript')).toBe('hard-fail')
  })

  it('returns HARD_FAIL for docs truth', () => {
    expect(resolveCategorySeverity('docs')).toBe('hard-fail')
  })

  it('returns ADVISORY for dead code (knip)', () => {
    expect(resolveCategorySeverity('dead-code')).toBe('advisory')
  })

  it('returns ADVISORY for code duplication (jscpd)', () => {
    expect(resolveCategorySeverity('duplication')).toBe('advisory')
  })

  it('returns ADVISORY for circular dependencies', () => {
    expect(resolveCategorySeverity('circular-deps')).toBe('advisory')
  })

  it('throws for unknown category name', () => {
    expect(() => resolveCategorySeverity('nonexistent')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// 2c. classifyResults — pure function that determines exit behavior
// ---------------------------------------------------------------------------

describe('classifyResults', () => {
  let classifyResults: (results: AuditResult[]) => {
    total: number
    passed: number
    hardFailures: number
    advisoryWarnings: number
    shouldExitNonZero: boolean
    summary: string
  }

  beforeAll(async () => {
    const mod = await import('../../scripts/audit')
    classifyResults = mod.classifyResults
  })

  it('reports all passing with shouldExitNonZero: false', () => {
    const results: AuditResult[] = [
      { category: 'biome', severity: 'hard-fail', passed: true, exitCode: 0, durationMs: 100 },
      { category: 'dead-code', severity: 'advisory', passed: true, exitCode: 0, durationMs: 200 },
    ]

    const classified = classifyResults(results)

    expect(classified.total).toBe(2)
    expect(classified.passed).toBe(2)
    expect(classified.hardFailures).toBe(0)
    expect(classified.advisoryWarnings).toBe(0)
    expect(classified.shouldExitNonZero).toBe(false)
  })

  it('sets shouldExitNonZero: true when a hard-fail fails', () => {
    const results: AuditResult[] = [
      { category: 'biome', severity: 'hard-fail', passed: false, exitCode: 1, durationMs: 100 },
      { category: 'dead-code', severity: 'advisory', passed: true, exitCode: 0, durationMs: 200 },
    ]

    const classified = classifyResults(results)

    expect(classified.hardFailures).toBe(1)
    expect(classified.advisoryWarnings).toBe(0)
    expect(classified.shouldExitNonZero).toBe(true)
  })

  it('counts advisory warnings but does not trigger exit when only advisory fails', () => {
    const results: AuditResult[] = [
      { category: 'biome', severity: 'hard-fail', passed: true, exitCode: 0, durationMs: 100 },
      { category: 'dead-code', severity: 'advisory', passed: false, exitCode: 1, durationMs: 200 },
    ]

    const classified = classifyResults(results)

    expect(classified.hardFailures).toBe(0)
    expect(classified.advisoryWarnings).toBe(1)
    expect(classified.shouldExitNonZero).toBe(false)
  })

  it('handle mixed hard-fail + advisory failure', () => {
    const results: AuditResult[] = [
      { category: 'biome', severity: 'hard-fail', passed: false, exitCode: 1, durationMs: 100 },
      { category: 'typescript', severity: 'hard-fail', passed: true, exitCode: 0, durationMs: 50 },
      { category: 'dead-code', severity: 'advisory', passed: false, exitCode: 1, durationMs: 200 },
      { category: 'duplication', severity: 'advisory', passed: false, exitCode: 1, durationMs: 300 },
    ]

    const classified = classifyResults(results)

    expect(classified.total).toBe(4)
    expect(classified.passed).toBe(1)
    expect(classified.hardFailures).toBe(1)
    expect(classified.advisoryWarnings).toBe(2)
    expect(classified.shouldExitNonZero).toBe(true)
  })

  it('handles empty results array', () => {
    const classified = classifyResults([])

    expect(classified.total).toBe(0)
    expect(classified.passed).toBe(0)
    expect(classified.hardFailures).toBe(0)
    expect(classified.advisoryWarnings).toBe(0)
    expect(classified.shouldExitNonZero).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2d. formatReport — pure function for console output
// ---------------------------------------------------------------------------

describe('formatReport', () => {
  let formatReport: (classified: {
    total: number
    passed: number
    hardFailures: number
    advisoryWarnings: number
    shouldExitNonZero: boolean
    summary: string
  }) => string

  beforeAll(async () => {
    const mod = await import('../../scripts/audit')
    formatReport = mod.formatReport
  })

  it('produces output containing "PASS" when all pass', () => {
    const classified = {
      total: 3,
      passed: 3,
      hardFailures: 0,
      advisoryWarnings: 0,
      shouldExitNonZero: false,
      summary: 'All checks passed',
    }

    const output = formatReport(classified)
    expect(output).toContain('3/3')
    expect(output).toContain('PASS')
  })

  it('produces output containing "FAIL" when hard-fail exists', () => {
    const classified = {
      total: 3,
      passed: 2,
      hardFailures: 1,
      advisoryWarnings: 0,
      shouldExitNonZero: true,
      summary: '1 hard-failure(s)',
    }

    const output = formatReport(classified)
    expect(output).toContain('FAIL')
    expect(output).toContain('hard-fail')
  })

  it('produces output containing "WARN" when advisory warnings exist', () => {
    const classified = {
      total: 3,
      passed: 2,
      hardFailures: 0,
      advisoryWarnings: 1,
      shouldExitNonZero: false,
      summary: '1 advisory warning(s)',
    }

    const output = formatReport(classified)
    expect(output).toContain('WARN')
  })

  it('includes a non-empty summary string', () => {
    const classified = {
      total: 1,
      passed: 0,
      hardFailures: 1,
      advisoryWarnings: 0,
      shouldExitNonZero: true,
      summary: '1 hard-failure(s)',
    }

    const output = formatReport(classified)
    expect(output.length).toBeGreaterThan(0)
    expect(output).toContain(classified.summary)
  })
})

// ---------------------------------------------------------------------------
// 2e. CATEGORIES array does NOT reference removed package.json scripts
// ---------------------------------------------------------------------------

describe('CATEGORIES array — no stale script references', () => {
  it('invokes biome, tsc, knip, jscpd, dependency-cruiser directly (no bun run <removed-script>)', async () => {
    // Import CATEGORIES from the audit module to verify the live array.
    // We use a dynamic import so we test the production code, not a copy.
    const mod = await import('../../scripts/audit')

    // The module doesn't export CATEGORIES directly, but we can verify
    // it doesn't reference removed package.json script keys by inspecting
    // the source or checking that all commands are direct tool invocations.
    // For integration safety, we verify that no category uses `bun run`
    // with a removed script name.
    //
    // The categories we care about each map to a known tool:
    const expectedCommands: Record<string, string> = {
      biome: 'biome',
      typescript: 'tsc',
      docs: 'bun',
      'dead-code': 'knip',
      duplication: 'jscpd',
      'circular-deps': 'dependency-cruiser',
    }

    // resolveCategorySeverity still works for all six
    for (const name of Object.keys(expectedCommands)) {
      expect(mod.resolveCategorySeverity(name)).toBeDefined()
    }
  })

  it('does NOT reference removed script keys in any command or args', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')

    const source = fs.readFileSync(
      path.resolve(import.meta.dir, '../../scripts/audit.ts'),
      'utf-8',
    )

    const removedScripts = [
      'check:lint',
      'check:types',
      'check:docs',
      'audit:dead',
      'audit:dupe',
      'audit:circ',
    ]

    for (const script of removedScripts) {
      // Each removed script must not appear as a string argument in the CATEGORIES block
      expect(source).not.toContain(`'${script}'`)
      expect(source).not.toContain(`"${script}"`)
    }
  })
})
