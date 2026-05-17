import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('architecture doc stays on English canon', () => {
	it('rewrites the active architecture narrative to English', () => {
		const architecture = readProjectFile('docs/ARQUITECTURA.md')

		expect(architecture).toContain('# System architecture')
		expect(architecture).toContain(
			'This document reflects the current architecture after the incremental hardening of the `comprehensive-product-audit-and-roadmap` change.',
		)
		expect(architecture).toContain('## 1. Executive summary')
		expect(architecture).toContain('## 2. System planes')
		expect(architecture).toContain('## 7. Offline resilience')
		expect(architecture).toContain('## 11. Traceability and decision records')
	})

	it('removes the legacy Spanish body copy while preserving rollout evidence and Engram traceability', () => {
		const architecture = readProjectFile('docs/ARQUITECTURA.md')

		expect(architecture).not.toContain('# Arquitectura del sistema')
		expect(architecture).not.toContain('## 1. Resumen ejecutivo')
		expect(architecture).not.toContain(
			'La estrategia offline es deliberadamente escalonada.',
		)
		expect(architecture).not.toContain('## 8. SEO, AI-SEO y artefactos publicos')

		expect(architecture).toContain(
			'IaC rollout boundary: deploy Firebase indexes/rules first, then prewarm aggregates, then enable flags.',
		)
		expect(architecture).toContain(
			'Exact composite-index parity is still a best-effort proof until emulator/query logs or deploy feedback confirm every live query shape.',
		)
		expect(architecture).toContain('Engram')
		expect(architecture).toContain('```mermaid')
	})
})
