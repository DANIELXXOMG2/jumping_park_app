import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const sourceRoot = process.env.BATCH1_SOURCE_ROOT ?? ''
const cleanRoot = process.cwd()
const hasSourceRoot = existsSync(sourceRoot)

const exactMatchFiles = [
	'.gitignore',
	'docs/portfolio/README.md',
	'docs/portfolio/artifact-manifest.template.md',
	'docs/portfolio/branding/logo-usage.md',
	'docs/portfolio/motion/demo-script.md',
	'docs/portfolio/screenshots/README.md',
	'diagramas/README.md',
	'diagramas/Diagrama-Secuencia.mmd',
] as const

const svgFiles = [
	'diagramas/Diagrama-Secuencia.svg',
] as const

const requiredCompanionFiles = [
	'CONTRIBUTING.md',
	'docs/runbooks/admin-cost-smoke-checklist.md',
	'docs/runbooks/dependency-risk-note.md',
	'docs/runbooks/offline-replay-drill.md',
	'docs/runbooks/rollback-flags.md',
	'docs/runbooks/seo-ai-seo-validation-checklist.md',
] as const

const docsThatMustAvoidOpenSpecRefs = [
	'docs/portfolio/diagrams/README.md',
] as const

const staleOpenSpecReference = 'openspec/'

const rootReadmeRequiredFileClaims = [
	{
		claim: '`src/services/adminMetricsService.ts`',
		path: 'src/services/adminMetricsService.ts',
	},
	{
		claim: '`tests/foundation-rollout-scaffolding.test.ts`',
		path: 'tests/foundation-rollout-scaffolding.test.ts',
	},
	{
		claim: '`tests/offline-resilience.test.ts`',
		path: 'tests/offline-resilience.test.ts',
	},
	{
		claim: '`tests/phase5-verification-hardening.test.ts`',
		path: 'tests/phase5-verification-hardening.test.ts',
	},
	{
		claim: '`docs/runbooks/production-hardening.md`',
		path: 'docs/runbooks/production-hardening.md',
	},
	{ claim: 'llms.txt', path: 'src/app/llms.txt/route.ts' },
] as const

const rootReadmeRequiredCollections = [
	'admin_metrics',
	'offline_sync',
	'admin_audit_logs',
] as const

const docsReadmeQuickLinks = [
	'`README.md`',
	'`docs/ARQUITECTURA.md`',
	'`docs/runbooks/production-hardening.md`',
	'`docs/portfolio/README.md`',
	'`docs/archive/archive-README.md`',
] as const

const archivedDocs = [
	'docs/archive/README.md',
	'docs/archive/exploration-report.md',
	'docs/archive/MANUAL_USUARIO.md',
	'docs/archive/MANUAL_INSTALACION.md',
	'docs/archive/INFORME_TECNICO_SPRINT_3.md',
	'docs/archive/ESTRUCTURA_PROYECTO.md',
] as const

const originalHistoricalDocs = [
	'docs/MANUAL_USUARIO.md',
	'docs/MANUAL_INSTALACION.md',
	'docs/INFORME_TECNICO_SPRINT_3.md',
	'docs/ESTRUCTURA_PROYECTO.md',
	'docs/exploration-report.md',
] as const

interface PackageJsonShape {
	scripts?: Record<string, string>
}

function sha256(filePath: string): string {
	return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function findMismatches(files: readonly string[]): string[] {
	return files.flatMap((relativePath) => {
		const sourcePath = join(sourceRoot, relativePath)
		const cleanPath = join(cleanRoot, relativePath)

		if (!existsSync(sourcePath)) {
			return [`missing source file: ${relativePath}`]
		}

		if (!existsSync(cleanPath)) {
			return [`missing clean file: ${relativePath}`]
		}

		return sha256(sourcePath) === sha256(cleanPath)
			? []
			: [`content mismatch: ${relativePath}`]
	})
}

function readPackageScripts(): Record<string, string> {
	const packageJson = JSON.parse(
		readFileSync(join(cleanRoot, 'package.json'), 'utf8'),
	) as PackageJsonShape

	return packageJson.scripts ?? {}
}

	describe('batch 1 docs and hygiene reapply', () => {
		it('matches the source working tree for copied docs and hygiene files', () => {
			if (!hasSourceRoot) {
				return
			}
			expect(findMismatches(exactMatchFiles)).toEqual([])
		})

		it('matches the source working tree for diagram svg exports', () => {
			if (!hasSourceRoot) {
				return
			}
			expect(findMismatches(svgFiles)).toEqual([])
		})

	it('removes local claude settings from the clean clone', () => {
		expect(existsSync(join(cleanRoot, '.claude/settings.local.json'))).toBe(false)
	})

	it('keeps directly referenced companion docs present in the clean clone', () => {
		expect(
			requiredCompanionFiles.filter(
				(relativePath) => !existsSync(join(cleanRoot, relativePath)),
			),
		).toEqual([])
	})

	it('keeps the documentation entrypoints truthful after the IA index lands', () => {
		const rootReadme = readFileSync(join(cleanRoot, 'README.md'), 'utf8')
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')
		const archiveReadme = readFileSync(
			join(cleanRoot, 'docs/archive/archive-README.md'),
			'utf8',
		)
		const diagramGuide = readFileSync(
			join(cleanRoot, 'docs/portfolio/diagrams/README.md'),
			'utf8',
		)

		expect(rootReadme.includes('## Runtime Surfaces')).toBe(true)
		expect(rootReadme.includes('## Not yet reapplied in this workflow')).toBe(false)
		expect(docsReadme.includes('# Documentation index')).toBe(true)
		expect(docsReadme.includes('## Active surfaces')).toBe(true)
		expect(archiveReadme.includes('# Historical documentation archive')).toBe(true)
		expect(diagramGuide.includes('## Suggested source of truth')).toBe(true)
	})

	it('removes stale openspec references from the integrated clean clone docs', () => {
		const rootReadme = readFileSync(join(cleanRoot, 'README.md'), 'utf8')
		const docsWithOpenSpecReferences = docsThatMustAvoidOpenSpecRefs.filter(
			(relativePath) =>
				readFileSync(join(cleanRoot, relativePath), 'utf8').includes(
					staleOpenSpecReference,
				),
		)

		expect(rootReadme.includes(staleOpenSpecReference)).toBe(false)
		expect(docsWithOpenSpecReferences).toEqual([])
	})

	it('proves the current README contract against reapplied batch 2-4 artifacts', () => {
		const rootReadme = readFileSync(join(cleanRoot, 'README.md'), 'utf8')
		const scripts = readPackageScripts()

		expect(rootReadmeRequiredFileClaims.filter(({ claim }) => !rootReadme.includes(claim))).toEqual([])
		expect(
			rootReadmeRequiredFileClaims.filter(
				({ path }) => !existsSync(join(cleanRoot, path)),
			),
		).toEqual([])
		expect(rootReadmeRequiredCollections.filter((claim) => !rootReadme.includes(claim))).toEqual([])
		expect(scripts['check:phase5']).toBeDefined()
	})

	it('keeps docs README stable while historical files move into docs/archive', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')
		const archiveReadme = readFileSync(
			join(cleanRoot, 'docs/archive/archive-README.md'),
			'utf8',
		)

		expect(docsReadmeQuickLinks.filter((claim) => !docsReadme.includes(claim))).toEqual(
			[],
		)
		expect(archivedDocs.filter((relativePath) => !existsSync(join(cleanRoot, relativePath)))).toEqual(
			[],
		)
		expect(
			originalHistoricalDocs.filter((relativePath) =>
				existsSync(join(cleanRoot, relativePath)),
			),
		).toEqual([])
		expect(
			archivedDocs.filter(
				(relativePath) => !archiveReadme.includes(`\`${relativePath}\``),
			),
		).toEqual([])
	})

	it('updates the root README historical references to the archive paths', () => {
		const rootReadme = readFileSync(join(cleanRoot, 'README.md'), 'utf8')

		expect(archivedDocs.filter((relativePath) => !rootReadme.includes(relativePath))).toEqual(
			[],
		)
		expect(
			originalHistoricalDocs.filter((relativePath) => rootReadme.includes(relativePath)),
		).toEqual([])
	})
})
