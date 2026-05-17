import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('testing guide stays truthful', () => {
	it('publishes the testing workflow with an explicit pyramid and command map', () => {
		const guide = readProjectFile('docs/guides/testing.md')

		expect(guide).toContain('# Testing guide')
		expect(guide).toContain(
			'This guide explains which verification layers exist in Jumping Park today, when to run them, and how they connect to CI.',
		)
		expect(guide).toContain('## Quick path')
		expect(guide).toContain('## Testing pyramid')
		expect(guide).toContain('## Tooling map')
		expect(guide).toContain('## CI integration')
		expect(guide).toContain('## Before you merge')
	})

	it('keeps the documented commands and CI references aligned with the current repository', () => {
		const guide = readProjectFile('docs/guides/testing.md')
		const packageJson = JSON.parse(readProjectFile('package.json')) as {
			scripts: Record<string, string>
		}
		const ciWorkflow = readProjectFile('.github/workflows/ci.yml')
		const lighthouseWorkflow = readProjectFile('.github/workflows/lighthouse.yml')
		const playwrightConfig = readProjectFile('playwright.config.ts')

		expect(packageJson.scripts.test).toBe('bun test')
		expect(packageJson.scripts['test:a11y:e2e']).toContain('playwright test')
		expect(packageJson.scripts.check).toContain('check:types')
		expect(packageJson.scripts['playwright:install']).toContain('playwright install chromium')
		expect(packageJson.scripts).not.toHaveProperty('test:integration')
		expect(ciWorkflow).toContain('run: bun run check')
		expect(ciWorkflow).toContain('run: bun test')
		expect(ciWorkflow).toContain('run: bun run build')
		expect(lighthouseWorkflow).toContain('run: bun x lhci autorun --config=./lighthouserc.json')
		expect(playwrightConfig).toContain("testMatch: '**/*.a11y.ts'")

		expect(guide).toContain('bun test')
		expect(guide).toContain('bun test --coverage')
		expect(guide).toContain('bun run check')
		expect(guide).toContain('bun run check:format')
		expect(guide).toContain('bun run check:lint')
		expect(guide).toContain('bun run check:types')
		expect(guide).toContain('bun run audit')
		expect(guide).toContain('bun run playwright:install')
		expect(guide).toContain('bun run test:a11y:e2e')
		expect(guide).toContain('playwright/accessibility.a11y.ts')
		expect(guide).toContain('.github/workflows/ci.yml')
		expect(guide).toContain('.github/workflows/lighthouse.yml')
		expect(guide).toContain('There is no separate `test:integration` script in this repository today.')
	})
})
