/**
 * Tests for scripts/archive/ — Script Archival (Slice 2)
 *
 * RED phase: these tests reference files that do NOT exist yet.
 * They will pass once slice 2 tasks 2.1-2.5 are implemented.
 */

import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = join(import.meta.dir, '..', '..')
const ARCHIVE_ROOT = join(PROJECT_ROOT, 'scripts', 'archive')
const MIGRATIONS_DIR = join(ARCHIVE_ROOT, 'migrations')
const ONE_TIME_DIR = join(ARCHIVE_ROOT, 'one-time')
const README_PATH = join(ARCHIVE_ROOT, 'README.md')
const PACKAGE_JSON_PATH = join(PROJECT_ROOT, 'package.json')

// Expected migration scripts
const MIGRATION_SCRIPTS = [
  'migrate-roles.ts',
  'migrate-minors.ts',
  'migrate-consent-multilang.ts',
  'migrate-search-tokens.ts',
  'migrate-search-tokens-tildes.ts',
  'migrate-minor-search-tokens.ts',
  'migrate-consent-minor-tokens.ts',
]

// Expected one-time scripts
const ONE_TIME_SCRIPTS = [
  'optimize-assets.ts',
  'git-history-mp4-precheck.ts',
]

// Package.json scripts that must be REMOVED (per tasks 2.5)
const REMOVED_SCRIPTS = [
  'migrate:minors',
  'migrate:search-tokens',
  'migrate:consent-minor-tokens',
  'migrate:minor-search-tokens',
  'migrate:tildes',
  'check:phase5',
]

// ---------------------------------------------------------------------------
// 2.1 — Archive directory structure
// ---------------------------------------------------------------------------

describe('Archive directory structure (2.1)', () => {
  it('scripts/archive/ directory exists', () => {
    expect(existsSync(ARCHIVE_ROOT)).toBe(true)
  })

  it('scripts/archive/migrations/ directory exists', () => {
    expect(existsSync(MIGRATIONS_DIR)).toBe(true)
  })

  it('scripts/archive/one-time/ directory exists', () => {
    expect(existsSync(ONE_TIME_DIR)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2.2 — Migration scripts moved
// ---------------------------------------------------------------------------

describe('Migration scripts archived (2.2)', () => {
  for (const script of MIGRATION_SCRIPTS) {
    it(`${script} exists in scripts/archive/migrations/`, () => {
      const targetPath = join(MIGRATIONS_DIR, script)
      expect(existsSync(targetPath)).toBe(true)
    })

    it(`${script} no longer exists in scripts/`, () => {
      const oldPath = join(PROJECT_ROOT, 'scripts', script)
      expect(existsSync(oldPath)).toBe(false)
    })
  }
})

// ---------------------------------------------------------------------------
// 2.3 — One-time scripts moved
// ---------------------------------------------------------------------------

describe('One-time scripts archived (2.3)', () => {
  for (const script of ONE_TIME_SCRIPTS) {
    it(`${script} exists in scripts/archive/one-time/`, () => {
      const targetPath = join(ONE_TIME_DIR, script)
      expect(existsSync(targetPath)).toBe(true)
    })

    it(`${script} no longer exists in scripts/`, () => {
      const oldPath = join(PROJECT_ROOT, 'scripts', script)
      expect(existsSync(oldPath)).toBe(false)
    })
  }
})

// ---------------------------------------------------------------------------
// 2.4 — Archive README with discoverability index
// ---------------------------------------------------------------------------

describe('Archive README (2.4)', () => {
  it('README.md exists at scripts/archive/README.md', () => {
    expect(existsSync(README_PATH)).toBe(true)
  })

  it('README lists each migration script with purpose', () => {
    const content = readFileSync(README_PATH, 'utf-8')

    // Each migration script must be mentioned by filename
    for (const script of MIGRATION_SCRIPTS) {
      expect(content).toContain(script)
    }

    // Must have a purpose/description section
    expect(content).toMatch(/purpose|propósito|urpose/i)
  })

  it('README lists each one-time script with purpose', () => {
    const content = readFileSync(README_PATH, 'utf-8')

    for (const script of ONE_TIME_SCRIPTS) {
      expect(content).toContain(script)
    }
  })

  it('README mentions last-known-working commit or replacement info', () => {
    const content = readFileSync(README_PATH, 'utf-8')

    // Must reference either commits or replacements
    const hasCommitRef = /[0-9a-f]{7,}/i.test(content)
    const hasReplacement = /replacement|reemplazo|superseded|supersedido/i.test(content)
    expect(hasCommitRef || hasReplacement).toBe(true)
  })

  it('README states archive is non-operational / for reference', () => {
    const content = readFileSync(README_PATH, 'utf-8')

    expect(content).toMatch(
      /non-operational|no operativo|historical|histórico|reference|referencia/i,
    )
  })
})

// ---------------------------------------------------------------------------
// 2.5 — Package.json cleanup
// ---------------------------------------------------------------------------

describe('package.json cleanup (2.5)', () => {
  function loadPackageJson(): Record<string, unknown> {
    const raw = readFileSync(PACKAGE_JSON_PATH, 'utf-8')
    return JSON.parse(raw)
  }

  it('removed archive-related npm scripts', () => {
    const pkg = loadPackageJson()
    const scripts = pkg.scripts as Record<string, string> | undefined

    if (!scripts) {
      throw new Error('package.json has no scripts field')
    }

    for (const key of REMOVED_SCRIPTS) {
      expect(scripts[key]).toBeUndefined()
    }
  })

  it('daily operational scripts still exist', () => {
    const pkg = loadPackageJson()
    const scripts = pkg.scripts as Record<string, string> | undefined

    if (!scripts) {
      throw new Error('package.json has no scripts field')
    }

    // These must remain
    expect(scripts['dev']).toBeDefined()
    expect(scripts['build']).toBeDefined()
    expect(scripts['test']).toBeDefined()
    expect(scripts['check']).toBeDefined()
    expect(scripts['audit']).toBeDefined()
    expect(scripts['seed']).toBeDefined()
    expect(scripts['backup']).toBeDefined()
    expect(scripts['set-admin']).toBeDefined()
  })
})
