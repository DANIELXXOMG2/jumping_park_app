/**
 * Tests for Slice 3: Firebase Init Consolidation
 *
 * Strict TDD — this file contains:
 *   SAFETY NET: shared lib behavior (approval tests — must stay green)
 *   RED→GREEN: consolidation target tests (fail until scripts are refactored)
 *
 * The RED phase is represented by the fact that seed-database.ts, backup.ts,
 * and set-admin-role.ts still contain duplicated inline Firebase Admin init.
 * The GREEN phase replaces each with the shared lib.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { readFileSync } from 'fs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validEnv = {
  FIREBASE_PROJECT_ID: 'jumping-park-consolidation-test',
  FIREBASE_CLIENT_EMAIL: 'test@jumping-park.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\nMOCK_CONSOLIDATION_KEY\n-----END PRIVATE KEY-----\n',
}

// ---------------------------------------------------------------------------
// 1. SAFETY NET — shared lib behavior (must survive the refactor unchanged)
// ---------------------------------------------------------------------------

describe('Slice 3: Firebase Init Consolidation', () => {
  describe('SAFETY NET — shared lib validateFirebaseConfig', () => {
    let validateFirebaseConfig: (
      env: Record<string, string | undefined>,
    ) => { projectId: string; clientEmail: string; privateKey: string }

    beforeAll(async () => {
      const mod = await import('../../scripts/lib/firebase-admin')
      validateFirebaseConfig = mod.validateFirebaseConfig
    })

    it('returns parsed config when all env vars present', () => {
      const cfg = validateFirebaseConfig(validEnv)
      expect(cfg.projectId).toBe('jumping-park-consolidation-test')
      expect(cfg.clientEmail).toBe(
        'test@jumping-park.iam.gserviceaccount.com',
      )
      expect(cfg.privateKey).toContain('BEGIN PRIVATE KEY')
    })

    it('throws on missing FIREBASE_PROJECT_ID (covers seed/backup/set-admin)', () => {
      const env = { ...validEnv, FIREBASE_PROJECT_ID: undefined }
      expect(() => validateFirebaseConfig(env)).toThrow(
        /FIREBASE_PROJECT_ID/,
      )
    })

    it('throws on missing FIREBASE_CLIENT_EMAIL (covers all three scripts)', () => {
      const env = { ...validEnv, FIREBASE_CLIENT_EMAIL: undefined }
      expect(() => validateFirebaseConfig(env)).toThrow(
        /FIREBASE_CLIENT_EMAIL/,
      )
    })

    it('throws on missing FIREBASE_PRIVATE_KEY (covers all three scripts)', () => {
      const env = { ...validEnv, FIREBASE_PRIVATE_KEY: undefined }
      expect(() => validateFirebaseConfig(env)).toThrow(
        /FIREBASE_PRIVATE_KEY/,
      )
    })

    it('rejects empty string for each required field', () => {
      expect(() =>
        validateFirebaseConfig({
          ...validEnv,
          FIREBASE_PROJECT_ID: '',
        }),
      ).toThrow(/FIREBASE_PROJECT_ID/)

      expect(() =>
        validateFirebaseConfig({
          ...validEnv,
          FIREBASE_CLIENT_EMAIL: '',
        }),
      ).toThrow(/FIREBASE_CLIENT_EMAIL/)

      expect(() =>
        validateFirebaseConfig({
          ...validEnv,
          FIREBASE_PRIVATE_KEY: '',
        }),
      ).toThrow(/FIREBASE_PRIVATE_KEY/)
    })

    it('normalizes escaped \\n newlines in private key (was inline in backup.ts)', () => {
      const cfg = validateFirebaseConfig({
        ...validEnv,
        FIREBASE_PRIVATE_KEY:
          '-----BEGIN KEY-----\\nline1\\nline2\\n-----END KEY-----\\n',
      })
      expect(cfg.privateKey).toBe(
        '-----BEGIN KEY-----\nline1\nline2\n-----END KEY-----\n',
      )
    })
  })

  describe('SAFETY NET — shared lib initFirebaseAdmin', () => {
    let initFirebaseAdmin: (
      env?: Record<string, string | undefined>,
    ) => unknown
    let reset: () => void

    beforeAll(async () => {
      const mod = await import('../../scripts/lib/firebase-admin')
      initFirebaseAdmin = mod.initFirebaseAdmin
      reset = mod.__resetFirebaseAdminForTesting
    })

    beforeEach(() => {
      reset()
    })

    it('test mode validates config and throws [TEST MODE]', () => {
      expect(() => initFirebaseAdmin(validEnv)).toThrow('[TEST MODE]')
    })

    it('test mode with empty env throws validation error first', () => {
      expect(() => initFirebaseAdmin({})).toThrow(/FIREBASE_PROJECT_ID/)
    })

    it('is a callable function (module shape)', () => {
      expect(typeof initFirebaseAdmin).toBe('function')
    })
  })

  // -----------------------------------------------------------------------
  // 2. CONSOLIDATION TARGET TESTS — RED → GREEN
  //
  // These tests verify the scripts have been refactored to use the shared
  // lib. BEFORE the refactoring, these tests conceptually represent the
  // RED state (scripts still have duplicated init). AFTER refactoring,
  // they turn GREEN.
  //
  // We test the structural outcome: the shared lib import is present and
  // the old inline Firebase Admin app imports are gone.
  // -----------------------------------------------------------------------

  describe('RED→GREEN: seed-database.ts uses shared lib', () => {
    it('imports initFirebaseAdmin from ./lib/firebase-admin', () => {
      const content = readFileSync('scripts/seed-database.ts', 'utf-8')
      expect(content).toContain('initFirebaseAdmin')
      expect(content).toContain("./lib/firebase-admin")
    })

    it('no longer imports initializeApp or cert directly', () => {
      const content = readFileSync('scripts/seed-database.ts', 'utf-8')
      expect(content).not.toMatch(
        /import\s*\{[^}]*\binitializeApp\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
      expect(content).not.toMatch(
        /import\s*\{[^}]*\bcert\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
    })

    it('no longer contains inline Firebase Admin app initialization', () => {
      const content = readFileSync('scripts/seed-database.ts', 'utf-8')
      // The old inline pattern: cert(serviceAccount) or initializeApp() directly
      expect(content).not.toMatch(
        /credential:\s*cert\(serviceAccount\)/,
      )
      // The old inline getApps-check-and-init pattern
      expect(content).not.toMatch(
        /getApps\(\)\.length\s*===\s*0/,
      )
    })
  })

  describe('RED→GREEN: backup.ts uses shared lib', () => {
    it('imports initFirebaseAdmin from ./lib/firebase-admin', () => {
      const content = readFileSync('scripts/backup.ts', 'utf-8')
      expect(content).toContain('initFirebaseAdmin')
      expect(content).toContain("./lib/firebase-admin")
    })

    it('no longer imports initializeApp, cert, or getApps from firebase-admin/app', () => {
      const content = readFileSync('scripts/backup.ts', 'utf-8')
      expect(content).not.toMatch(
        /import\s*\{[^}]*\binitializeApp\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
      expect(content).not.toMatch(
        /import\s*\{[^}]*\bcert\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
      expect(content).not.toMatch(
        /import\s*\{[^}]*\bgetApps\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
    })

    it('no longer has duplicate privateKey \\n normalization', () => {
      const content = readFileSync('scripts/backup.ts', 'utf-8')
      // The old inline normalization: .replace(/\\n/g, "\n")
      // This is now handled by the shared lib
      expect(content).not.toContain('replace(/\\\\n/g')
    })
  })

  describe('RED→GREEN: set-admin-role.ts uses shared lib', () => {
    it('imports initFirebaseAdmin from ./lib/firebase-admin', () => {
      const content = readFileSync('scripts/set-admin-role.ts', 'utf-8')
      expect(content).toContain('initFirebaseAdmin')
      expect(content).toContain("./lib/firebase-admin")
    })

    it('no longer imports initializeApp, cert, or getApps from firebase-admin/app', () => {
      const content = readFileSync('scripts/set-admin-role.ts', 'utf-8')
      expect(content).not.toMatch(
        /import\s*\{[^}]*\binitializeApp\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
      expect(content).not.toMatch(
        /import\s*\{[^}]*\bcert\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
      expect(content).not.toMatch(
        /import\s*\{[^}]*\bgetApps\b[^}]*\}\s*from\s*["']firebase-admin\/app["']/,
      )
    })

    it('no longer contains inline Firebase Admin app initialization', () => {
      const content = readFileSync('scripts/set-admin-role.ts', 'utf-8')
      // The old inline pattern: cert(serviceAccount), cert({projectId,...})
      expect(content).not.toMatch(
        /credential:\s*cert\(/,
      )
      // The old inline getApps-check-and-init pattern
      expect(content).not.toMatch(
        /getApps\(\)\.length\s*===\s*0/,
      )
      // The old FIREBASE_SERVICE_ACCOUNT_KEY branch
      expect(content).not.toMatch(
        /FIREBASE_SERVICE_ACCOUNT_KEY/,
      )
    })
  })

  // -----------------------------------------------------------------------
  // 3. TRIANGULATE — edge cases for consolidated validation
  // -----------------------------------------------------------------------

  describe('TRIANGULATE: edge case env var combinations', () => {
    let validateFirebaseConfig: (
      env: Record<string, string | undefined>,
    ) => { projectId: string; clientEmail: string; privateKey: string }

    beforeAll(async () => {
      const mod = await import('../../scripts/lib/firebase-admin')
      validateFirebaseConfig = mod.validateFirebaseConfig
    })

    it('trims whitespace from all env var values', () => {
      const cfg = validateFirebaseConfig({
        FIREBASE_PROJECT_ID: '  proj-with-spaces  ',
        FIREBASE_CLIENT_EMAIL: '  spaced@test.com  ',
        FIREBASE_PRIVATE_KEY: '  -----BEGIN KEY-----\nkey\n-----END KEY-----\n  ',
      })
      expect(cfg.projectId).toBe('proj-with-spaces')
      expect(cfg.clientEmail).toBe('spaced@test.com')
      // private key leading/trailing spaces trimmed but internal newlines preserved
      expect(cfg.privateKey).toContain('BEGIN KEY')
      expect(cfg.privateKey).toContain('END KEY-----')
      expect(cfg.privateKey).not.toMatch(/^\s/)
      expect(cfg.privateKey).not.toMatch(/\s$/)
    })

    it('handles only first var missing (not all at once)', () => {
      // Only PROJECT_ID missing → error mentions specifically PROJECT_ID
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: undefined,
          FIREBASE_CLIENT_EMAIL: 'email@test.com',
          FIREBASE_PRIVATE_KEY: 'key',
        }),
      ).toThrow(/FIREBASE_PROJECT_ID/)
    })

    it('handles only last var missing (PRIVATE_KEY)', () => {
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: 'proj',
          FIREBASE_CLIENT_EMAIL: 'email@test.com',
          FIREBASE_PRIVATE_KEY: undefined,
        }),
      ).toThrow(/FIREBASE_PRIVATE_KEY/)
    })
  })
})
