import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const repoRoot = process.cwd()
const lighthousePublicAuditName = 'Lighthouse public audit (SEO min 0.9)'

function readWorkflowFile(): string {
	return readFileSync(
		join(repoRoot, '.github', 'workflows', 'lighthouse.yml'),
		'utf8',
	)
}

function readMonthlyChecklist(): string {
	return readFileSync(
		join(repoRoot, 'docs', 'ai-visibility-monthly-checklist.md'),
		'utf8',
	)
}

function countOccurrences(value: string, needle: string): number {
	return value.split(needle).length - 1
}

describe('phase 5 monitoring and ci quality slice', () => {
	it('uses a descriptive lighthouse workflow name while preserving the lhci command', () => {
		expect(
			existsSync(join(repoRoot, '.github', 'workflows', 'lighthouse.yml')),
		).toBe(true)

		const workflow = readWorkflowFile()

		expect(workflow.includes(`name: ${lighthousePublicAuditName}`)).toBe(true)
		expect(workflow.includes(`    name: ${lighthousePublicAuditName}`)).toBe(true)
		expect(countOccurrences(workflow, lighthousePublicAuditName)).toBe(2)
		expect(
			workflow.includes('run: bun x lhci autorun --config=./lighthouserc.json'),
		).toBe(true)
	})

	it('adds a monthly ai visibility checklist for the required platforms and queries', () => {
		expect(
			existsSync(
				join(repoRoot, 'docs', 'ai-visibility-monthly-checklist.md'),
			),
		).toBe(true)

		const checklist = readMonthlyChecklist()

		expect(checklist.includes('Google AI Overviews')).toBe(true)
		expect(checklist.includes('ChatGPT')).toBe(true)
		expect(checklist.includes('Perplexity')).toBe(true)
		expect(checklist.includes('at least 5 target queries')).toBe(true)
		expect(checklist.includes('Results log')).toBe(true)
		expect(checklist.includes('/llms.txt')).toBe(true)
		expect(checklist.includes('/pricing.md')).toBe(true)
	})

	it('documents rollback guidance for each seo audit phase', () => {
		const checklist = readMonthlyChecklist()

		expect(checklist.includes('Phase 1 — image optimization')).toBe(true)
		expect(checklist.includes('Phase 2 — Lighthouse budgets')).toBe(true)
		expect(checklist.includes('Phase 3 — structured data')).toBe(true)
		expect(checklist.includes('Phase 4 — AI visibility surfaces')).toBe(true)
		expect(checklist.includes('Phase 5 — monitoring and CI naming')).toBe(true)
		expect(checklist.includes('PUBLIC_SEO_ENABLED=false')).toBe(true)
	})
})
