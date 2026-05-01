import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function projectPath(relativePath: string) {
	return path.join(process.cwd(), relativePath)
}

function readProjectFile(relativePath: string) {
	return readFileSync(projectPath(relativePath), 'utf8')
}

describe('batch 4 openspec traceability reapply', () => {
	it('restores the OpenSpec config, main specs, and archived roadmap artifacts', () => {
		expect(existsSync(projectPath('openspec/config.yaml'))).toBe(true)
		expect(existsSync(projectPath('openspec/specs/admin-dashboard/spec.md'))).toBe(true)
		expect(existsSync(projectPath('openspec/specs/kiosk-flow/spec.md'))).toBe(true)
		expect(existsSync(projectPath('openspec/specs/offline-resilience/spec.md'))).toBe(true)
		expect(existsSync(projectPath('openspec/specs/seo-optimization/spec.md'))).toBe(true)

		const archiveBase =
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap'
		expect(existsSync(projectPath(`${archiveBase}/state.yaml`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/archive-report.md`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/proposal.md`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/design.md`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/tasks.md`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/apply-progress.md`))).toBe(true)
		expect(existsSync(projectPath(`${archiveBase}/verify-report.md`))).toBe(true)
	})

	it('restores the traceability changes that explain batches 1 and 2', () => {
		expect(
			existsSync(
				projectPath(
					'openspec/changes/safe-apply-scope-docs-repo-hygiene/apply-progress.md',
				),
			),
		).toBe(true)
		expect(
			existsSync(
				projectPath(
					'openspec/changes/safe-apply-scope-docs-repo-hygiene/verify-report.md',
				),
			),
		).toBe(true)

		expect(
			existsSync(projectPath('openspec/changes/configurable-otp-timing/proposal.md')),
		).toBe(true)
		expect(
			existsSync(projectPath('openspec/changes/configurable-otp-timing/design.md')),
		).toBe(true)
		expect(
			existsSync(projectPath('openspec/changes/configurable-otp-timing/tasks.md')),
		).toBe(true)
		expect(
			existsSync(
				projectPath('openspec/changes/configurable-otp-timing/apply-progress.md'),
			),
		).toBe(true)
		expect(
			existsSync(
				projectPath('openspec/changes/configurable-otp-timing/verify-report.md'),
			),
		).toBe(true)
		expect(
			existsSync(
				projectPath('openspec/changes/configurable-otp-timing/specs/kiosk-flow/spec.md'),
			),
		).toBe(true)
	})

	it('keeps archived roadmap references truthful in repository docs', () => {
		const architecture = readProjectFile('docs/ARQUITECTURA.md')

		expect(architecture).toContain(
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/proposal.md',
		)
		expect(architecture).toContain(
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/design.md',
		)
		expect(architecture).toContain(
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/tasks.md',
		)
		expect(architecture).toContain(
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap/apply-progress.md',
		)
		expect(architecture).not.toContain(
			'openspec/changes/comprehensive-product-audit-and-roadmap/',
		)
	})

	it('keeps archived roadmap references truthful inside archived roadmap artifacts', () => {
		const archiveBase =
			'openspec/changes/archive/2026-04-07-comprehensive-product-audit-and-roadmap'
		const liveBase = 'openspec/changes/comprehensive-product-audit-and-roadmap'
		const archivedFiles = [
			'archive-report.md',
			'apply-progress.md',
			'verify-report.md',
		]

		for (const archivedFile of archivedFiles) {
			const archivedContent = readProjectFile(`${archiveBase}/${archivedFile}`)

			expect(archivedContent).toContain(archiveBase)
			expect(archivedContent).not.toContain(liveBase)
		}
	})

	it('keeps the batch-4 workflow artifacts aligned with the clean-clone state', () => {
		const proposal = readProjectFile(
			'openspec/changes/git-corrupted-reapply-workflow/proposal.md',
		)
		const tasks = readProjectFile(
			'openspec/changes/git-corrupted-reapply-workflow/tasks.md',
		)
		const progress = readProjectFile(
			'openspec/changes/git-corrupted-reapply-workflow/apply-progress.md',
		)

		expect(proposal).toContain('OpenSpec & Traceability')
		expect(tasks).toContain(
			'- [x] 5.1 Reapply `openspec/config.yaml` and `openspec/specs/**` reflecting final state',
		)
		expect(tasks).toContain(
			'- [x] 5.2 Reapply `openspec/changes/**` archive with clean-clone provenance',
		)
		expect(progress).toContain('- `5.1` -> complete')
		expect(progress).toContain('- `5.2` -> complete')
		expect(progress).toContain('Batch 4 OpenSpec/config/specs/archive traceability reapply')
	})
})
