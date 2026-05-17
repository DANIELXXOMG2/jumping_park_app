import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string): string {
	return readFileSync(join(projectRoot, relativePath), 'utf8')
}

describe('ADR log stays truthful', () => {
	it('publishes an ADR workspace with an index and the five current decision records', () => {
		const adrPaths = [
			'docs/adr/README.md',
			'docs/adr/0001-app-router-service-layer.md',
			'docs/adr/0002-rollout-flags-hardening-policy.md',
			'docs/adr/0003-admin-session-and-otp-split.md',
			'docs/adr/0004-cursor-pagination-and-admin-aggregates.md',
			'docs/adr/0005-offline-consent-queue-and-sync-ledger.md',
		]

		for (const adrPath of adrPaths) {
			expect(existsSync(join(projectRoot, adrPath))).toBe(true)
		}

		const adrIndex = readProjectFile('docs/adr/README.md')

		expect(adrIndex).toContain('# Architecture decision records')
		expect(adrIndex).toContain('## Quick path')
		expect(adrIndex).toContain('## Current ADR set')
		expect(adrIndex).toContain('## Traceability notes')
		expect(adrIndex).toContain('`0001-app-router-service-layer.md`')
		expect(adrIndex).toContain('`0002-rollout-flags-hardening-policy.md`')
		expect(adrIndex).toContain('`0003-admin-session-and-otp-split.md`')
		expect(adrIndex).toContain('`0004-cursor-pagination-and-admin-aggregates.md`')
		expect(adrIndex).toContain('`0005-offline-consent-queue-and-sync-ledger.md`')
	})

	it('ties each ADR back to current repo evidence, Engram context, and the active docs index', () => {
		const docsIndex = readProjectFile('docs/README.md')
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

		for (const adrFile of adrFiles) {
			const content = readProjectFile(adrFile.path)

			expect(content).toContain('## Decision')
			expect(content).toContain('## Repository evidence')
			expect(content).toContain('## Engram-backed context')

			for (const observationId of adrFile.observationIds) {
				expect(content).toContain(observationId)
			}

			for (const evidencePath of adrFile.evidence) {
				expect(content).toContain(evidencePath)
			}
		}

		expect(docsIndex).toContain(
			'| `docs/adr/` | Architecture decision records that turn Engram-backed history into repo-readable context. | Active |',
		)

		const [, plannedSection = ''] = docsIndex.split('## Planned next slices')
		expect(plannedSection).not.toContain('`docs/adr/`')
	})
})
