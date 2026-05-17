import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('docs IA index stays truthful', () => {
	it('publishes the final English index for the restructured docs tree', () => {
		const docsReadme = readProjectFile('docs/README.md')

		expect(docsReadme).toContain('# Documentation index')
		expect(docsReadme).toContain(
			'This index is the canonical map of the active documentation surface for Jumping Park.',
		)
		expect(docsReadme).toContain('## Active surfaces')
		expect(docsReadme).toContain('## Planned next slices')
		expect(docsReadme).toContain('## Historical material')
		expect(docsReadme).toContain('`docs/ARQUITECTURA.md`')
		expect(docsReadme).toContain('`docs/runbooks/`')
		expect(docsReadme).toContain('`docs/portfolio/`')
		expect(docsReadme).toContain('`diagramas/`')
		expect(docsReadme).toContain('`docs/guides/`')
		expect(docsReadme).toContain('`docs/api/`')
		expect(docsReadme).toContain('`docs/adr/`')
		expect(docsReadme).toContain('`docs/assets/`')
	})

	it('removes the temporary transition language from active entrypoints', () => {
		const docsReadme = readProjectFile('docs/README.md')
		const rootReadme = readProjectFile('README.md')
		const archiveReadme = readProjectFile('docs/archive/archive-README.md')

		expect(docsReadme).not.toContain('# Documentation transition note')
		expect(docsReadme).not.toContain('compatibility shim')
		expect(docsReadme).not.toContain('temporary note')
		expect(rootReadme).toContain('`docs/README.md` - English documentation index')
		expect(rootReadme).not.toContain(
			'transition note that keeps the docs entry stable while the English IA index is rebuilt',
		)
		expect(archiveReadme).toContain(
			'Previous Spanish documentation index replaced by the current English IA index at `docs/README.md`.',
		)
		expect(archiveReadme).not.toContain('temporary transition note')
	})
})
