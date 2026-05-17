import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('documentation cleanup slice preserves type-quality contracts', () => {
	it('keeps bun test matcher typings aligned with the assertions used in docs tests', () => {
		const bunMatchers = readProjectFile('src/types/bun-test.d.ts')

		expect(bunMatchers).toContain('toHaveProperty(key: string, value?: unknown): void;')
		expect(bunMatchers).toContain('not: {')
		expect(bunMatchers).toContain('\t\t\ttoHaveProperty(key: string, value?: unknown): void;')
	})

	it('keeps every active runbook fixture on the same object shape', () => {
		const runbooksTest = readProjectFile('tests/docs-runbooks-english.test.ts')

		expect(runbooksTest.match(/\bpath:/g)?.length ?? 0).toBe(8)
		expect(runbooksTest).toContain("path: 'docs/runbooks/otp-operational-policy.md',")
		expect(runbooksTest).toContain("path: 'docs/runbooks/git-history-mp4-purge.md',")
		expect(runbooksTest).toContain('legacySpanishPhrase: undefined,')
	})
})
