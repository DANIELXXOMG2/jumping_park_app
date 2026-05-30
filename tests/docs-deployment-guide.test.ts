import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('deployment guide stays truthful', () => {
	const guidePath = 'docs/guides/deployment.md'

	it('exists and has required sections', () => {
		expect(existsSync(join(projectRoot, guidePath))).toBe(true)

		const guide = readProjectFile(guidePath)

		expect(guide).toContain('# Deployment guide')
		expect(guide).toContain('> **Status**: current')
		expect(guide).toContain('> **Diátaxis**: How-to')
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Deployment split')
		expect(guide).toContain('## Firebase preparation')
		expect(guide).toContain('## Vercel environment configuration')
		expect(guide).toContain('## Post-deploy verification')
	})

	it('references real Firebase and CI config files', () => {
		const guide = readProjectFile(guidePath)

		const configFiles = [
			'firebase/firestore.indexes.json',
			'firebase/firestore.rules',
			'firebase/storage.rules',
			'firebase.json',
		]

		for (const file of configFiles) {
			expect(guide).toContain(file)
			expect(existsSync(join(projectRoot, file))).toBe(true)
		}
	})

	it('references the real deployment commands and package scripts', () => {
		const guide = readProjectFile(guidePath)
		const packageJson = JSON.parse(readProjectFile('package.json')) as {
			scripts?: Record<string, string>
		}
		const scripts = packageJson.scripts ?? {}

		expect(guide).toContain('bun install --frozen-lockfile')
		expect(guide).toContain('bun run check')
		expect(guide).toContain('bun test')
		expect(guide).toContain('bun run build')
		expect(guide).toContain('bun run set-admin')

		expect(scripts.check).toBeDefined()
		expect(scripts.test).toBeDefined()
		expect(scripts.build).toBeDefined()
		expect(scripts['set-admin']).toBeDefined()
	})

	it('references hardening policy source file accurately', () => {
		const guide = readProjectFile(guidePath)

		expect(guide).toContain('src/lib/hardeningPolicy.ts')
		expect(guide).toContain('HARDENING_FLAG_ENV_KEY')
		expect(guide).toContain('HARDENING_FLAG_DEFAULT_ENABLED')
		expect(existsSync(join(projectRoot, 'src/lib/hardeningPolicy.ts'))).toBe(true)

		// Verify hardening policy actually defines all the flags the guide mentions
		const hardeningPolicy = readProjectFile('src/lib/hardeningPolicy.ts')

		const flagEnvKeys = [
			'OTP_HARDENING_ENABLED',
			'EXPORT_BOUNDS_ENFORCED',
			'PUBLIC_SEO_ENABLED',
			'CURSOR_PAGINATION_ENABLED',
			'ADMIN_AGGREGATES_ENABLED',
			'OFFLINE_QUEUE_ENABLED',
			'CSP_REPORT_ONLY_ENABLED',
		]

		for (const key of flagEnvKeys) {
			expect(hardeningPolicy).toContain(key)
			expect(guide).toContain(key)
		}
	})

	it('references .firebaserc with correct default project', () => {
		const guide = readProjectFile(guidePath)

		expect(guide).toContain('jumping-park-consents')

		const firebaserc = readProjectFile('.firebaserc')
		expect(firebaserc).toContain('jumping-park-consents')
	})

	it('references firebaseAdmin.ts private key handling accurately', () => {
		const guide = readProjectFile(guidePath)
		const firebaseAdmin = readProjectFile('src/lib/firebaseAdmin.ts')

		expect(guide).toContain('src/lib/firebaseAdmin.ts')
		expect(firebaseAdmin).toContain('privateKeyRaw')
		expect(firebaseAdmin).toContain('replace(/\\\\n/g')
	})

	it('cross-references runbooks and other guides correctly', () => {
		const guide = readProjectFile(guidePath)

		expect(guide).toContain('docs/runbooks/seo-ai-seo-validation-checklist.md')
		expect(guide).toContain('docs/runbooks/admin-cost-smoke-checklist.md')
		expect(guide).toContain('docs/runbooks/offline-replay-drill.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')
		expect(guide).toContain('docs/runbooks/production-hardening.md')
		expect(guide).toContain('CONTRIBUTING.md')
	})
})
