import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const docsThatMustDropOpenSpecRefs = [
	'README.md',
	'docs/ARQUITECTURA.md',
	'CONTRIBUTING.md',
	'.github/instructions/main.instructions.md',
] as const

function projectPath(relativePath: string) {
	return path.join(process.cwd(), relativePath)
}

function readProjectFile(relativePath: string) {
	return readFileSync(projectPath(relativePath), 'utf8')
}

describe('openspec cleanup traceability', () => {
	it('keeps openspec deleted from the committable working tree boundary', () => {
		expect(existsSync(projectPath('openspec'))).toBe(false)
		expect(existsSync(projectPath('openspec/config.yaml'))).toBe(false)
		expect(existsSync(projectPath('openspec/specs'))).toBe(false)
		expect(existsSync(projectPath('openspec/changes'))).toBe(false)
	})

	it('removes stale openspec references from contributor-facing docs and instructions', () => {
		const filesStillReferencingOpenSpec = docsThatMustDropOpenSpecRefs.filter(
			(relativePath) => readProjectFile(relativePath).includes('openspec/'),
		)

		expect(filesStillReferencingOpenSpec).toEqual([])
	})

	it('keeps SDD traceability aligned with Engram-backed artifacts', () => {
		const architecture = readProjectFile('docs/ARQUITECTURA.md')
		const contributing = readProjectFile('CONTRIBUTING.md')

		expect(architecture).toContain('Engram')
		expect(contributing).toContain('Engram')
	})
})
