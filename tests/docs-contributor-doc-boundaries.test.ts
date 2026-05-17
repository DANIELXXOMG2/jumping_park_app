import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('contributor documentation boundaries stay truthful', () => {
	it('routes setup, testing, and deployment workflow details through the guides', () => {
		const contributing = readProjectFile('CONTRIBUTING.md')
		const claude = readProjectFile('CLAUDE.md')
		const docsReadme = readProjectFile('docs/README.md')

		const activeSection =
			docsReadme.split('## Active surfaces')[1]?.split('## Planned next slices')[0] ?? ''
		const plannedSection =
			docsReadme.split('## Planned next slices')[1]?.split('## Historical material')[0] ?? ''

		expect(contributing).toContain('docs/guides/getting-started.md')
		expect(contributing).toContain('docs/guides/testing.md')
		expect(contributing).toContain('docs/guides/deployment.md')
		expect(claude).toContain('docs/guides/getting-started.md')
		expect(claude).toContain('docs/guides/testing.md')
		expect(claude).toContain('docs/guides/deployment.md')
		expect(claude).toContain('CONTRIBUTING.md')
		expect(activeSection).toContain('`docs/guides/`')
		expect(plannedSection).not.toContain('`docs/guides/`')
	})

	it('keeps CONTRIBUTING policy-focused and CLAUDE repo-intelligence-focused', () => {
		const contributing = readProjectFile('CONTRIBUTING.md')
		const claude = readProjectFile('CLAUDE.md')

		expect(contributing).toContain(
			'This file stays focused on contribution policy, review expectations, and release-safe change discipline.',
		)
		expect(contributing).toContain('## Start here')
		expect(contributing).toContain('## Review gates')
		expect(contributing).toContain('## Pull request checklist')
		expect(claude).toContain('## Documentation map')
		expect(claude).toContain('## Command quick reference')
		expect(claude).toContain(
			'Use the guides above for step-by-step contributor workflows; this section stays as a fast command lookup for repository agents.',
		)
		expect(claude).toContain('### Service Layer Pattern')
		expect(claude).toContain(
			'For setup and deployment procedures, prefer `docs/guides/getting-started.md` and `docs/guides/deployment.md`.',
		)
	})
})
