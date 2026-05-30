import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()
const repoDocPathPattern = /`((?:docs|tests|scripts|src)\/[^`]+(?:\.md|\.ts|\.tsx|\.mmd))`/g

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('ADR content integrity stays truthful', () => {
	const adrFiles = [
		{
			path: 'docs/adr/0001-app-router-service-layer.md',
			observationIds: ['#540'],
			evidence: ['`src/app/api/admin/consents/route.ts`', '`src/services/adminConsentListService.ts`'],
		},
		{
			path: 'docs/adr/0002-rollout-flags-hardening-policy.md',
			observationIds: ['#492'],
			evidence: ['`src/lib/hardeningPolicy.ts`', '`src/proxy.ts`'],
		},
		{
			path: 'docs/adr/0003-admin-session-and-otp-split.md',
			observationIds: ['#422'],
			evidence: ['`src/app/api/admin/session/route.ts`', '`src/services/authService.ts`'],
		},
		{
			path: 'docs/adr/0004-cursor-pagination-and-admin-aggregates.md',
			observationIds: ['#540', '#555'],
			evidence: ['`src/lib/adminCursor.ts`', '`src/services/adminMetricsService.ts`'],
		},
		{
			path: 'docs/adr/0005-offline-consent-queue-and-sync-ledger.md',
			observationIds: ['#540', '#556'],
			evidence: ['`src/lib/offline/sync.ts`', '`src/app/api/consentimientos/route.ts`'],
		},
	]

	it('each ADR has Decision, Repository evidence, and Engram-backed context sections', () => {
		for (const adrFile of adrFiles) {
			const content = readProjectFile(adrFile.path)

			expect(content).toContain('## Decision')
			expect(content).toContain('## Repository evidence')
			expect(content).toContain('## Engram-backed context')
		}
	})

	it('each ADR references its Engram observation IDs', () => {
		for (const adrFile of adrFiles) {
			const content = readProjectFile(adrFile.path)

			for (const observationId of adrFile.observationIds) {
				expect(content).toContain(observationId)
			}
		}
	})

	it('each ADR cites repo evidence paths that exist on disk', () => {
		for (const adrFile of adrFiles) {
			const content = readProjectFile(adrFile.path)
			const repoEvidenceSection = content
				.split('## Repository evidence')[1]
				?.split('## Engram-backed context')[0] ?? ''

			for (const evidencePath of adrFile.evidence) {
				expect(repoEvidenceSection).toContain(evidencePath)
			}

			for (const [, repoPath] of repoEvidenceSection.matchAll(repoDocPathPattern)) {
				expect(existsSync(join(projectRoot, repoPath))).toBe(true)
			}
		}
	})

	it('ADR index table lists every ADR file with decision, evidence, and Engram columns', () => {
		const adrIndex = readProjectFile('docs/adr/README.md')

		expect(adrIndex).toContain('# Architecture decision records')
		expect(adrIndex).toContain('## Quick path')
		expect(adrIndex).toContain('## Current ADR set')
		expect(adrIndex).toContain('## Traceability notes')

		for (const adrFile of adrFiles) {
			const filename = adrFile.path.split('/').pop()!
			expect(adrIndex).toContain(`\`${filename}\``)
		}

		expect(adrIndex).toContain('`src/lib/hardeningPolicy.ts`')
		expect(adrIndex).toContain('`src/lib/adminCursor.ts`')
		expect(adrIndex).toContain('`src/lib/offline/sync.ts`')
	})
})

describe('guide cross-references stay truthful', () => {
	const guides = [
		'docs/guides/getting-started.md',
		'docs/guides/deployment.md',
		'docs/guides/testing.md',
	]

	it('every guide exists on disk', () => {
		for (const guidePath of guides) {
			expect(existsSync(join(projectRoot, guidePath))).toBe(true)
		}
	})

	it('every guide has Diátaxis metadata and current status', () => {
		for (const guidePath of guides) {
			const guide = readProjectFile(guidePath)

			expect(guide).toContain('> **Status**: current')
			expect(guide).toContain('> **Diátaxis**:')
		}
	})

	it('getting-started guide cross-references runbooks and CONTRIBUTING', () => {
		const guide = readProjectFile('docs/guides/getting-started.md')

		expect(guide).toContain('docs/runbooks/production-hardening.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')
		expect(guide).toContain('CONTRIBUTING.md')

		expect(existsSync(join(projectRoot, 'docs/runbooks/production-hardening.md'))).toBe(true)
		expect(existsSync(join(projectRoot, 'docs/runbooks/rollback-flags.md'))).toBe(true)
		expect(existsSync(join(projectRoot, 'CONTRIBUTING.md'))).toBe(true)
	})

	it('deployment guide cross-references flag runbooks for each gated capability', () => {
		const guide = readProjectFile('docs/guides/deployment.md')

		expect(guide).toContain('docs/runbooks/seo-ai-seo-validation-checklist.md')
		expect(guide).toContain('docs/runbooks/admin-cost-smoke-checklist.md')
		expect(guide).toContain('docs/runbooks/offline-replay-drill.md')
		expect(guide).toContain('docs/runbooks/rollback-flags.md')

		expect(existsSync(join(projectRoot, 'docs/runbooks/seo-ai-seo-validation-checklist.md'))).toBe(true)
		expect(existsSync(join(projectRoot, 'docs/runbooks/admin-cost-smoke-checklist.md'))).toBe(true)
		expect(existsSync(join(projectRoot, 'docs/runbooks/offline-replay-drill.md'))).toBe(true)
	})

	it('testing guide references real CI workflow files', () => {
		const guide = readProjectFile('docs/guides/testing.md')

		expect(guide).toContain('.github/workflows/ci.yml')
		expect(guide).toContain('.github/workflows/lighthouse.yml')
		expect(guide).toContain('docs/runbooks/production-hardening.md')

		expect(existsSync(join(projectRoot, '.github/workflows/ci.yml'))).toBe(true)
		expect(existsSync(join(projectRoot, '.github/workflows/lighthouse.yml'))).toBe(true)
	})

	it('all internal cross-references within guides resolve to existing files', () => {
		const internalLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
		const repoPathSpansPattern = /`((?:docs|tests|scripts|src)\/[^`]+\.md)`/g

		for (const guidePath of guides) {
			const guide = readProjectFile(guidePath)
			const guideDir = join(projectRoot, guidePath).replace(/[\\/][^\\/]+$/, '')

			for (const [, , linkTarget] of guide.matchAll(internalLinkPattern)) {
				if (linkTarget.startsWith('http') || linkTarget.startsWith('#')) continue

				const resolvedPath = linkTarget.startsWith('../')
					? join(guideDir, linkTarget)
					: join(projectRoot, linkTarget)

				expect(existsSync(resolvedPath)).toBe(true)
			}

			for (const [, repoPath] of guide.matchAll(repoPathSpansPattern)) {
				expect(existsSync(join(projectRoot, repoPath))).toBe(true)
			}
		}
	})
})

describe('documentation hub cross-references stay truthful', () => {
	it('every docs path referenced in docs/README.md resolves to an existing file', () => {
		const docsReadme = readProjectFile('docs/README.md')
		const docsPathPattern = /`(docs\/[^`]+\.md)`/g

		for (const [, path] of docsReadme.matchAll(docsPathPattern)) {
			if (path.includes('{')) continue
			expect(existsSync(join(projectRoot, path))).toBe(true)
		}
	})

	it('every docs path referenced in root README.md resolves to an existing file', () => {
		const rootReadme = readProjectFile('README.md')
		const docsPathPattern = /`(docs\/[^`]+)`/g

		for (const [, path] of rootReadme.matchAll(docsPathPattern)) {
			if (path.includes('{') || !path.endsWith('.md')) continue
			expect(existsSync(join(projectRoot, path))).toBe(true)
		}
	})

	it('extraction sources table references target files that exist on disk', () => {
		const extractionSources = readProjectFile('docs/.extraction-sources.md')
		const rows = extractionSources
			.split('\n')
			.filter((line) => line.startsWith('| `') && line.includes(' |'))

		for (const row of rows) {
			const cells = row.split('|').map((cell) => cell.trim())
			const targetFile = cells[1]?.replace(/`/g, '')

			if (!targetFile || targetFile === 'Target file') continue
			if (targetFile === 'Source branch') continue

			expect(existsSync(join(projectRoot, targetFile))).toBe(true)
		}
	})

	it('extraction sources table also references scripts that exist on disk', () => {
		const extractionSources = readProjectFile('docs/.extraction-sources.md')
		const rows = extractionSources
			.split('\n')
			.filter((line) => line.startsWith('| `scripts/') && line.includes(' |'))

		for (const row of rows) {
			const cells = row.split('|').map((cell) => cell.trim())
			const targetFile = cells[1]?.replace(/`/g, '')

			if (!targetFile) continue
			expect(existsSync(join(projectRoot, targetFile))).toBe(true)
		}
	})
})
