#!/usr/bin/env bun
/**
 * Quality Audit Harness — single-entrypoint repository audit.
 *
 * Runs all configured quality checks sequentially, classifies each as
 * hard-fail or advisory, and produces a consolidated console report.
 *
 * Hard-fail categories (blocking):
 *   - biome (lint/format)
 *   - typescript (tsc --noEmit)
 *   - docs (documentation truth checks)
 *
 * Advisory categories (warn only):
 *   - dead-code (knip)
 *   - duplication (jscpd)
 *   - circular-deps (dependency-cruiser)
 *
 * Usage: bun run audit
 * Exit:  0 if all hard-fail checks pass, 1 otherwise.
 */

import { $ } from 'bun'

// ---------------------------------------------------------------------------
// Severity classification
// ---------------------------------------------------------------------------

export const SEVERITY = {
  HARD_FAIL: 'hard-fail',
  ADVISORY: 'advisory',
} as const

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY]

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AuditCategory {
  name: string
  severity: Severity
  command: string
  args: string[]
}

export interface AuditResult {
  category: string
  severity: Severity
  passed: boolean
  exitCode: number
  durationMs: number
}

// ---------------------------------------------------------------------------
// Category severity map
// ---------------------------------------------------------------------------

const CATEGORY_SEVERITY: Record<string, Severity> = {
  biome: SEVERITY.HARD_FAIL,
  typescript: SEVERITY.HARD_FAIL,
  docs: SEVERITY.HARD_FAIL,
  'dead-code': SEVERITY.ADVISORY,
  duplication: SEVERITY.ADVISORY,
  'circular-deps': SEVERITY.ADVISORY,
}

/**
 * Resolves the severity for a named audit category.
 * Throws if the category is unknown.
 */
export function resolveCategorySeverity(categoryName: string): Severity {
  const severity = CATEGORY_SEVERITY[categoryName]
  if (!severity) {
    throw new Error(
      `Unknown audit category: "${categoryName}". ` +
        `Known categories: ${Object.keys(CATEGORY_SEVERITY).join(', ')}`,
    )
  }
  return severity
}

// ---------------------------------------------------------------------------
// Category definitions (all checks the harness can run)
// ---------------------------------------------------------------------------

const CATEGORIES: AuditCategory[] = [
  {
    name: 'biome',
    severity: SEVERITY.HARD_FAIL,
    command: 'biome',
    args: ['check', 'src/', '--assist-enabled=false'],
  },
  {
    name: 'typescript',
    severity: SEVERITY.HARD_FAIL,
    command: 'tsc',
    args: ['--noEmit'],
  },
  {
    name: 'docs',
    severity: SEVERITY.HARD_FAIL,
    command: 'bun',
    args: ['run', 'scripts/check-docs.ts'],
  },
  {
    name: 'dead-code',
    severity: SEVERITY.ADVISORY,
    command: 'knip',
    args: [],
  },
  {
    name: 'duplication',
    severity: SEVERITY.ADVISORY,
    command: 'jscpd',
    args: ['src/'],
  },
  {
    name: 'circular-deps',
    severity: SEVERITY.ADVISORY,
    command: 'dependency-cruiser',
    args: ['src'],
  },
]

// ---------------------------------------------------------------------------
// Check runner
// ---------------------------------------------------------------------------

/**
 * Runs a single audit category via Bun shell and returns the result.
 */
async function runCategory(category: AuditCategory): Promise<AuditResult> {
  const start = performance.now()

  let exitCode = 0
  try {
    // Use Bun.$ for shell execution — respects PATH, handles exit codes
    const proc = await $`${category.command} ${category.args}`.quiet().nothrow()
    exitCode = proc.exitCode
  } catch {
    // $ may throw on spawn failure; treat as failed execution
    exitCode = 1
  }

  const durationMs = Math.round(performance.now() - start)

  return {
    category: category.name,
    severity: category.severity,
    passed: exitCode === 0,
    exitCode,
    durationMs,
  }
}

// ---------------------------------------------------------------------------
// Result classification
// ---------------------------------------------------------------------------

export interface ClassifiedResults {
  total: number
  passed: number
  hardFailures: number
  advisoryWarnings: number
  shouldExitNonZero: boolean
  summary: string
}

/**
 * Classifies audit results and determines exit behavior.
 * Pure function — no side effects.
 */
export function classifyResults(results: AuditResult[]): ClassifiedResults {
  const total = results.length
  const passed = results.filter((r) => r.passed).length

  const hardFailures = results.filter(
    (r) => r.severity === SEVERITY.HARD_FAIL && !r.passed,
  ).length

  const advisoryWarnings = results.filter(
    (r) => r.severity === SEVERITY.ADVISORY && !r.passed,
  ).length

  const shouldExitNonZero = hardFailures > 0

  const parts: string[] = []
  if (hardFailures > 0) parts.push(`${hardFailures} hard-failure(s)`)
  if (advisoryWarnings > 0) parts.push(`${advisoryWarnings} advisory warning(s)`)
  const summary =
    parts.length > 0 ? parts.join(', ') : 'All checks passed'

  return {
    total,
    passed,
    hardFailures,
    advisoryWarnings,
    shouldExitNonZero,
    summary,
  }
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/**
 * Formats classified results into a human-readable console report.
 * Pure function — no side effects.
 */
export function formatReport(classified: ClassifiedResults): string {
  const lines: string[] = []

  lines.push('')
  lines.push('══════════════════════════════════════════════════')
  lines.push('           QUALITY AUDIT REPORT')
  lines.push('══════════════════════════════════════════════════')
  lines.push('')
  lines.push(`  Checks:  ${classified.passed}/${classified.total} passed`)

  if (classified.hardFailures > 0) {
    lines.push(`  FAIL:    ${classified.hardFailures} hard-failure(s) detected`)
  }

  if (classified.advisoryWarnings > 0) {
    lines.push(`  WARN:    ${classified.advisoryWarnings} advisory warning(s)`)
  }

  lines.push(`  Summary: ${classified.summary}`)
  lines.push('')

  if (classified.shouldExitNonZero) {
    lines.push('  Result:  FAIL — hard-failure check(s) must be resolved.')
  } else {
    lines.push('  Result:  PASS — no blocking issues found.')
  }

  lines.push('')
  lines.push('══════════════════════════════════════════════════')
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🔍 Running quality audit harness...')
  console.log('')

  const results: AuditResult[] = []

  for (const category of CATEGORIES) {
    const label = category.severity === SEVERITY.HARD_FAIL ? '🔴' : '🟡'
    console.log(`${label} ${category.name} (${category.severity})...`)

    const result = await runCategory(category)
    results.push(result)

    const status = result.passed ? '✅' : '❌'
    console.log(`   ${status} ${result.durationMs}ms`)
    console.log('')
  }

  const classified = classifyResults(results)
  const report = formatReport(classified)

  console.log(report)

  if (classified.shouldExitNonZero) {
    process.exit(1)
  }

  process.exit(0)
}

// Only run when executed directly (not when imported for testing)
if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error('Audit harness fatal error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
}
