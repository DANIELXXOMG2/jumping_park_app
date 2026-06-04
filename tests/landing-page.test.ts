import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Safety: resolve project root relative to this test file
// ---------------------------------------------------------------------------
const PROJECT_ROOT = path.resolve(import.meta.dir, '..')
const KIOSK_PAGE = path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'page.tsx')
const PUBLIC_PAGE = path.join(
	PROJECT_ROOT,
	'src',
	'app',
	'(public)',
	'page.tsx',
)
const KIOSK_FLOW_PAGES = [
	path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'ingreso', 'page.tsx'),
	path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'otp', 'page.tsx'),
	path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'registro', 'page.tsx'),
	path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'consentimiento', 'page.tsx'),
	path.join(PROJECT_ROOT, 'src', 'app', '(kiosk)', 'exito', 'page.tsx'),
]

// ---------------------------------------------------------------------------
// Integration helpers — call the actual production functions
// ---------------------------------------------------------------------------
const { buildPublicSitemap } = await import('@/lib/seo')
const { buildPublicPageStructuredData } = await import('@/lib/seo')
const { APP_NAME, APP_DESCRIPTION, BUSINESS_PHONE, BUSINESS_OPENING_HOURS } =
	await import('@/lib/seo')

describe('Phase 3 — Landing page route restructuring', () => {
	it('3.1 kiosk homepage must not exist', () => {
		expect(existsSync(KIOSK_PAGE)).toBe(false)
	})

	it('3.2 public landing page must exist at (public)/page.tsx', () => {
		expect(existsSync(PUBLIC_PAGE)).toBe(true)
	})

	it('3.10 kiosk flow pages remain untouched', () => {
		for (const flowPage of KIOSK_FLOW_PAGES) {
			expect(existsSync(flowPage)).toBe(true)
		}
	})

	it('3.10 landing page Server Component does not use client hooks directly', () => {
		const source = readFileSync(PUBLIC_PAGE, 'utf-8')
		expect(source).not.toContain('useAuth')
		expect(source).not.toContain('useKioskStore')
		expect(source).not.toContain('"use client"')
		// HomepageExperience is a client component wrapper — allowed
		expect(source).toContain('HomepageExperience')
	})
})

describe('Phase 3 — Sitemap integration (task 3.11)', () => {
	it('sitemap includes homepage URL with correct priority and frequency', () => {
		const entries = buildPublicSitemap()

		expect(entries.length).toBeGreaterThanOrEqual(2)
		const homepage = entries.find(
			(entry) => entry.url === 'https://www.jumpingpark.lat/',
		)
		expect(homepage).toBeDefined()

		if (!homepage) {
			throw new Error('Expected homepage entry in sitemap')
		}

		expect(homepage.priority).toBe(1.0)
		expect(homepage.changeFrequency).toBe('weekly')
	})

	it('sitemap includes both public URLs with distinct priorities', () => {
		const entries = buildPublicSitemap()

		expect(entries.length).toBeGreaterThanOrEqual(2)

		const homepage = entries.find((e) => e.url.endsWith('/') && !e.url.includes('consentimiento'))
		const consentimiento = entries.find((e) => e.url.includes('consentimiento-digital'))

		expect(homepage).toBeDefined()
		expect(consentimiento).toBeDefined()

		// Homepage should have higher priority than sub-pages
		if (homepage && consentimiento) {
			expect(homepage.priority ?? 0).toBeGreaterThan(
				consentimiento.priority ?? 0,
			)
		}
	})
})

describe('Phase 3 — JSON-LD sameAs integration (task 3.12)', () => {
	it('buildPublicPageStructuredData for / includes sameAs with social URLs', () => {
		const data = buildPublicPageStructuredData({
			pathname: '/',
			title: APP_NAME,
			description: APP_DESCRIPTION,
		})

		const graph = (data as Record<string, unknown>)['@graph']
		expect(Array.isArray(graph)).toBe(true)

		const parkNode = (graph as unknown[]).find(
			(node) =>
				typeof node === 'object' &&
				node !== null &&
				(node as Record<string, unknown>)['@type'] === 'AmusementPark',
		) as Record<string, unknown> | undefined

		expect(parkNode).toBeDefined()
		if (!parkNode) {
			throw new Error('Expected AmusementPark node')
		}

		const sameAs = parkNode.sameAs as string[]
		expect(Array.isArray(sameAs)).toBe(true)
		expect(sameAs.length).toBeGreaterThanOrEqual(2)
		expect(sameAs).toContain('https://instagram.com/jumpingparkvillavo')
		expect(sameAs).toContain('https://facebook.com/jumpingparkvillavo')
	})

	it('AmusementPark node for / includes correct phone, hours, and address', () => {
		const data = buildPublicPageStructuredData({
			pathname: '/',
			title: APP_NAME,
			description: APP_DESCRIPTION,
		})

		const graph = (data as Record<string, unknown>)['@graph']

		const parkNode = (graph as unknown[]).find(
			(node) =>
				typeof node === 'object' &&
				node !== null &&
				(node as Record<string, unknown>)['@type'] === 'AmusementPark',
		) as Record<string, unknown> | undefined

		expect(parkNode).toBeDefined()
		if (!parkNode) {
			throw new Error('Expected AmusementPark node')
		}

		expect(parkNode.telephone).toBe(BUSINESS_PHONE)
		expect(
			Array.isArray(parkNode.openingHours) ||
				Array.isArray(parkNode.openingHoursSpecification),
		).toBe(true)

		const address = parkNode.address as Record<string, unknown> | undefined
		expect(address).toBeDefined()
		if (address) {
			expect(address['@type']).toBe('PostalAddress')
			expect(address.addressCountry).toBe('CO')
			expect(address.addressLocality).toBe('Villavicencio')
		}
	})
})
