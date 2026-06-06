/**
 * Shared Firebase Admin initialization.
 *
 * Loads dotenv, validates required environment variables, and returns a
 * singleton Firebase Admin app. Scripts that need Firestore access should
 * import `initFirebaseAdmin()` instead of duplicating the initialization
 * logic.
 *
 * Usage:
 *   import { initFirebaseAdmin } from './lib/firebase-admin'
 *   const app = initFirebaseAdmin()
 */

import { config } from 'dotenv'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import type { App } from 'firebase-admin/app'

// ---------------------------------------------------------------------------
// Validation — pure function, exported for testability
// ---------------------------------------------------------------------------

export interface FirebaseConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

/**
 * Validates and normalizes Firebase Admin SDK configuration from
 * environment variables. Throws with a descriptive message when any
 * required variable is missing or empty.
 */
export function validateFirebaseConfig(
  env: Record<string, string | undefined>,
): FirebaseConfig {
  const projectId = env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim()
  const rawKey = env.FIREBASE_PRIVATE_KEY?.trim()

  const missing: string[] = []

  if (!projectId) missing.push('FIREBASE_PROJECT_ID')
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
  if (!rawKey) missing.push('FIREBASE_PRIVATE_KEY')

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
        'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.',
    )
  }

  // After validation, all three values are guaranteed non-empty strings.
  // The throw above ensures we never reach here with missing values.
  if (!projectId || !clientEmail || !rawKey) {
    // This branch is unreachable — satisfies TypeScript's control flow analysis.
    throw new Error('Unexpected: validated config has missing values')
  }

  // Normalize escaped newlines in private key (dotenv may preserve \n as literal)
  const privateKey = rawKey.replace(/\\n/g, '\n')

  return { projectId, clientEmail, privateKey }
}

// ---------------------------------------------------------------------------
// Singleton Firebase Admin initialization
// ---------------------------------------------------------------------------

let _app: App | null = null

/**
 * Resets the cached Firebase Admin app instance.
 * Exported for test isolation — NOT for production use.
 */
export function __resetFirebaseAdminForTesting(): void {
  _app = null
}

/**
 * Returns a singleton Firebase Admin app instance.
 *
 * On first call, loads dotenv (unless an explicit env map is provided for
 * testing), validates required environment variables, and initializes
 * Firebase Admin with a service-account credential. Subsequent calls
 * return the cached instance.
 *
 * @param env - Optional environment variable map for testability.
 *   When omitted, uses process.env and loads .env via dotenv.
 *
 * Throws if FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or
 * FIREBASE_PRIVATE_KEY are missing from the environment.
 */
export function initFirebaseAdmin(env?: Record<string, string | undefined>): App {
  // When called with explicit env (test mode), always validate config
  // but don't actually initialize Firebase (avoids process-wide conflicts).
  const isTestMode = env !== undefined

  if (!isTestMode && _app) return _app

  // Resolve env: test mode uses the provided map, production uses dotenv + process.env
  const resolvedEnv = isTestMode ? env : (config(), toEnvRecord(process.env))

  // In production mode, check if another module already initialized Firebase.
  if (!isTestMode) {
    const existing = getApps()
    if (existing.length > 0) {
      _app = existing[0]
      return _app
    }
  }

  const cfg = validateFirebaseConfig(resolvedEnv)

  // In test mode, validation is the only goal — don't touch the real SDK.
  if (isTestMode) {
    throw new Error(
      '[TEST MODE] Firebase Admin initialization skipped. ' +
        'Use production mode (no env param) to initialize a real app.',
    )
  }

  _app = initializeApp({
    credential: cert({
      projectId: cfg.projectId,
      clientEmail: cfg.clientEmail,
      privateKey: cfg.privateKey,
    }),
  })

  return _app
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts process.env (NodeJS.ProcessEnv) to a plain Record for validation.
 * TypeScript's ProcessEnv is `Record<string, string | undefined>`, but the
 * index signature prevents direct assignment without a cast. This function
 * provides an explicit, safe narrowing.
 */
function toEnvRecord(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {}
  for (const key of Object.keys(env)) {
    record[key] = env[key]
  }
  return record
}
