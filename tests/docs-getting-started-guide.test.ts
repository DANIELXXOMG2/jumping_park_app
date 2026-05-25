import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('getting started guide stays truthful', () => {
	const guidePath = 'docs/guides/getting-started.md'

	it('exists and has required sections', () => {
		expect(existsSync(join(projectRoot, guidePath))).toBe(true)

		const guide = readProjectFile(guidePath)

		expect(guide).toContain('# Getting started')
		expect(guide).toContain('> **Status**: current')
		expect(guide).toContain('> **Diátaxis**: Tutorial')
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Before you start')
		expect(guide).toContain('## Local setup')
		expect(guide).toContain('## First-run walkthrough')
		expect(guide).toContain('## Verification')
	})

	it('keeps the setup commands, env requirements, and first-run routes aligned with the current repository', () => {
		const guide = readProjectFile(guidePath)

		// Setup commands
		expect(guide).toContain('bun install')
		expect(guide).toContain('cp .env.example .env.local')
		expect(guide).toContain('bun dev')
		expect(guide).toContain('bun test')
		expect(guide).toContain('bun run check:types')

		// Env var references
		expect(guide).toContain('FIREBASE_PROJECT_ID')
		expect(guide).toContain('NEXT_PUBLIC_FIREBASE_API_KEY')
		expect(guide).toContain('RESEND_API_KEY')
		expect(guide).toContain('ADMIN_JWT_SECRET')

		// Admin setup
		expect(guide).toContain('bun run set-admin <email> admin')
		expect(guide).toContain('The target user must already exist in Firebase Auth.')

		// First-run routes
		expect(guide).toContain('http://localhost:3000/')
		expect(guide).toContain('http://localhost:3000/consentimiento-digital')
		expect(guide).toContain('http://localhost:3000/admin/login')

		// Cross-references
		expect(guide).toContain('docs/runbooks/production-hardening.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')
		expect(guide).toContain('CONTRIBUTING.md')
	})

	it('references env vars that exist in .env.example', () => {
		const guide = readProjectFile(guidePath)
		const envExample = readProjectFile('.env.example')

		const envVars = [
			'ADMIN_SESSION_MODE',
			'OTP_EXPIRATION_MINUTES',
			'OTP_SESSION_DURATION_MINUTES',
			'OTP_LOCKOUT_MINUTES',
			'OTP_HARDENING_ENABLED',
			'EXPORT_BOUNDS_ENFORCED',
			'PUBLIC_SEO_ENABLED',
		]

		for (const envVar of envVars) {
			expect(guide).toContain(envVar)
			expect(envExample).toContain(envVar)
		}
	})

	it('references routes that have real page files on disk', () => {
		const guide = readProjectFile(guidePath)

		// Verify route page files exist
		const routeChecks = [
			{ url: '/consentimiento-digital', file: 'src/app/(public)/consentimiento-digital/page.tsx' },
			{ url: '/admin/login', file: 'src/app/(admin)/admin/login/page.tsx' },
		]

		for (const { url, file } of routeChecks) {
			expect(guide).toContain(url)
			expect(existsSync(join(projectRoot, file))).toBe(true)
		}
	})

	it('references scripts that exist in package.json', () => {
		const guide = readProjectFile(guidePath)
		const packageJson = JSON.parse(readProjectFile('package.json')) as {
			scripts?: Record<string, string>
		}
		const scripts = packageJson.scripts ?? {}

		// set-admin script
		expect(guide).toContain('bun run set-admin')
		expect(scripts['set-admin']).toBeDefined()

		// Bun dev is standard
		expect(guide).toContain('bun dev')
		expect(scripts.dev).toBeDefined()
	})
})

// Deployment guide tests deferred to _deferred/slice-7b-deployment/docs-deployment-guide.test.ts
// Testing guide tests deferred to _deferred/slice-7c-testing/docs-testing-guide.test.ts
