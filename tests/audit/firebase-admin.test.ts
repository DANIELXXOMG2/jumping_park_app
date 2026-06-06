/**
 * Tests for scripts/lib/firebase-admin.ts — RED phase
 *
 * These tests reference production code that does NOT exist yet.
 * The module path ../scripts/lib/firebase-admin will fail to resolve
 * until the GREEN phase implements the production file.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'

// ---------------------------------------------------------------------------
// Test subjects — these imports will fail in RED phase (production code
// doesn't exist yet), which satisfies the strict TDD RED gate.
// ---------------------------------------------------------------------------

describe('firebase-admin lib', () => {
  // -----------------------------------------------------------------------
  // 1a. validateFirebaseConfig — pure function (extracted for testability)
  // -----------------------------------------------------------------------

  describe('validateFirebaseConfig', () => {
    let validateFirebaseConfig: (env: Record<string, string | undefined>) => {
      projectId: string
      clientEmail: string
      privateKey: string
    }

    beforeAll(async () => {
      const mod = await import('../../scripts/lib/firebase-admin')
      validateFirebaseConfig = mod.validateFirebaseConfig
    })

    it('returns parsed config when all required env vars are present', () => {
      const result = validateFirebaseConfig({
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
      })

      expect(result).toEqual({
        projectId: 'test-project',
        clientEmail: 'test@test.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----',
      })
    })

    it('throws with clear message when FIREBASE_PROJECT_ID is missing', () => {
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_CLIENT_EMAIL: 'test@test.com',
          FIREBASE_PRIVATE_KEY: 'key',
        })
      ).toThrow(/FIREBASE_PROJECT_ID/)
    })

    it('throws with clear message when FIREBASE_CLIENT_EMAIL is missing', () => {
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: 'proj',
          FIREBASE_PRIVATE_KEY: 'key',
        })
      ).toThrow(/FIREBASE_CLIENT_EMAIL/)
    })

    it('throws with clear message when FIREBASE_PRIVATE_KEY is missing', () => {
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: 'proj',
          FIREBASE_CLIENT_EMAIL: 'test@test.com',
        })
      ).toThrow(/FIREBASE_PRIVATE_KEY/)
    })

    it('handles empty string as missing for each required field', () => {
      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: '',
          FIREBASE_CLIENT_EMAIL: 'test@test.com',
          FIREBASE_PRIVATE_KEY: 'key',
        })
      ).toThrow(/FIREBASE_PROJECT_ID/)

      expect(() =>
        validateFirebaseConfig({
          FIREBASE_PROJECT_ID: 'proj',
          FIREBASE_CLIENT_EMAIL: '',
          FIREBASE_PRIVATE_KEY: 'key',
        })
      ).toThrow(/FIREBASE_CLIENT_EMAIL/)
    })

    it('normalizes \\n newlines in private key', () => {
      const result = validateFirebaseConfig({
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_PRIVATE_KEY: '-----BEGIN KEY-----\\nline1\\nline2\\n-----END KEY-----\\n',
      })

      expect(result.privateKey).toBe(
        '-----BEGIN KEY-----\nline1\nline2\n-----END KEY-----\n'
      )
    })
  })

  // -----------------------------------------------------------------------
  // 1b. initFirebaseAdmin — integration (mocked Firebase Admin)
  // -----------------------------------------------------------------------

  describe('initFirebaseAdmin', () => {
    let initFirebaseAdmin: (env?: Record<string, string | undefined>) => unknown
    let resetForTesting: () => void

    beforeAll(async () => {
      const mod = await import('../../scripts/lib/firebase-admin')
      initFirebaseAdmin = mod.initFirebaseAdmin
      resetForTesting = mod.__resetFirebaseAdminForTesting
    })

    beforeEach(() => {
      // Ensure clean module state — other test files may have
      // already initialized Firebase Admin in the same process.
      resetForTesting()
    })

    it('throws descriptive error when Firebase config env vars are missing', () => {
      expect(() =>
        initFirebaseAdmin({})
      ).toThrow(/FIREBASE_PROJECT_ID|FIREBASE_CLIENT_EMAIL|FIREBASE_PRIVATE_KEY/)
    })

    it('throws mentioning the specific missing variable FIREBASE_PROJECT_ID', () => {
      expect(() =>
        initFirebaseAdmin({
          FIREBASE_CLIENT_EMAIL: 'test@test.com',
          FIREBASE_PRIVATE_KEY: 'key',
        })
      ).toThrow(/FIREBASE_PROJECT_ID/)
    })

    it('is importable and callable (smoke test for module shape)', () => {
      expect(typeof initFirebaseAdmin).toBe('function')
    })
  })
})
