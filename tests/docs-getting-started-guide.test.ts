import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('getting started guide stays truthful', () => {
	it('publishes a newcomer-first setup walkthrough for the active developer workflow', () => {
		const guide = readProjectFile('docs/guides/getting-started.md')

		expect(guide).toContain('# Getting started')
		expect(guide).toContain(
			'This guide gets a contributor from clone to a real local walkthrough of the active Jumping Park surfaces.',
		)
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Before you start')
		expect(guide).toContain('## Local setup')
		expect(guide).toContain('## First-run walkthrough')
		expect(guide).toContain('## Verification')
	})

	it('keeps the setup commands, env requirements, and first-run routes aligned with the current repository', () => {
		const guide = readProjectFile('docs/guides/getting-started.md')

		expect(guide).toContain('bun install')
		expect(guide).toContain('cp .env.example .env.local')
		expect(guide).toContain('bun dev')
		expect(guide).toContain('bun test')
		expect(guide).toContain('bun run check:types')
		expect(guide).toContain('FIREBASE_PROJECT_ID')
		expect(guide).toContain('NEXT_PUBLIC_FIREBASE_API_KEY')
		expect(guide).toContain('RESEND_API_KEY')
		expect(guide).toContain('ADMIN_JWT_SECRET')
		expect(guide).toContain('bun run set-admin <email> admin')
		expect(guide).toContain('The target user must already exist in Firebase Auth.')
		expect(guide).toContain('http://localhost:3000/')
		expect(guide).toContain('http://localhost:3000/consentimiento-digital')
		expect(guide).toContain('http://localhost:3000/admin/login')
		expect(guide).toContain('docs/runbooks/production-hardening.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')
	})
})
