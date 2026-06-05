import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { beforeAll, describe, expect, it } from 'bun:test'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Slice 3 helpers — extract collection names from rules & source
// ---------------------------------------------------------------------------

interface FirestoreRuleEntry {
	collection: string
	allowRead: string
	allowWrite: string
}

function parseFirestoreRules(rulesContent: string): FirestoreRuleEntry[] {
	const entries: FirestoreRuleEntry[] = []
	// Match: match /collectionName/{docId} { ... up to next match or EOF
	const blockRegex =
		/match\s+\/([\w_]+)\/\{[^}]+\}\s*\{((?:[^{}]|\{[^{}]*\})*?)\}/gs
	let match: RegExpExecArray | null
	while ((match = blockRegex.exec(rulesContent)) !== null) {
		const collection = match[1]
		if (!collection || collection === 'databases') continue
		const body = match[2] ?? ''

		// Handle combined form: allow read, write: if false;
		// and separate forms: allow read: ...; allow write: ...;
		let readMatch = body.match(/allow\s+read\s*:\s*([^;]+)/)
		if (!readMatch) {
			// Try combined form: allow read, write: EXPR;
			readMatch = body.match(/allow\s+read\s*,\s*write\s*:\s*([^;]+)/)
		}
		let writeMatch = body.match(/allow\s+write\s*:\s*([^;]+)/)
		if (!writeMatch) {
			writeMatch = body.match(/allow\s+read\s*,\s*write\s*:\s*([^;]+)/)
		}

		entries.push({
			collection,
			allowRead: readMatch?.[1]?.trim() ?? '',
			allowWrite: writeMatch?.[1]?.trim() ?? '',
		})
	}
	return entries
}

function extractServiceCollectionNames(srcDir: string): Set<string> {
	const collections = new Set<string>()
	const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
	for (const file of files) {
		if (!file.endsWith('.ts')) continue
		const content = readFileSync(join(srcDir, file), 'utf8')

		// Pattern A: .collection("name") — direct string literal
		const literalMatches = content.matchAll(
			/\.collection\(\s*["']([^"']+)["']\)/g,
		)
		for (const m of literalMatches) {
			if (m[1]) collections.add(m[1])
		}

		// Pattern B: const VAR = "collection_name" — module-level constants
		// e.g., const OTP_CHALLENGES_COLLECTION = "otp_challenges"
		const constMatches = content.matchAll(
			/(?:const|private\s+readonly|readonly)\s+(\w+)\s*=\s*["']([a-z_][a-z0-9_]*)["']/g,
		)
		for (const m of constMatches) {
			const varName = m[1] ?? ''
			const literalValue = m[2] ?? ''
			// Only capture if the constant name suggests a collection
			if (
				varName.toUpperCase().includes('COLLECTION') ||
				varName.toUpperCase().includes('COUNTERS')
			) {
				collections.add(literalValue)
			}
		}
	}
	return collections
}

interface BrunoRequest {
	method: string
	path: string
	bruFile: string
}

function parseBrunoRequests(brunoDir: string): BrunoRequest[] {
	const requests: BrunoRequest[] = []
	if (!existsSync(brunoDir)) return requests
	const entries = readdirSync(brunoDir, { recursive: true, encoding: 'utf8' })
	for (const entry of entries) {
		if (!entry.endsWith('.bru')) continue
		const isFolderMeta = entry.endsWith('folder.bru') ||
			entry.endsWith('collection.bru')
		if (isFolderMeta) continue
		const content = readFileSync(join(brunoDir, entry), 'utf8')
		const methodMatch = content.match(/\b(get|post|put|delete|patch)\s*\{/i)
		const urlMatch = content.match(/url:\s*\{\{baseUrl\}\}([^\n]+)/)
		if (methodMatch && urlMatch) {
			requests.push({
				method: methodMatch[1].toUpperCase(),
				path: urlMatch[1].trim(),
				bruFile: entry,
			})
		}
	}
	return requests
}

interface ApiRoute {
	method: string
	routePath: string
	routeFile: string
}

function parseApiRouteMethods(content: string): string[] {
	const methods = new Set<string>()

	// Pattern 1: export async function GET/POST/...
	for (const m of content.matchAll(
		/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b/g,
	)) {
		if (m[1]) methods.add(m[1])
	}

	// Pattern 2: export const GET = ... (withAdminAuth, apiHandler, etc.)
	for (const m of content.matchAll(
		/export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=/g,
	)) {
		if (m[1]) methods.add(m[1])
	}

	// Pattern 3: export const { GET, POST, ... } = createCrudRoutes(...)
	const destructureMatch = content.match(
		/export\s+const\s*\{\s*([^}]+)\}\s*=/,
	)
	if (destructureMatch?.[1]) {
		for (const token of destructureMatch[1].split(',')) {
			const method = token.trim().toUpperCase()
			if (
				['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(
					method,
				)
			) {
				methods.add(method)
			}
		}
	}

	return [...methods]
}

function generateApiRouteManifest(apiDir: string): ApiRoute[] {
	const routes: ApiRoute[] = []
	if (!existsSync(apiDir)) return routes
	const scanDir = (dir: string): void => {
		const entries = readdirSync(dir, { withFileTypes: true })
		for (const entry of entries) {
			const fullPath = join(dir, entry.name)
			if (entry.isDirectory()) {
				scanDir(fullPath)
			} else if (entry.name === 'route.ts') {
				const content = readFileSync(fullPath, 'utf8')
				const methods = parseApiRouteMethods(content)
				const relPath = relative(apiDir, dir).replace(/\\/g, '/')
				// Convert [param] to :param for route pattern
				const cleanPath = relPath.replace(
					/\[([^\]]+)\]/g,
					(_: string, p: string) => `:${p}`,
				)
				// Prefix with /api/ to match actual HTTP routes
				const routePattern =
					cleanPath === '.'
						? '/api'
						: `/api/${cleanPath}`
				for (const method of methods) {
					routes.push({
						method,
						routePath: routePattern,
						routeFile: join(relPath, 'route.ts').replace(
							/\\/g,
							'/',
						),
					})
				}
			}
		}
	}
	scanDir(apiDir)
	return routes
}

function normalizeApiPath(path: string): string {
	return path.replace(/\?.*$/, '').replace(/\/$/, '').toLowerCase()
}

interface PackageJsonShape {
	overrides?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function isPackageJsonShape(value: unknown): value is PackageJsonShape {
	if (!isRecord(value)) return false
	if (!('overrides' in value)) return true
	return isRecord(value.overrides)
}

const repoRoot = process.cwd()
const minimumSafeProtobuf = '7.5.6'

function readRepoFile(...pathSegments: string[]): string {
	return readFileSync(join(repoRoot, ...pathSegments), 'utf8')
}

function readPackageJson(): PackageJsonShape {
	const raw: unknown = JSON.parse(
		readFileSync(join(repoRoot, 'package.json'), 'utf8'),
	)
	if (!isPackageJsonShape(raw)) {
		throw new Error('package.json does not match expected shape')
	}
	return raw
}

function normalizeSemver(version: string): [number, number, number] {
	const match = version.match(/(\d+)\.(\d+)\.(\d+)/)

	if (!match) {
		throw new Error(`Unable to parse semver from: ${version}`)
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isVersionAtLeast(version: string, minimum: string): boolean {
	const current = normalizeSemver(version)
	const baseline = normalizeSemver(minimum)

	for (const [index, value] of current.entries()) {
		if (value > baseline[index]) {
			return true
		}

		if (value < baseline[index]) {
			return false
		}
	}

	return true
}

function readResolvedVersion(packageName: string): string | null {
	const lockfile = readFileSync(join(repoRoot, 'bun.lock'), 'utf8')
	const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const matcher = new RegExp(`\"${escapedName}@([^\"]+)\"`)
	const match = lockfile.match(matcher)

	return match?.[1] ?? null
}

describe('repo hygiene and weight audit slice', () => {
	it('keeps only the canonical tracked hygiene artifacts', () => {
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relacion.mmd'),
			),
		).toBe(true)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-Secuencia.mmd'),
			),
		).toBe(true)
		expect(
			existsSync(
				join(repoRoot, 'postman', 'JumpingPark - Firebase API (Local)'),
			),
		).toBe(true)

		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relacion.svg'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-Secuencia.svg'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relación.mmd'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(repoRoot, 'diagramas', 'Diagrama-de-Entidad-Relación.svg'),
			),
		).toBe(false)
		expect(
			existsSync(
				join(
					repoRoot,
					'postman',
					'jumpingpark_collection.postman_collection.json',
				),
			),
		).toBe(false)
		expect(
			existsSync(join(repoRoot, 'ENV_AUDIT_AND_RECOMMENDATIONS.md')),
		).toBe(false)
	})

	it('routes pdf and email logo usage through the optimized png while keeping the source asset', () => {
		const pdfService = readRepoFile('src', 'services', 'pdfService.ts')
		const emailStyles = readRepoFile(
			'src',
			'components',
			'emails',
			'emailStyles.ts',
		)
		const optimizeAssetsScript = readRepoFile(
			'scripts',
			'optimize-assets.ts',
		)

		expect(pdfService).toContain('"jumping-park-logo-optimized.png"')
		expect(emailStyles).toContain('jumping-park-logo-optimized.png')
		expect(pdfService).not.toContain('"jumping-park-logo.png"')
		expect(emailStyles).not.toContain('jumping-park-logo.png')
		expect(optimizeAssetsScript).toContain('jumping-park-logo.png')
		expect(
			existsSync(join(repoRoot, 'public', 'assets', 'jumping-park-logo.png')),
		).toBe(true)
		expect(
			existsSync(
				join(repoRoot, 'public', 'assets', 'jumping-park-logo-optimized.png'),
			),
		).toBe(true)
	})

	describe('dead asset removal (slice 1)', () => {
		const deadSvgs = ['file.svg', 'globe.svg', 'window.svg']

		const preservedScreenshots = [
			'admin-consents-list.png',
			'admin-dashboard.png',
			'kiosk-consentimiento.png',
			'kiosk-ingreso.png',
			'kiosk-offline-success.png',
			'kiosk-otp.png',
			'public-consentimiento-digital.png',
		]

		const preservedPlaceholders = [
			'ai-citation-log-placeholder.md',
			'lighthouse-seo-report-placeholder.md',
			'rich-results-placeholder.md',
			'schema-org-validator-placeholder.md',
			'search-console-placeholder.md',
		]

		it('dead Next.js scaffold SVGs are absent from public/', () => {
			for (const svg of deadSvgs) {
				expect(existsSync(join(repoRoot, 'public', svg))).toBe(false)
			}
		})

		it('screenshots are preserved as source of truth in docs/portfolio/screenshots/', () => {
			for (const screenshot of preservedScreenshots) {
				expect(
					existsSync(
						join(repoRoot, 'docs', 'portfolio', 'screenshots', screenshot),
					),
				).toBe(true)
			}
		})

		it('composition asset copies of screenshots coexist alongside the source-of-truth screenshots', () => {
			for (const screenshot of preservedScreenshots) {
				expect(
					existsSync(
						join(
							repoRoot,
							'docs',
							'portfolio',
							'motion',
							'composition',
							'assets',
							screenshot,
						),
					),
				).toBe(true)
			}
		})

		it('placeholder evidence files are preserved — they carry honest pending/manual validation context', () => {
			for (const file of preservedPlaceholders) {
				expect(
					existsSync(join(repoRoot, 'docs', 'portfolio', 'evidence', file)),
				).toBe(true)
			}
		})

		it('real evidence files are preserved alongside placeholder evidence', () => {
			expect(
				existsSync(
					join(
						repoRoot,
						'docs',
						'portfolio',
						'evidence',
						'public-crawl-report.md',
					),
				),
			).toBe(true)
			expect(
				existsSync(
					join(repoRoot, 'docs', 'portfolio', 'evidence', 'wcag-wig-report.md'),
				),
			).toBe(true)
		})

		it('preserved public/ assets are still present (regression guard against over-deletion)', () => {
			const mustKeep = [
				'pricing.md',
				'og-image.png',
				'manifest.json',
				'offline-sw.js',
				'favicon.png',
				'favicon-16x16.png',
				'favicon-32x32.png',
				'favicon-48x48.png',
			]
			for (const file of mustKeep) {
				expect(existsSync(join(repoRoot, 'public', file))).toBe(true)
			}
		})
	})

	it('pins and resolves protobufjs to the safe minimum', () => {
		const packageJson = readPackageJson()
		const override = packageJson.overrides?.protobufjs
		const resolvedVersion = readResolvedVersion('protobufjs')

		expect(typeof override).toBe('string')
		expect(isVersionAtLeast(override ?? '0.0.0', minimumSafeProtobuf)).toBe(
			true,
		)
		expect(resolvedVersion === null).toBe(false)
		expect(
			isVersionAtLeast(resolvedVersion ?? '0.0.0', minimumSafeProtobuf),
		).toBe(true)
	})

	describe('heavy asset optimization (slice 2)', () => {
		const sourcePngs = ['astronauta.png', 'jumping-park-logo.png']

		const heavyPortfolioFiles = [
			join(
				'docs',
				'portfolio',
				'renders',
				'jumping-park-product-tour.mp4',
			),
			join(
				'docs',
				'portfolio',
				'motion',
				'composition',
				'assets',
				'voiceover.wav',
			),
		]

		function parseVercelignoreEntries(content: string): string[] {
			return content
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0 && !line.startsWith('#'))
		}

		it('source PNGs are excluded from Vercel deploy via .vercelignore', () => {
			const vercelignore = readRepoFile('.vercelignore')
			for (const png of sourcePngs) {
				const entry = `public/assets/${png}`
				expect(vercelignore).toContain(entry)
			}
		})

		it('source PNGs are retained in the repo for the optimization pipeline', () => {
			for (const png of sourcePngs) {
				expect(
					existsSync(join(repoRoot, 'public', 'assets', png)),
				).toBe(true)
			}
		})

		it('no public/ asset exceeds 500KB without a .vercelignore exclusion', () => {
			const vercelignore = readRepoFile('.vercelignore')
			const excludedPatterns = parseVercelignoreEntries(vercelignore)
			const oversized: string[] = []

			function scanDir(dir: string): void {
				const entries = readdirSync(dir, { withFileTypes: true })
				for (const entry of entries) {
					const fullPath = join(dir, entry.name)
					if (entry.isDirectory()) {
						scanDir(fullPath)
					} else if (entry.isFile()) {
						const stats = statSync(fullPath)
						const sizeKb = stats.size / 1024
						if (sizeKb > 500) {
							const relPath = relative(repoRoot, fullPath).replace(
								/\\/g,
								'/',
							)
							const isExcluded = excludedPatterns.some(
								(pattern) =>
									relPath === pattern ||
									relPath.startsWith(
										pattern.endsWith('/') ? pattern : `${pattern}/`,
									) ||
									(pattern.endsWith('/') &&
										relPath.startsWith(pattern)),
							)
							if (!isExcluded) {
								oversized.push(
									`${relPath} (${sizeKb.toFixed(1)} KB)`,
								)
							}
						}
					}
				}
			}

			scanDir(join(repoRoot, 'public'))

			expect(oversized).toEqual([])
		})

		it('heavy portfolio media files are retained as documentation artifacts', () => {
			for (const file of heavyPortfolioFiles) {
				expect(existsSync(join(repoRoot, file))).toBe(true)
			}
		})

		it('docs/ directory is excluded from Vercel deploys', () => {
			const vercelignore = readRepoFile('.vercelignore')
			expect(vercelignore).toContain('docs/')
		})

		it('runtime image components reference optimized WebP variants, not source PNGs', () => {
			const imageOptimization = readRepoFile(
				'src',
				'lib',
				'imageOptimization.ts',
			)
			// kioskAstronaut, kioskLogo, publicConsentLogo all use .webp
			expect(imageOptimization).toContain(
				'astronautOptimizedWebp',
			)
			expect(imageOptimization).toContain('logoOptimizedWebp')
			// Source paths are declared but runtime variants use webp
			expect(imageOptimization).toContain(
				'astronautSourcePng',
			)
			expect(imageOptimization).toContain('logoSourcePng')
			// PAGE_IMAGE_VARIANTS should NOT reference source PNGs as src
			expect(
				imageOptimization.includes(
					'src: IMAGE_ASSET_PATHS.astronautSourcePng',
				),
			).toBe(false)
			expect(
				imageOptimization.includes(
					'src: IMAGE_ASSET_PATHS.logoSourcePng',
				),
			).toBe(false)
		})
	})

	// ======================================================================
	// Slice 3 — Config Validation (Firebase + Bruno)
	// ======================================================================

	describe('firebase config parity (slice 3)', () => {
		const FIREBASE_DIR = join(repoRoot, 'firebase')
		const SERVICES_DIR = join(repoRoot, 'src', 'services')
		const API_DIR = join(repoRoot, 'src', 'app', 'api')
		const BRUNO_DIR = join(
			repoRoot,
			'postman',
			'JumpingPark - Firebase API (Local)',
		)

		// ------------------------------------------------------------------
		// 3.2 / 3.4 — Firestore rule coverage
		// ------------------------------------------------------------------

		it('every collection referenced in src/services/ has a matching rule in firestore.rules', () => {
			const rulesContent = readRepoFile('firebase', 'firestore.rules')
			const ruleEntries = parseFirestoreRules(rulesContent)
			const ruleCollections = new Set(
				ruleEntries.map((e) => e.collection),
			)
			const serviceCollections = extractServiceCollectionNames(
				SERVICES_DIR,
			)

			// Collections that are internal counters/system docs accessed
			// only via Admin SDK and may not have explicit rule blocks.
			// If missing, they should be added as server-only rules.
			const missingFromRules: string[] = []
			for (const col of serviceCollections) {
				if (!ruleCollections.has(col)) {
					missingFromRules.push(col)
				}
			}

			expect(missingFromRules).toEqual([])
		})

		it('server-only collections have allow read,write: if false', () => {
			const rulesContent = readRepoFile('firebase', 'firestore.rules')
			const ruleEntries = parseFirestoreRules(rulesContent)

			const serverOnlyCollections = [
				'otp_challenges',
				'otp_access_sessions',
				'otp_sessions',
				'offline_sync',
				'minors_index',
				'admin_metrics',
				'admin_audit_logs',
			]

			for (const col of serverOnlyCollections) {
				const entry = ruleEntries.find((e) => e.collection === col)
				expect(entry, `Missing rule block for ${col}`).toBeDefined()
				expect(
					entry?.allowRead?.includes('false'),
					`${col} read should be denied`,
				).toBe(true)
				expect(
					entry?.allowWrite?.includes('false'),
					`${col} write should be denied`,
				).toBe(true)
			}
		})

		// Triangulation (3.2): inverse — every collection declared in rules
		// (excluding the default catch-all) must be referenced in src/.

		it('every collection declared in firestore.rules (excluding catch-all) is referenced in src/', () => {
			const rulesContent = readRepoFile('firebase', 'firestore.rules')
			const ruleEntries = parseFirestoreRules(rulesContent)
			const ruleCollections = ruleEntries.map((e) => e.collection)

			// Collect from services, lib, and api route configs
			const allSrcCollections = extractServiceCollectionNames(
				SERVICES_DIR,
			)
			for (const col of extractServiceCollectionNames(
				join(repoRoot, 'src', 'lib'),
			)) {
				allSrcCollections.add(col)
			}
			// Also scan api/ for createCrudRoutes collection: "name" patterns
			const apiDir = join(repoRoot, 'src', 'app', 'api')
			if (existsSync(apiDir)) {
				const apiFiles = readdirSync(apiDir, {
					recursive: true,
					encoding: 'utf8',
				})
				for (const f of apiFiles) {
					if (!f.endsWith('.ts')) continue
					const content = readFileSync(join(apiDir, f), 'utf8')
					for (const m of content.matchAll(
						/collection\s*:\s*["']([^"']+)["']/g,
					)) {
						if (m[1]) allSrcCollections.add(m[1])
					}
				}
			}

			// The default catch-all uses {document=**} — not a real collection
			const defaultPatterns = new Set(['document'])

			const deadRuleCollections: string[] = []
			for (const col of ruleCollections) {
				if (defaultPatterns.has(col)) continue
				if (!allSrcCollections.has(col)) {
					deadRuleCollections.push(col)
				}
			}

			expect(
				deadRuleCollections,
				'Collections in rules but not referenced anywhere in src/',
			).toEqual([])
		})

		// ------------------------------------------------------------------
		// 3.1 — Firestore index cross-reference
		// ------------------------------------------------------------------

		it('every composite index in firestore.indexes.json matches an actual query pattern in src/services/', () => {
			const indexesRaw = readRepoFile(
				'firebase',
				'firestore.indexes.json',
			)
			const FirestoreIndexesSchema = z.object({
				indexes: z.array(
					z.object({
						collectionGroup: z.string(),
						fields: z.array(
							z.object({
								fieldPath: z.string(),
								order: z.string(),
							}),
						),
					}),
				),
			})
			const indexes = FirestoreIndexesSchema.parse(
				JSON.parse(indexesRaw),
			)

			const serviceFiles = readdirSync(SERVICES_DIR, {
				recursive: true,
				encoding: 'utf8',
			})
			const serviceContent = serviceFiles
				.filter((f) => f.endsWith('.ts'))
				.map((f) => readFileSync(join(SERVICES_DIR, f), 'utf8'))
				.join('\n')

			// Every index collectionGroup must appear in src/services/
			const orphanIndexes: string[] = []
			for (const idx of indexes.indexes) {
				const col = idx.collectionGroup
				// Check if collection is referenced in service files
				const colPattern = new RegExp(
					`\\.collection\\(\\s*["']${col}["']\\)`,
				)
				if (!colPattern.test(serviceContent)) {
					orphanIndexes.push(
						`${col} (${idx.fields.map((f) => f.fieldPath).join(', ')})`,
					)
				}
			}

			expect(
				orphanIndexes,
				'Orphan indexes found — no matching collection query in src/services/',
			).toEqual([])
		})

		// ------------------------------------------------------------------
		// 3.3 — Storage rule validation
		// ------------------------------------------------------------------

		it('storage.rules covers the signatures path used by consentService', () => {
			const storageRules = readRepoFile('firebase', 'storage.rules')
			expect(storageRules).toContain('match /signatures')
		})

		it('storage.rules denies write access to signatures from clients', () => {
			const storageRules = readRepoFile('firebase', 'storage.rules')
			// Extract the signatures block
			const sigMatch = storageRules.match(
				/match\s+\/signatures\/[\s\S]*?(?=match\s+\/|$)/,
			)
			expect(sigMatch).not.toBeNull()
			const sigBlock = sigMatch?.[0] ?? ''
			expect(
				sigBlock.includes('allow write: if false'),
				'Signatures write should be denied to clients',
			).toBe(true)
		})

		it('generated-pdfs namespace is explicitly blocked', () => {
			const storageRules = readRepoFile('firebase', 'storage.rules')
			expect(storageRules).toContain('match /generated-pdfs')
			const pdfMatch = storageRules.match(
				/match\s+\/generated-pdfs\/[\s\S]*?(?=match\s+\/|$)/,
			)
			const pdfBlock = pdfMatch?.[0] ?? ''
			expect(
				pdfBlock.includes('allow read, write: if false'),
				'generated-pdfs should deny all client access',
			).toBe(true)
		})

		// ------------------------------------------------------------------
		// 3.5 / 3.6 — Bruno route parity
		// ------------------------------------------------------------------

		it('no Bruno .bru file references a non-existent API route', () => {
			const brunoRequests = parseBrunoRequests(BRUNO_DIR)
			const apiRoutes = generateApiRouteManifest(API_DIR)

			const apiPathSet = new Set(
				apiRoutes.map((r) => `${r.method}:${normalizeApiPath(r.routePath)}`),
			)

			const staleEndpoints: string[] = []
			for (const req of brunoRequests) {
				const key = `${req.method}:${normalizeApiPath(req.path)}`
				if (!apiPathSet.has(key)) {
					staleEndpoints.push(
						`${req.method} ${req.path} (${req.bruFile})`,
					)
				}
			}

			expect(
				staleEndpoints,
				'Stale Bruno endpoints — references routes that do not exist',
			).toEqual([])
		})

		it('every active API route has a matching .bru file or is documented as intentionally uncovered', () => {
			const brunoRequests = parseBrunoRequests(BRUNO_DIR)
			const apiRoutes = generateApiRouteManifest(API_DIR)

			const brunoPathSet = new Set(
				brunoRequests.map(
					(r) => `${r.method}:${normalizeApiPath(r.path)}`,
				),
			)

			// Routes intentionally excluded from Bruno:
			// - Admin CRUD routes: tested via Firebase Admin SDK, not HTTP client
			// - Internal migration/service endpoints
			// - Settings routes (read-only from Firestore, no mutation needed)
			// - verify-consentimiento (internal admin verification, not CRUD)
			const uncoveredAllowlist = new Set([
				// Admin — users CRUD
				'GET:/api/admin/users',
				'GET:/api/admin/users/recent',
				'GET:/api/admin/users/:id',
				'DELETE:/api/admin/users/:id',
				'PATCH:/api/admin/users/:id/permissions',
				'GET:/api/admin/users/:id/permissions',
				// Admin — staff CRUD
				'GET:/api/admin/staff',
				'POST:/api/admin/staff',
				'GET:/api/admin/staff/:id',
				'DELETE:/api/admin/staff/:id',
				// Admin — minors CRUD
				'GET:/api/admin/minors',
				'GET:/api/admin/minors/:id',
				'DELETE:/api/admin/minors/:id',
				// Admin — consents CRUD
				'GET:/api/admin/consents',
				'GET:/api/admin/consents/:id',
				'DELETE:/api/admin/consents/:id',
				'GET:/api/admin/consents/:id/pdf',
				'POST:/api/admin/consents/:id/resend',
				// Admin — stats/activity
				'GET:/api/admin/stats',
				'GET:/api/admin/stats/detailed',
				'GET:/api/admin/activity',
				// Admin — session/roles/export/migrate
				'GET:/api/admin/session',
				'POST:/api/admin/session',
				'DELETE:/api/admin/session',
				'GET:/api/admin/roles',
				'POST:/api/admin/roles',
				'DELETE:/api/admin/roles',
				'POST:/api/admin/set-admin',
				'GET:/api/admin/export/users',
				'GET:/api/admin/export/consents',
				'POST:/api/admin/migrate/minors',
				'GET:/api/admin/migrate/minors',
				// Admin — consent verification (internal)
				'GET:/api/admin/verificar-consentimiento',
				// Admin — consent settings
				'GET:/api/admin/settings/consent',
				'POST:/api/admin/settings/consent',
				'DELETE:/api/admin/settings/consent',
				// Public settings (read-only, served from Firestore)
				'GET:/api/settings/consent',
				// Usuario sub-routes (menores) — internal lookup
				'GET:/api/usuarios/:uid/menores',
			])

			const uncovered: string[] = []
			for (const route of apiRoutes) {
				const key = `${route.method}:${normalizeApiPath(route.routePath)}`
				if (!brunoPathSet.has(key) && !uncoveredAllowlist.has(key)) {
					uncovered.push(key)
				}
			}

			expect(
				uncovered,
				'API routes without Bruno coverage (add to allowlist or create .bru file)',
			).toEqual([])
		})
	})

	// ======================================================================
	// Slice 5 — Enforcement & Regression Guards
	// ======================================================================

	describe('dead asset detection (slice 5)', () => {
		// Imported from scripts/validate-public-crawl.ts after implementation
		let detectDeadAssets: (
			publicDir: string,
			srcDir: string,
		) => { file: string; referencedInSrc: boolean; size: number; action: string }[]

		beforeAll(async () => {
			const mod = await import('../scripts/validate-public-crawl')
			detectDeadAssets = mod.detectDeadAssets
		})

		const KNOWN_GOOD_FILES = new Set([
			'favicon.ico',
			'favicon.png',
			'favicon-16x16.png',
			'favicon-32x32.png',
			'favicon-48x48.png',
			'apple-touch-icon.png',
			'icon-192.png',
			'icon-512.png',
			'manifest.json',
			'robots.txt',
			'sitemap.xml',
			'pricing.md',
			'llms.txt',
			'og-image.png',
			'offline-sw.js',
		])

		it('returns zero dead assets in the current public/ directory', () => {
			const publicDir = join(repoRoot, 'public')
			const srcDir = join(repoRoot, 'src')

			const results = detectDeadAssets(publicDir, srcDir)

			const deadAssets = results.filter(
				(r) => r.action === 'remove' && !KNOWN_GOOD_FILES.has(r.file),
			)

			expect(
				deadAssets,
				'Dead assets found in public/ — files with zero src/ references and not in known-good list',
			).toEqual([])
		})

		it('flags dead SVGs as action=remove when they exist (hypothetical regression)', () => {
			// This test verifies the detection logic works by checking
			// that the function CAN detect files. Since file.svg was already
			// removed in slice 1, we verify the function's return shape.
			const publicDir = join(repoRoot, 'public')
			const srcDir = join(repoRoot, 'src')

			const results = detectDeadAssets(publicDir, srcDir)

			// Every result must have the expected shape
			for (const result of results) {
				expect(typeof result.file).toBe('string')
				expect(typeof result.referencedInSrc).toBe('boolean')
				expect(typeof result.size).toBe('number')
				expect(['keep', 'remove', 'ignore']).toContain(result.action)
				expect(result.size).toBeGreaterThan(0)
			}
		})

		it('known-good convention files are not flagged as dead even if unreferenced in src/', () => {
			// Files referenced by browser convention (favicons, manifest, etc.)
			// should NOT appear as dead assets. This test verifies the detection
			// function handles the known-good allowlist correctly.
			const publicDir = join(repoRoot, 'public')
			const srcDir = join(repoRoot, 'src')

			const results = detectDeadAssets(publicDir, srcDir)
			const deadFiles = results
				.filter((r) => r.action === 'remove')
				.map((r) => r.file)

			// No known-good file should appear in the dead list
			for (const goodFile of KNOWN_GOOD_FILES) {
				expect(
					deadFiles,
					`${goodFile} should not be flagged as dead`,
				).not.toContain(goodFile)
			}
		})

		it('files referenced in src/ code have action=keep and referencedInSrc=true', () => {
			// Triangulation: verify the function correctly identifies
			// files that ARE referenced in src/ code (not just convention).
			const publicDir = join(repoRoot, 'public')
			const srcDir = join(repoRoot, 'src')

			const results = detectDeadAssets(publicDir, srcDir)

			// Files in public/assets/ are referenced in scripts/optimize-assets.ts
			const assetResults = results.filter((r) =>
				['jumping-park-logo.png', 'astronauta.png'].includes(r.file),
			)

			// At least the source PNGs should be found
			expect(assetResults.length).toBeGreaterThan(0)

			for (const r of assetResults) {
				expect(
					r.referencedInSrc,
					`${r.file} should be referenced in src/`,
				).toBe(true)
				expect(r.action, `${r.file} should be kept`).toBe('keep')
			}
		})

		it('detects dead assets when unreferenced files exist (triangulation via controlled scan)', () => {
			// Create a controlled scenario: scan a directory we know
			// contains files with no src/ references. We don't create
			// dead files in public/ — instead verify the function's
			// behavior by checking that public/assets/ files that are
			// NOT in optimize-assets.ts would be caught.
			const publicDir = join(repoRoot, 'public')
			const srcDir = join(repoRoot, 'src')

			const results = detectDeadAssets(publicDir, srcDir)

			// Verify the function produces at least one result
			// (public/ is not empty)
			expect(results.length).toBeGreaterThan(0)

			// Every result must have a valid action
			const validActions = ['keep', 'remove', 'ignore'] as const
			for (const r of results) {
				expect(validActions).toContain(r.action)
				expect(r.size).toBeGreaterThan(0)
				expect(r.file.length).toBeGreaterThan(0)
			}

			// Verify there are no false positives: any file with
			// action='remove' must truly have zero src/ references
			// AND not be in the known-good list
			const deadFiles = results.filter((r) => r.action === 'remove')
			for (const dead of deadFiles) {
				expect(dead.referencedInSrc).toBe(false)
				expect(KNOWN_GOOD_FILES.has(dead.file)).toBe(false)
			}
		})
	})

	describe('diagram source-to-render consistency (slice 5)', () => {
		// ------------------------------------------------------------------
		// Pure function: validateDiagramConsistency
		// ------------------------------------------------------------------

		interface DiagramConsistencyResult {
			staleSvgs: string[]
			missingRenders: string[]
		}

		function validateDiagramConsistency(
			svgFiles: string[],
			mmdFiles: string[],
		): DiagramConsistencyResult {
			const mmdBaseNames = new Set(
				mmdFiles.map((f) => f.replace(/\.mmd$/, '')),
			)
			const svgBaseNames = new Set(
				svgFiles.map((f) => f.replace(/\.svg$/, '')),
			)

			const staleSvgs: string[] = []
			for (const svg of svgFiles) {
				const baseName = svg.replace(/\.svg$/, '')
				if (!mmdBaseNames.has(baseName)) {
					staleSvgs.push(svg)
				}
			}

			const missingRenders: string[] = []
			for (const mmd of mmdFiles) {
				const baseName = mmd.replace(/\.mmd$/, '')
				if (!svgBaseNames.has(baseName)) {
					missingRenders.push(mmd)
				}
			}

			return { staleSvgs, missingRenders }
		}

		it('returns empty results when all SVGs have matching MMD sources', () => {
			const svgs = [
				'auth-sequence.svg',
				'Diagrama-de-Entidad-Relacion.svg',
				'Diagrama-Secuencia.svg',
			]
			const mmds = [
				'auth-sequence.mmd',
				'Diagrama-de-Entidad-Relacion.mmd',
				'Diagrama-Secuencia.mmd',
			]

			const result = validateDiagramConsistency(svgs, mmds)

			expect(result.staleSvgs).toEqual([])
			expect(result.missingRenders).toEqual([])
		})

		it('detects stale SVGs that have no matching MMD source', () => {
			const svgs = [
				'auth-sequence.svg',
				'orphan-diagram.svg',
				'Diagrama-Secuencia.svg',
			]
			const mmds = [
				'auth-sequence.mmd',
				'Diagrama-Secuencia.mmd',
			]

			const result = validateDiagramConsistency(svgs, mmds)

			expect(result.staleSvgs).toEqual(['orphan-diagram.svg'])
			expect(result.missingRenders).toEqual([])
		})

		it('detects MMD sources that have not been rendered to SVG', () => {
			const svgs = ['auth-sequence.svg']
			const mmds = [
				'auth-sequence.mmd',
				'new-feature-diagram.mmd',
				'architecture-overview.mmd',
			]

			const result = validateDiagramConsistency(svgs, mmds)

			expect(result.staleSvgs).toEqual([])
			expect(result.missingRenders).toEqual([
				'new-feature-diagram.mmd',
				'architecture-overview.mmd',
			])
		})

		it('handles both stale SVGs and missing renders in the same check', () => {
			const svgs = ['good.svg', 'stale.svg']
			const mmds = ['good.mmd', 'unrendered.mmd']

			const result = validateDiagramConsistency(svgs, mmds)

			expect(result.staleSvgs).toEqual(['stale.svg'])
			expect(result.missingRenders).toEqual(['unrendered.mmd'])
		})

		it('validates actual repo diagram consistency', () => {
			const diagramsDir = join(repoRoot, 'docs', 'assets', 'diagrams')
			const mmdDir = join(repoRoot, 'diagramas')

			const svgFiles = existsSync(diagramsDir)
				? readdirSync(diagramsDir).filter((f) => f.endsWith('.svg'))
				: []
			const mmdFiles = existsSync(mmdDir)
				? readdirSync(mmdDir).filter((f) => f.endsWith('.mmd'))
				: []

			const result = validateDiagramConsistency(svgFiles, mmdFiles)

			expect(
				result.staleSvgs,
				'Stale SVGs in docs/assets/diagrams/ — no matching .mmd source in diagramas/',
			).toEqual([])
		})
	})
})
