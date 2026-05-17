import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('deployment guide stays truthful', () => {
	it('publishes a Vercel plus Firebase deployment workflow with env and verification sections', () => {
		const guide = readProjectFile('docs/guides/deployment.md')

		expect(guide).toContain('# Deployment guide')
		expect(guide).toContain(
			'This guide explains the lowest-risk path to deploy Jumping Park today: Vercel runs the Next.js app, while Firebase remains the backing platform for Auth, Firestore, Storage, indexes, and rules.',
		)
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Deployment split')
		expect(guide).toContain('## Before you deploy')
		expect(guide).toContain('## Firebase preparation')
		expect(guide).toContain('## Vercel environment configuration')
		expect(guide).toContain('## Vercel project settings and deploy')
		expect(guide).toContain('## Post-deploy verification')
	})

	it('keeps deployment commands, env vars, and rollout order aligned with the current repository', () => {
		const guide = readProjectFile('docs/guides/deployment.md')
		const packageJson = JSON.parse(readProjectFile('package.json')) as {
			scripts: Record<string, string>
		}
		const firebaseJson = JSON.parse(readProjectFile('firebase.json')) as {
			firestore?: Record<string, string>
			storage?: Record<string, string>
		}
		const firebaserc = JSON.parse(readProjectFile('.firebaserc')) as {
			projects?: { default?: string }
		}
		const readme = readProjectFile('README.md')
		const hardeningPolicy = readProjectFile('src/lib/hardeningPolicy.ts')
		const firebaseAdmin = readProjectFile('src/lib/firebaseAdmin.ts')
		const setAdminScript = readProjectFile('scripts/set-admin-role.ts')

		expect(packageJson.scripts.build).toBe('next build')
		expect(packageJson.scripts.check).toContain('check:types')
		expect(packageJson.scripts['set-admin']).toContain('scripts/set-admin-role.ts')
		expect(firebaseJson.firestore?.rules).toBe('firebase/firestore.rules')
		expect(firebaseJson.firestore?.indexes).toBe('firebase/firestore.indexes.json')
		expect(firebaseJson.storage?.rules).toBe('firebase/storage.rules')
		expect(firebaserc.projects?.default).toBe('jumping-park-consents')
		expect(readme).toContain(
			'Deploy Firebase indexes/rules before enabling `ADMIN_AGGREGATES_ENABLED`, `CURSOR_PAGINATION_ENABLED`, or the offline queue flags.',
		)
		expect(hardeningPolicy).toContain('CURSOR_PAGINATION_ENABLED')
		expect(hardeningPolicy).toContain('ADMIN_AGGREGATES_ENABLED')
		expect(hardeningPolicy).toContain('OFFLINE_QUEUE_ENABLED')
		expect(hardeningPolicy).toContain('NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED')
		expect(hardeningPolicy).toContain('CSP_REPORT_ONLY_ENABLED')
		expect(firebaseAdmin).toContain('privateKeyRaw.replace(/\\\\n/g, "\\n")')
		expect(setAdminScript).toContain('FIREBASE_SERVICE_ACCOUNT_KEY')

		expect(guide).toContain('bun run check')
		expect(guide).toContain('bun test')
		expect(guide).toContain('bun run build')
		expect(guide).toContain('bunx firebase-tools deploy --only firestore:indexes')
		expect(guide).toContain('bunx firebase-tools deploy --only firestore:rules')
		expect(guide).toContain('bunx firebase-tools deploy --only storage')
		expect(guide).toContain('FIREBASE_PRIVATE_KEY')
		expect(guide).toContain('NEXT_PUBLIC_FIREBASE_API_KEY')
		expect(guide).toContain('ADMIN_JWT_SECRET')
		expect(guide).toContain('ADMIN_SESSION_MODE')
		expect(guide).toContain('PUBLIC_SEO_ENABLED')
		expect(guide).toContain('CURSOR_PAGINATION_ENABLED')
		expect(guide).toContain('ADMIN_AGGREGATES_ENABLED')
		expect(guide).toContain('OFFLINE_QUEUE_ENABLED')
		expect(guide).toContain('NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED')
		expect(guide).toContain('CSP_REPORT_ONLY_ENABLED')
		expect(guide).toContain('ALLOW_ADMIN_SETUP')
		expect(guide).toContain('FIREBASE_SERVICE_ACCOUNT_KEY')
		expect(guide).toContain('bun run set-admin <email> admin')
		expect(guide).toContain('docs/runbooks/production-hardening.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')
		expect(guide).toContain('docs/runbooks/seo-ai-seo-validation-checklist.md')
	})
})
