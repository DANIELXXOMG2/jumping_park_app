import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

const docsReadmeQuadrantHeadings = [
	'## Tutorials',
	'## How-to guides',
	'## Reference',
	'## Explanation',
] as const

const docsReadmeRequiredStatusRows = [
	'| `docs/MANUAL_USUARIO.md` | historical |',
	'| `docs/runbooks/production-hardening.md` | current |',
	'| `docs/runbooks/rollback-flags.md` | current |',
	'| `docs/adr/README.md` | current |',
	'| `docs/ARQUITECTURA.md` | current |',
	'| `docs/runbooks/otp-operational-policy.md` | current |',
	'| `docs/portfolio/README.md` | current |',
	'| `docs/INFORME_TECNICO_SPRINT_3.md` | historical |',
] as const

const adrExtractionFiles = [
	'docs/adr/0001-app-router-service-layer.md',
	'docs/adr/0002-rollout-flags-hardening-policy.md',
	'docs/adr/0003-admin-session-and-otp-split.md',
	'docs/adr/0004-cursor-pagination-and-admin-aggregates.md',
	'docs/adr/0005-offline-consent-queue-and-sync-ledger.md',
	'docs/adr/README.md',
	'scripts/render-diagrams.ts',
] as const

const allowedDocsReadmeStatuses = new Set(['current', 'reference', 'historical'])
const docsPathPattern = /`(docs\/[^`]+\.md)`/g

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

function extractDocsMarkdownPaths(markdown: string): string[] {
	return Array.from(markdown.matchAll(docsPathPattern), ([, path]) => path).filter(
		(path) => !path.includes('{'),
	)
}

function docsReadmePathIsHubLevel(path: string): boolean {
	const segments = path.split('/')

	return segments.length === 2 || segments.length === 3
}

function extractDocsReadmeTableStatuses(markdown: string): string[] {
	return markdown
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.startsWith('| `docs/') && line.endsWith(' |'))
		.map((line) => line.split('|').map((cell) => cell.trim())[2])
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

	it('keeps the integrated readmes truthful after batches 1-4', () => {
		const rootReadme = readFileSync(join(cleanRoot, 'README.md'), 'utf8')
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')
		const diagramGuide = readFileSync(
			join(cleanRoot, 'docs/portfolio/diagrams/README.md'),
			'utf8',
		)

		expect(rootReadme.includes('## Runtime Surfaces')).toBe(true)
		expect(rootReadme.includes('## Not yet reapplied in this workflow')).toBe(false)
		expect(docsReadme.includes('## Current / usable hoy')).toBe(false)
		expect(docsReadme.includes('## Planned / later batches')).toBe(false)
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

	it('keeps docs README aligned with the integrated current-vs-historical contract', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')
		const referencedDocsPaths = extractDocsMarkdownPaths(docsReadme)
		const statusMarkers = extractDocsReadmeTableStatuses(docsReadme)

		expect(docsReadmeQuadrantHeadings.filter((heading) => !docsReadme.includes(heading))).toEqual([])
		expect(docsReadmeRequiredStatusRows.filter((row) => !docsReadme.includes(row))).toEqual([])
		expect(docsReadme).toContain('`docs/{doc}.md` or `docs/{category}/{doc}.md`')
		expect(referencedDocsPaths.filter((path) => !docsReadmePathIsHubLevel(path))).toEqual([])
		expect(
			referencedDocsPaths.filter((path) => !existsSync(join(cleanRoot, path))),
		).toEqual([])
		expect(statusMarkers.filter((status) => !allowedDocsReadmeStatuses.has(status))).toEqual([])
	})

	it('keeps ADR extraction and diagram tooling truthful', async () => {
		const extractionSources = readFileSync(join(cleanRoot, 'docs/.extraction-sources.md'), 'utf8')
		const scripts = readPackageScripts()

		expect(adrExtractionFiles.filter((relativePath) => !existsSync(join(cleanRoot, relativePath)))).toEqual([])
		expect(extractionSources).toContain('| Target file | Source branch | Source commit | Source blob | Extracted date |')
		expect(extractionSources).toContain('| `docs/adr/README.md` | `docs/english-ia-overhaul` | `6e5a3de` |')
		expect(extractionSources).toContain('| `scripts/render-diagrams.ts` | `docs/english-ia-overhaul` | `6e5a3de` |')
		expect(scripts['diagram:render']).toContain('bun build')
		expect(scripts['diagram:render']).toContain('render-diagrams.ts')
		expect(scripts['diagram:render']).toContain('--target=node')
		expect(scripts['diagram:render']).toContain('node ./scripts/render-diagrams.mjs')

		const { resolveDiagramJobs, renderDiagramJobs } = (await import(
			join(cleanRoot, 'scripts', 'render-diagrams.ts')
		)) as typeof import('../scripts/render-diagrams')
		const tempRoot = join(cleanRoot, '.tmp-diagram-test')
		const outputDir = join(tempRoot, 'docs', 'assets', 'diagrams')
		const jobs = resolveDiagramJobs(['b-sequence.mmd', 'a-er.mmd'], outputDir)

		expect(jobs.map(({ outputPath, diagramId }) => [outputPath.split(/[\\/]/).at(-1), diagramId])).toEqual([
			['a-er.svg', 'diagram-01-a-er'],
			['b-sequence.svg', 'diagram-02-b-sequence'],
		])

		await renderDiagramJobs(jobs, {
			readDiagram: (inputPath) => inputPath,
			renderSvg: async ({ diagramId, source }) => `<svg data-id="${diagramId}">${source}</svg>`,
			optimizeSvg: async (svg) => svg.replace('<svg', '<svg data-optimized="true"'),
			writeSvg: async (outputPath, svg) => {
				mkdirSync(dirname(outputPath), { recursive: true })
				writeFileSync(outputPath, svg)
			},
		})

		expect(readFileSync(join(outputDir, 'a-er.svg'), 'utf8')).toContain('data-optimized="true"')
		rmSync(tempRoot, { recursive: true, force: true })
	})
})
