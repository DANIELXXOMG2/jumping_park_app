import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('testing guide stays truthful', () => {
	const guidePath = 'docs/guides/testing.md'

	it('exists and has required sections', () => {
		expect(existsSync(join(projectRoot, guidePath))).toBe(true)

		const guide = readProjectFile(guidePath)

		expect(guide).toContain('# Testing guide')
		expect(guide).toContain('> **Status**: current')
		expect(guide).toContain('> **Diátaxis**: How-to')
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Testing pyramid')
		expect(guide).toContain('## Tooling map')
		expect(guide).toContain('## CI integration')
		expect(guide).toContain('## Before you merge')
	})

	it('references package.json scripts that actually exist', () => {
		const guide = readProjectFile(guidePath)
		const pkg = JSON.parse(readProjectFile('package.json')) as { scripts: Record<string, string> }
		const scripts = pkg.scripts

		const scriptNames = [
			'test',
			'check',
			'check:format',
			'check:lint',
			'check:types',
			'audit',
			'build',
			'playwright:install',
			'test:a11y:e2e',
		]

		for (const name of scriptNames) {
			if (guide.includes(`bun run ${name}`) || guide.includes(`\`bun run ${name}\``) || guide.includes(`\`bun ${name}\``)) {
				expect(scripts[name]).toBeDefined()
			}
		}
	})

	it('references CI workflow jobs that match actual ci.yml', () => {
		const guide = readProjectFile(guidePath)
		const ciYml = readProjectFile('.github/workflows/ci.yml')

		expect(guide).toContain('.github/workflows/ci.yml')

		const ciJobs = ['quality', 'dependency-audit', 'build-verification']
		for (const job of ciJobs) {
			expect(guide).toContain(job)
			expect(ciYml).toContain(`${job}:`)
		}
	})

	it('references Lighthouse workflow that matches actual file', () => {
		const guide = readProjectFile(guidePath)

		expect(guide).toContain('.github/workflows/lighthouse.yml')
		expect(existsSync(join(projectRoot, '.github/workflows/lighthouse.yml'))).toBe(true)
		expect(guide).toContain('lighthouserc.json')
		expect(existsSync(join(projectRoot, 'lighthouserc.json'))).toBe(true)
	})

	it('references test files that exist on disk', () => {
		const guide = readProjectFile(guidePath)

		const testFiles = [
			'tests/batch1-docs-hygiene-reapply.test.ts',
			'tests/docs-getting-started-guide.test.ts',
			'tests/consent-route.test.ts',
			'tests/admin-session-service.test.ts',
		]

		for (const file of testFiles) {
			if (guide.includes(file)) {
				expect(existsSync(join(projectRoot, file))).toBe(true)
			}
		}
	})

	it('accurately describes the a11y test boundary', () => {
		const guide = readProjectFile(guidePath)
		const ciYml = readProjectFile('.github/workflows/ci.yml')

		expect(guide).toContain('playwright/accessibility.a11y.ts')
		expect(existsSync(join(projectRoot, 'playwright/accessibility.a11y.ts'))).toBe(true)

		// Must correctly scope coverage to public and kiosk, not admin.
		expect(guide).toContain('public or kiosk UI behavior')
		expect(guide).not.toContain('public, kiosk, or admin UI behavior')

		// Must correctly state the command is not part of the current CI workflow.
		expect(guide).toContain('not')
		expect(guide).toContain('ci.yml')
		expect(ciYml).not.toContain('test:a11y:e2e')
	})

	it('cross-references other guides and runbooks correctly', () => {
		const guide = readProjectFile(guidePath)

		expect(guide).toContain('docs/guides/getting-started.md')
		expect(guide).toContain('docs/runbooks/production-hardening.md')
	})
})
