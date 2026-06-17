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
	'| `docs/reference/architecture.md` | current |',
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
		expect(scripts['check:phase5']).toBeUndefined()
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

	// --- Architecture reference doc (slice 3) assertions ---

	const architectureDocPath = 'docs/reference/architecture.md'

	const architectureRequiredSections = [
		'## 1. Executive summary',
		'## 2. System planes',
		'## 3. Data Flow',
		'## 4. Collections and operational contracts',
		'## 5. Cursor data plane',
		'## 6. Aggregates and recompute',
		'## 7. Offline resilience',
		'## 8. SEO, AI-SEO, and public artifacts',
		'## 9. Security and rollout',
		'## 10. Verification and evidence',
		'## 11. Traceability',
	]

	const architectureRequiredSourceLinks = [
		{ file: 'src/proxy.ts', label: 'src/proxy.ts' },
		{ file: 'src/lib/adminCursor.ts', label: 'src/lib/adminCursor.ts' },
		{ file: 'src/lib/firestoreService.ts', label: 'src/lib/firestoreService.ts' },
		{ file: 'src/services/adminMetricsService.ts', label: 'src/services/adminMetricsService.ts' },
		{ file: 'src/lib/hardeningPolicy.ts', label: 'src/lib/hardeningPolicy.ts' },
		{ file: 'src/store/kioskStore.ts', label: 'src/store/kioskStore.ts' },
		{ file: 'src/lib/seo.ts', label: 'src/lib/seo.ts' },
	]

	const architectureRequiredCollections = [
		'otp_challenges',
		'otp_access_sessions',
		'consents',
		'minors_index',
		'admin_metrics',
		'offline_sync',
		'admin_audit_logs',
	]

	it('keeps the architecture reference doc present and truthful', () => {
		const architectureDoc = readFileSync(join(cleanRoot, architectureDocPath), 'utf8')

		expect(architectureDoc.startsWith('# System Architecture\n')).toBe(true)
		expect(architectureDoc).toContain('> **Status**: current')
		expect(architectureDoc).toContain('> **Diátaxis**: Reference')

		for (const section of architectureRequiredSections) {
			expect(architectureDoc).toContain(section)
		}

		for (const { file, label } of architectureRequiredSourceLinks) {
			expect(existsSync(join(cleanRoot, file))).toBe(true)
			expect(architectureDoc).toContain(label)
		}

		for (const collection of architectureRequiredCollections) {
			expect(architectureDoc).toContain(collection)
		}

		// Verify all internal doc links resolve
		const docLinkPattern = /\((\.\.\/|docs\/)[^)]+\.md\)/g
		const architectureDocDirectory = join(cleanRoot, 'docs', 'reference')
		for (const [link] of architectureDoc.matchAll(docLinkPattern)) {
			const path = link.slice(1, -1) // strip parens
			const resolvedPath = path.startsWith('../')
				? join(architectureDocDirectory, path)
				: join(cleanRoot, path)
			expect(existsSync(resolvedPath)).toBe(true)
		}
	})

	it('keeps architecture doc linked from hub as current reference', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')

		expect(docsReadme).toContain('| `docs/reference/architecture.md` | current |')
		expect(docsReadme).toContain('English reference architecture')
	})

	// --- Triangulation: verify architecture doc claims resolve to real files ---

	const architectureSourceFileClaims = [
		{ claim: 'src/app/(public)/consentimiento-digital/page.tsx', file: 'src/app/(public)/consentimiento-digital/page.tsx' },
		{ claim: 'src/app/robots.ts', file: 'src/app/robots.ts' },
		{ claim: 'src/app/sitemap.ts', file: 'src/app/sitemap.ts' },
		{ claim: 'src/app/llms.txt/route.ts', file: 'src/app/llms.txt/route.ts' },
		{ claim: 'src/services/userService.ts', file: 'src/services/userService.ts' },
		{ claim: 'src/services/minorIndexService.ts', file: 'src/services/minorIndexService.ts' },
		{ claim: 'src/app/api/admin/consents/route.ts', file: 'src/app/api/admin/consents/route.ts' },
	]

	it('verifies every source-file claim in the architecture doc resolves', () => {
		const architectureDoc = readFileSync(join(cleanRoot, architectureDocPath), 'utf8')

		const missing = architectureSourceFileClaims.filter(({ claim, file }) => {
			if (!architectureDoc.includes(claim)) return true
			if (!existsSync(join(cleanRoot, file))) return true
			return false
		})

		expect(missing).toEqual([])
	})

	it('verifies architecture doc describes the current stack versions', () => {
		const architectureDoc = readFileSync(join(cleanRoot, architectureDocPath), 'utf8')

		expect(architectureDoc).toContain('Next.js 16')
		expect(architectureDoc).toContain('React 19')
		expect(architectureDoc).toContain('Bun')
		expect(architectureDoc).toContain('Firestore')
		expect(architectureDoc).toContain('Zustand')
		expect(architectureDoc).toContain('SWR')
	})

	// --- Firebase reference doc (slice 4) assertions ---

	const firebaseDocPath = 'docs/reference/firebase.md'

	const firebaseRequiredSections = [
		'## 1. Overview',
		'## 2. Firestore Collections',
		'## 3. Security Rules (firestore.rules)',
		'## 4. Composite Indexes',
		'## 5. Auth & OTP Flow',
		'## 6. Storage Rules',
		'## 7. Operational Notes',
		'## 8. Traceability',
	]

	const firebaseRequiredCollections = [
		'admin_users',
		'users',
		'otp_challenges',
		'otp_access_sessions',
		'otp_sessions',
		'offline_sync',
		'minors_index',
		'admin_metrics',
		'admin_audit_logs',
		'consents',
		'accesses',
	]

	const firebaseRequiredSourceLinks = [
		{ file: 'firebase/firestore.rules', label: 'firebase/firestore.rules' },
		{ file: 'firebase/firestore.indexes.json', label: 'firebase/firestore.indexes.json' },
		{ file: 'firebase/storage.rules', label: 'firebase/storage.rules' },
		{ file: 'src/services/authService.ts', label: 'src/services/authService.ts' },
		{ file: 'src/lib/adminAuth.ts', label: 'src/lib/adminAuth.ts' },
		{ file: 'src/types/auth.ts', label: 'src/types/auth.ts' },
		{ file: 'src/lib/utils/otpConfig.ts', label: 'src/lib/utils/otpConfig.ts' },
		{ file: '.env.example', label: '.env.example' },
	]

	const firebaseRequiredIndexClaims = [
		'consents',
		'userId',
		'createdAt',
		'signedAt',
		'validUntil',
		'admin_users',
		'role',
		'minors_index',
		'parentId',
		'updatedAt',
	]

	it('keeps the firebase reference doc present and truthful', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')

		expect(firebaseDoc.startsWith('# Firebase Configuration & Operations\n')).toBe(true)
		expect(firebaseDoc).toContain('> **Status**: current')
		expect(firebaseDoc).toContain('> **Diátaxis**: Reference')

		for (const section of firebaseRequiredSections) {
			expect(firebaseDoc).toContain(section)
		}

		for (const collection of firebaseRequiredCollections) {
			expect(firebaseDoc).toContain(`\`${collection}\``)
		}

		for (const { file, label } of firebaseRequiredSourceLinks) {
			expect(existsSync(join(cleanRoot, file))).toBe(true)
			expect(firebaseDoc).toContain(label)
		}

		// Verify auth diagram is linked
		expect(firebaseDoc).toContain('diagramas/auth-sequence.mmd')
		expect(firebaseDoc).toContain('Auth & OTP Flow')

		// Verify index claims are present
		for (const claim of firebaseRequiredIndexClaims) {
			expect(firebaseDoc).toContain(claim)
		}

		// Verify all internal doc links resolve
		const docLinkPattern = /\((\.\.\/|docs\/)[^)]+\.md\)/g
		for (const [link] of firebaseDoc.matchAll(docLinkPattern)) {
			const path = link.slice(1, -1)
			const firebaseDocDir = join(cleanRoot, 'docs', 'reference')
			const resolvedPath = path.startsWith('../')
				? join(firebaseDocDir, path)
				: join(cleanRoot, path)
			expect(existsSync(resolvedPath)).toBe(true)
		}
	})

	it('keeps firebase doc linked from hub as current reference', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')

		expect(docsReadme).toContain('| `docs/reference/firebase.md` | current |')
		expect(docsReadme).toContain('Firebase configuration')
	})

	// --- Triangulation: verify firebase doc claims against real config files ---

	it('verifies firebase doc collection list matches firestore.rules', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')
		const rulesContent = readFileSync(join(cleanRoot, 'firebase/firestore.rules'), 'utf8')

		// Every match /{collection}/ in rules should be mentioned in the doc
		const collectionPattern = /match \/([a-z_]+)\/\{/g
		const rulesCollections = new Set<string>()
		for (const [, name] of rulesContent.matchAll(collectionPattern)) {
			if (name !== 'databases' && name !== 'document') {
				rulesCollections.add(name)
			}
		}

		const missingFromDoc: string[] = []
		for (const col of rulesCollections) {
			if (!firebaseDoc.includes(`\`${col}\``)) {
				missingFromDoc.push(col)
			}
		}

		expect(missingFromDoc).toEqual([])
	})

	it('verifies firebase doc index claims match firestore.indexes.json', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')
		const indexesContent = JSON.parse(
			readFileSync(join(cleanRoot, 'firebase/firestore.indexes.json'), 'utf8'),
		) as { indexes: Array<{ collectionGroup: string; fields: Array<{ fieldPath: string }> }> }

		for (const index of indexesContent.indexes) {
			expect(firebaseDoc).toContain(index.collectionGroup)
			for (const field of index.fields) {
				if (field.fieldPath !== '__name__') {
					expect(firebaseDoc).toContain(field.fieldPath)
				}
			}
		}
	})

	it('verifies firebase doc references real env vars from .env.example', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')
		const envExample = readFileSync(join(cleanRoot, '.env.example'), 'utf8')

		const otpEnvVars = ['OTP_EXPIRATION_MINUTES', 'OTP_SESSION_DURATION_MINUTES', 'OTP_LOCKOUT_MINUTES']
		for (const envVar of otpEnvVars) {
			expect(firebaseDoc).toContain(envVar)
			expect(envExample).toContain(envVar)
		}
	})

	// --- Auth sequence diagram (slice 4) assertions ---

	const authDiagramPath = 'diagramas/auth-sequence.mmd'

	it('keeps the auth sequence diagram present and valid', () => {
		expect(existsSync(join(cleanRoot, authDiagramPath))).toBe(true)

		const diagramContent = readFileSync(join(cleanRoot, authDiagramPath), 'utf8')
		expect(diagramContent.startsWith('sequenceDiagram')).toBe(true)

		// Must cover OTP lifecycle
		expect(diagramContent).toContain('OTP')
		expect(diagramContent).toContain('challenge')
		expect(diagramContent).toContain('validate')
		expect(diagramContent).toContain('session')
		expect(diagramContent).toContain('lockout')
		expect(diagramContent).toContain('Firestore')
		expect(diagramContent).toContain('Resend')
		expect(diagramContent).toContain('Admin SDK')
	})

	it('keeps the diagramas README listing the auth diagram', () => {
		const diagramReadme = readFileSync(join(cleanRoot, 'diagramas/README.md'), 'utf8')
		expect(diagramReadme).toContain('auth-sequence.mmd')
	})

	// --- Triangulation: verify firebase doc content truthfulness ---

	it('verifies firebase doc mentions specific storage paths from storage.rules', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')
		const storageRules = readFileSync(join(cleanRoot, 'firebase/storage.rules'), 'utf8')

		// Storage rules define specific paths
		expect(storageRules).toContain('match /signatures/{userId}/{assetPath=**}')
		expect(storageRules).toContain('match /generated-pdfs/{documentPath=**}')
		expect(storageRules).toContain('function isAdmin()')
		expect(firebaseDoc).toContain('signatures')
		expect(firebaseDoc).toContain('generated-pdfs')
		expect(firebaseDoc).toContain('isAdmin()')

		// Must reference signed URLs pattern
		expect(firebaseDoc).toContain('signed URL')
	})

	it('verifies firebase doc cross-references architecture doc', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')
		const architectureDoc = readFileSync(join(cleanRoot, 'docs/reference/architecture.md'), 'utf8')

		// Firebase doc links to architecture doc
		expect(firebaseDoc).toContain('docs/reference/architecture.md')

		// Architecture doc mentions firebase collections that are documented
		const sharedCollections = ['consents', 'otp_challenges', 'offline_sync', 'admin_metrics']
		for (const col of sharedCollections) {
			expect(architectureDoc).toContain(col)
		}
	})

	it('verifies auth diagram contains sequenceDiagram participants and alt blocks', () => {
		const diagramContent = readFileSync(join(cleanRoot, authDiagramPath), 'utf8')

		// Must be valid Mermaid sequence diagram
		expect(diagramContent).toContain('participant ')
		expect(diagramContent).toContain('->>')
		expect(diagramContent).toContain('alt ')
		expect(diagramContent).toContain('else ')
		expect(diagramContent).toContain('end')
		expect(diagramContent).toContain('Note over')

		// Must reference actual API routes
		expect(diagramContent).toContain('/api/otp')
		expect(diagramContent).toContain('/api/consentimientos')

		// Must reference actual env vars for OTP timing
		expect(diagramContent).toContain('OTP_LOCKOUT_MINUTES')
		expect(diagramContent).toContain('otp_challenges')
		expect(diagramContent).toContain('otp_access_sessions')
	})

	it('verifies firebase doc default-deny posture is documented for both firestore and storage', () => {
		const firebaseDoc = readFileSync(join(cleanRoot, firebaseDocPath), 'utf8')

		// Default deny should be mentioned for both services
		expect(firebaseDoc).toContain('default-deny')
		expect(firebaseDoc).toContain('{document=**}')

		// Storage default deny as well
		const defaultDenyCount = (firebaseDoc.match(/default-deny/g) ?? []).length
		expect(defaultDenyCount).toBe(2)
	})

	// --- Deploy & CI reference doc (slice 5) assertions ---

	const deployCiDocPath = 'docs/reference/deploy-and-ci.md'

	const deployCiRequiredSections = [
		'## 1. Overview',
		'## 2. Vercel Deployment Model',
		'## 3. Firebase Deploy Surface',
		'## 4. CI Pipeline',
		'## 5. Lighthouse Gates',
		'## 6. Operational Notes',
		'## 7. Traceability',
	]

	const deployCiRequiredSourceLinks = [
		{ file: '.github/workflows/ci.yml', label: '.github/workflows/ci.yml' },
		{ file: '.github/workflows/lighthouse.yml', label: '.github/workflows/lighthouse.yml' },
		{ file: 'lighthouserc.json', label: 'lighthouserc.json' },
		{ file: 'firebase.json', label: 'firebase.json' },
		{ file: '.env.example', label: '.env.example' },
		{ file: 'package.json', label: 'package.json' },
		{ file: 'next.config.ts', label: 'next.config.ts' },
	]

	const deployCiRequiredCiJobs = [
		'quality',
		'dependency-audit',
		'build-verification',
	]

	const deployCiRequiredChecks = [
		'check:format',
		'check:lint',
		'check:types',
		'check:phase5',
		'audit',
	]

	it('keeps the deploy & CI reference doc present and truthful', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')

		expect(deployCiDoc.startsWith('# Deploy & CI Reference\n')).toBe(true)
		expect(deployCiDoc).toContain('> **Status**: current')
		expect(deployCiDoc).toContain('> **Diátaxis**: Reference')
		expect(deployCiDoc).toContain('> **Audit date**:')

		for (const section of deployCiRequiredSections) {
			expect(deployCiDoc).toContain(section)
		}

		for (const { file, label } of deployCiRequiredSourceLinks) {
			expect(existsSync(join(cleanRoot, file))).toBe(true)
			expect(deployCiDoc).toContain(label)
		}

		// Verify CI job names are referenced
		for (const job of deployCiRequiredCiJobs) {
			expect(deployCiDoc).toContain(job)
		}

		// Verify all CI check commands are referenced
		for (const check of deployCiRequiredChecks) {
			expect(deployCiDoc).toContain(check)
		}

		// Verify all internal doc links resolve
		const docLinkPattern = /\((\.\.\/|docs\/)[^)]+\.md\)/g
		for (const [link] of deployCiDoc.matchAll(docLinkPattern)) {
			const path = link.slice(1, -1)
			const deployCiDocDir = join(cleanRoot, 'docs', 'reference')
			const resolvedPath = path.startsWith('../')
				? join(deployCiDocDir, path)
				: join(cleanRoot, path)
			expect(existsSync(resolvedPath)).toBe(true)
		}
	})

	it('keeps deploy & CI doc linked from hub as current reference', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')

		expect(docsReadme).toContain('| `docs/reference/deploy-and-ci.md` | current |')
		expect(docsReadme).toContain('Deploy & CI')
	})

	// --- Triangulation: verify deploy & CI doc claims against real config files ---

	it('verifies deploy & CI doc CI job structure matches ci.yml', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')
		const ciYml = readFileSync(join(cleanRoot, '.github/workflows/ci.yml'), 'utf8')

		// CI workflow must define the documented jobs
		expect(ciYml).toContain('quality:')
		expect(ciYml).toContain('dependency-audit:')
		expect(ciYml).toContain('build-verification:')

		// Doc must mention concurrency and timeout
		expect(deployCiDoc).toContain('concurrency')
		expect(deployCiDoc).toContain('cancel-in-progress')
		expect(deployCiDoc).toContain('timeout-minutes')
	})

	it('verifies deploy & CI doc Lighthouse thresholds match lighthouserc.json', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')
		const lighthouseConfig = JSON.parse(
			readFileSync(join(cleanRoot, 'lighthouserc.json'), 'utf8'),
		) as {
			ci: { assert: { assertions: Record<string, [string, { minScore?: number; maxNumericValue?: number }]> } }
		}

		const assertions = lighthouseConfig.ci.assert.assertions
		const performanceMinScore = assertions['categories:performance'][1].minScore
		const accessibilityMinScore = assertions['categories:accessibility'][1].minScore
		const bestPracticesMinScore = assertions['categories:best-practices'][1].minScore
		const seoMinScore = assertions['categories:seo'][1].minScore
		const lcpThreshold = assertions['largest-contentful-paint'][1].maxNumericValue
		const tbtThreshold = assertions['total-blocking-time'][1].maxNumericValue
		const clsThreshold = assertions['cumulative-layout-shift'][1].maxNumericValue

		// Thresholds must match the parsed config values
		expect(deployCiDoc).toContain(String(performanceMinScore))
		expect(deployCiDoc).toContain('performance')
		expect(deployCiDoc).toContain(String(accessibilityMinScore))
		expect(deployCiDoc).toContain(String(bestPracticesMinScore))
		expect(deployCiDoc).toContain(String(seoMinScore))
		expect(deployCiDoc).toContain('seo')
		expect(deployCiDoc).toContain('accessibility')
		expect(deployCiDoc).toContain('best-practices')
		expect(deployCiDoc).toContain(String(lcpThreshold))
		expect(deployCiDoc).toContain(String(tbtThreshold))
		expect(deployCiDoc).toContain(String(clsThreshold))

		// Check the config still matches
		expect(performanceMinScore).toBe(0.8)
		expect(seoMinScore).toBe(0.9)
		expect(accessibilityMinScore).toBe(0.9)
		expect(bestPracticesMinScore).toBe(0.9)
		expect(lcpThreshold).toBe(3800)
		expect(tbtThreshold).toBe(300)
		expect(clsThreshold).toBe(0.1)
	})

	it('verifies deploy & CI doc env var references exist in .env.example', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')
		const envExample = readFileSync(join(cleanRoot, '.env.example'), 'utf8')

		// Doc mentions deployment-relevant env vars
		const deployEnvVars = ['ADMIN_JWT_SECRET', 'OTP_HARDENING_ENABLED', 'PUBLIC_SEO_ENABLED']
		for (const envVar of deployEnvVars) {
			expect(deployCiDoc).toContain(envVar)
			expect(envExample).toContain(envVar)
		}

		// Doc must mention the concrete secret/env contract we actually use
		expect(deployCiDoc).toContain('ADMIN_JWT_SECRET')
		expect(deployCiDoc).toContain('RESEND_API_KEY')
	})

	it('verifies deploy & CI doc cross-references firebase doc', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')

		// Must link to firebase reference for Firebase deploy details
		expect(deployCiDoc).toContain('docs/reference/firebase.md')
	})

	it('verifies deploy & CI doc mentions Vercel deployment model', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')

		// Vercel deployment references
		expect(deployCiDoc).toContain('Vercel')
		expect(deployCiDoc).toContain('preview')
		expect(deployCiDoc).toContain('production')
		expect(deployCiDoc).toContain('Next.js')
	})

	it('verifies deploy & CI doc Lighthouse audit mentions the public route and runs count', () => {
		const deployCiDoc = readFileSync(join(cleanRoot, deployCiDocPath), 'utf8')
		const lighthouseConfig = readFileSync(join(cleanRoot, 'lighthouserc.json'), 'utf8')

		// numberOfRuns is 3 in lighthouserc.json
		expect(deployCiDoc).toContain('`consentimiento-digital`')

		// Verify actual config matches — consent route is in lighthouserc.json, not lighthouse.yml
		expect(lighthouseConfig).toContain('consentimiento-digital')
	})

	// --- Slice 6: API reference ---

	const apiDocPath = 'docs/reference/api.md'

	const apiRequiredSections = [
		'## 1. Quick path',
		'## 2. Service layer',
		'## 3. Route surface',
		'## 4. Validation surface',
		'## 5. Auth model',
	]

	const apiRequiredServiceFiles = [
		'src/services/authService.ts',
		'src/services/rateLimitService.ts',
		'src/services/emailService.ts',
		'src/services/consentService.ts',
		'src/services/pdfService.ts',
		'src/services/minorIndexService.ts',
		'src/services/userService.ts',
		'src/services/adminSessionService.ts',
		'src/services/adminMetricsService.ts',
		'src/services/adminConsentListService.ts',
		'src/services/adminExportService.ts',
		'src/services/exportRangeService.ts',
		'src/services/adminAuditService.ts',
	]

	const apiRequiredRoutePaths = [
		'/api/otp',
		'/api/otp/validate',
		'/api/consentimientos',
		'/api/settings/consent',
		'/api/usuarios',
		'/api/usuarios/check',
		'/api/usuarios/[uid]/menores',
		'/api/menores',
		'/api/accesos',
		'/api/admin/session',
		'/api/admin/verificar-consentimiento',
		'/api/admin/users',
		'/api/admin/users/recent',
		'/api/admin/users/[id]',
		'/api/admin/users/[id]/permissions',
		'/api/admin/staff',
		'/api/admin/staff/[id]',
		'/api/admin/minors',
		'/api/admin/minors/[id]',
		'/api/admin/migrate/minors',
		'/api/admin/consents',
		'/api/admin/consents/[id]',
		'/api/admin/consents/[id]/pdf',
		'/api/admin/consents/[id]/resend',
		'/api/admin/export/users',
		'/api/admin/export/consents',
		'/api/admin/stats',
		'/api/admin/stats/detailed',
		'/api/admin/activity',
		'/api/admin/settings/consent',
		'/api/admin/roles',
		'/api/admin/set-admin',
	]

	const apiRequiredSchemaFiles = [
		{ file: 'src/lib/schemas/auth.schema.ts', schema: 'sendOtpSchema' },
		{ file: 'src/lib/schemas/auth.schema.ts', schema: 'validateOtpSchema' },
		{ file: 'src/lib/schemas/crud.schema.ts', schema: 'usuarioCreateSchema' },
		{ file: 'src/lib/schemas/crud.schema.ts', schema: 'menorCreateSchema' },
		{ file: 'src/lib/schemas/crud.schema.ts', schema: 'accesoCreateSchema' },
		{ file: 'src/lib/schemas/consent.schema.ts', schema: 'consentSubmissionSchema' },
		{ file: 'src/lib/schemas/consent.schema.ts', schema: 'minorSchema' },
		{ file: 'src/lib/schemas/consent.schema.ts', schema: 'birthDateSchema' },
		{ file: 'src/lib/schemas/legalContent.schema.ts', schema: 'localizedConsentSchema' },
		{ file: 'src/lib/schemas/visitor.schema.ts', schema: 'visitorSchema' },
		{ file: 'src/lib/schemas/shared.regex.ts', schema: 'ALPHANUMERIC_DOC_REGEX' },
		{ file: 'src/lib/schemas/shared.regex.ts', schema: 'UTF8_NAME_REGEX' },
	]

	it('keeps the API reference doc present and truthful', () => {
		const apiDoc = readFileSync(join(cleanRoot, apiDocPath), 'utf8')

		expect(apiDoc.startsWith('# API Reference\n')).toBe(true)
		expect(apiDoc).toContain('> **Status**: current')
		expect(apiDoc).toContain('> **Diátaxis**: Reference')
		expect(apiDoc).toContain('> **Audit date**:')

		for (const section of apiRequiredSections) {
			expect(apiDoc).toContain(section)
		}

		// Every claimed service file must exist on disk
		for (const serviceFile of apiRequiredServiceFiles) {
			expect(existsSync(join(cleanRoot, serviceFile))).toBe(true)
		}

		// Every claimed route must appear in the doc
		for (const routePath of apiRequiredRoutePaths) {
			expect(apiDoc).toContain(routePath)
		}

		// Every claimed schema file must exist and the schema name must appear in the doc
		for (const { file, schema } of apiRequiredSchemaFiles) {
			expect(existsSync(join(cleanRoot, file))).toBe(true)
			expect(apiDoc).toContain(schema)
		}

		// Auth model section must describe both auth layers
		expect(apiDoc).toContain('Public OTP')
		expect(apiDoc).toContain('Admin session')
		expect(apiDoc).toContain('Custom claims')
		expect(apiDoc).toContain('Rate limiting')
	})

	it('keeps API reference doc linked from hub as current reference', () => {
		const docsReadme = readFileSync(join(cleanRoot, 'docs/README.md'), 'utf8')

		expect(docsReadme).toContain('| `docs/reference/api.md` | current |')
		expect(docsReadme).toContain('API reference')
	})

	it('verifies API doc cross-references architecture and firebase docs', () => {
		const apiDoc = readFileSync(join(cleanRoot, apiDocPath), 'utf8')

		// Must link to architecture reference for broader context
		expect(apiDoc).toContain('](../reference/architecture.md)')

		// Must link to firebase reference for collection/auth details
		expect(apiDoc).toContain('](../reference/firebase.md)')
	})

	it('verifies API doc internal links resolve to existing files', () => {
		const apiDoc = readFileSync(join(cleanRoot, apiDocPath), 'utf8')

		const docLinkPattern = /\((\.\.\/|docs\/)[^)]+\.md\)/g
		for (const [link] of apiDoc.matchAll(docLinkPattern)) {
			const path = link.slice(1, -1)
			const apiDocDir = join(cleanRoot, 'docs', 'reference')
			const resolvedPath = path.startsWith('../')
				? join(apiDocDir, path)
				: join(cleanRoot, path)
			expect(existsSync(resolvedPath)).toBe(true)
		}
	})

	// --- Triangulation: verify API doc route claims match real route files ---

	const publicRouteDirs = [
		'api/otp',
		'api/otp/validate',
		'api/consentimientos',
		'api/settings/consent',
		'api/usuarios',
		'api/usuarios/check',
		'api/usuarios/[uid]/menores',
		'api/menores',
		'api/accesos',
	] as const

	const adminRouteDirs = [
		'api/admin/session',
		'api/admin/verificar-consentimiento',
		'api/admin/users',
		'api/admin/users/recent',
		'api/admin/users/[id]',
		'api/admin/users/[id]/permissions',
		'api/admin/staff',
		'api/admin/staff/[id]',
		'api/admin/minors',
		'api/admin/minors/[id]',
		'api/admin/migrate/minors',
		'api/admin/consents',
		'api/admin/consents/[id]',
		'api/admin/consents/[id]/pdf',
		'api/admin/consents/[id]/resend',
		'api/admin/export/users',
		'api/admin/export/consents',
		'api/admin/stats',
		'api/admin/stats/detailed',
		'api/admin/activity',
		'api/admin/settings/consent',
		'api/admin/roles',
		'api/admin/set-admin',
	] as const

	it('verifies every public route file exists on disk', () => {
		for (const routeDir of publicRouteDirs) {
			const routeFile = join(cleanRoot, 'src', 'app', routeDir, 'route.ts')
			expect(existsSync(routeFile)).toBe(true)
		}
	})

	it('verifies every admin route directory has a route.ts file', () => {
		for (const dir of adminRouteDirs) {
			const routeFile = join(cleanRoot, 'src', 'app', dir, 'route.ts')
			expect(existsSync(routeFile)).toBe(true)
		}
	})

	it('verifies API doc auth model references match actual source files', () => {
		const apiDoc = readFileSync(join(cleanRoot, apiDocPath), 'utf8')

		// Auth source files must exist and be mentioned
		const authFiles = [
			'src/app/api/otp/route.ts',
			'src/services/authService.ts',
			'src/app/api/admin/session/route.ts',
			'src/services/adminSessionService.ts',
			'src/lib/adminAuth.ts',
			'src/types/auth.ts',
			'src/services/rateLimitService.ts',
		]
		for (const file of authFiles) {
			expect(existsSync(join(cleanRoot, file))).toBe(true)
			expect(apiDoc).toContain(file)
		}
	})
})
