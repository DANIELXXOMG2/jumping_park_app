import { describe, expect, it } from 'bun:test'

const {
	APP_NAME,
	APP_URL,
	APP_DESCRIPTION,
	BUSINESS_PHONE,
	BUSINESS_OPENING_HOURS,
	BUSINESS_SOCIAL_PROFILES,
	PUBLIC_ROUTES,
	buildPublicPageStructuredData,
	createCanonicalUrl,
} = await import('@/lib/seo')

const { buildLandingMetadata } = await import('@/lib/landingSeo')

describe('SEO constants — Phase 1', () => {
	it('1.1 BUSINESS_PHONE equals corrected business number', () => {
		expect(BUSINESS_PHONE).toBe('+57 312 2594245')
	})

	it('1.2 BUSINESS_OPENING_HOURS reflects accurate schedule', () => {
		expect(BUSINESS_OPENING_HOURS).toEqual([
			'Mo-Fr 13:30-20:00',
			'Sa-Su 11:00-20:00',
		])
	})

	it('1.3 BUSINESS_SOCIAL_PROFILES exports Instagram and Facebook URLs', () => {
		expect(Array.isArray(BUSINESS_SOCIAL_PROFILES)).toBe(true)
		expect(BUSINESS_SOCIAL_PROFILES.length).toBeGreaterThanOrEqual(2)
		expect(BUSINESS_SOCIAL_PROFILES).toContain(
			'https://instagram.com/jumpingparkvillavo',
		)
		expect(BUSINESS_SOCIAL_PROFILES).toContain(
			'https://facebook.com/jumpingparkvillavo',
		)
	})

	it('1.6 PUBLIC_ROUTES includes homepage with metadata', () => {
		const homepage = PUBLIC_ROUTES.find((route) => route.pathname === '/')
		expect(homepage).toBeDefined()

		if (!homepage) {
			throw new Error('Expected homepage entry in PUBLIC_ROUTES')
		}

		expect(homepage.changeFrequency).toBe('weekly')
		expect(homepage.priority).toBe(1.0)
		expect(typeof homepage.title).toBe('string')
		expect(homepage.title.length).toBeGreaterThan(0)
		expect(typeof homepage.description).toBe('string')
		expect(homepage.description.length).toBeGreaterThan(0)
	})

	it('1.6 sitemap built from PUBLIC_ROUTES includes homepage URL', () => {
		const homepage = PUBLIC_ROUTES.find((route) => route.pathname === '/')
		expect(homepage).toBeDefined()
	})
})

describe('LocalBusiness JSON-LD sameAs — Phase 1', () => {
	it('1.5 buildPublicPageStructuredData includes sameAs with social profiles', () => {
		const data = buildPublicPageStructuredData({
			pathname: '/',
			title: APP_NAME,
			description: APP_DESCRIPTION,
		})

		const graph = (data as Record<string, unknown>)['@graph']
		expect(Array.isArray(graph)).toBe(true)

		const localBusiness = (graph as unknown[]).find(
			(node) =>
				typeof node === 'object' &&
				node !== null &&
				(node as Record<string, unknown>)['@type'] === 'LocalBusiness',
		) as Record<string, unknown> | undefined

		expect(localBusiness).toBeDefined()

		if (!localBusiness) {
			throw new Error('Expected LocalBusiness graph node')
		}

		expect(localBusiness.telephone).toBe('+57 312 2594245')
		expect(Array.isArray(localBusiness.openingHours)).toBe(true)
		expect(localBusiness.openingHours).toEqual([
			'Mo-Fr 13:30-20:00',
			'Sa-Su 11:00-20:00',
		])

		expect(Array.isArray(localBusiness.sameAs)).toBe(true)
		expect(localBusiness.sameAs).toContain(
			'https://instagram.com/jumpingparkvillavo',
		)
		expect(localBusiness.sameAs).toContain(
			'https://facebook.com/jumpingparkvillavo',
		)
	})

	it('1.5 buildPublicPageStructuredData sameAs references are absolute URLs', () => {
		const data = buildPublicPageStructuredData({
			pathname: '/',
			title: APP_NAME,
			description: APP_DESCRIPTION,
		})

		const graph = (data as Record<string, unknown>)['@graph']
		const localBusiness = (graph as unknown[]).find(
			(node) =>
				typeof node === 'object' &&
				node !== null &&
				(node as Record<string, unknown>)['@type'] === 'LocalBusiness',
		) as Record<string, unknown> | undefined

		expect(localBusiness).toBeDefined()
		if (!localBusiness) {
			throw new Error('Expected LocalBusiness')
		}

		const sameAs = localBusiness.sameAs as string[]
		expect(sameAs.length).toBeGreaterThanOrEqual(2)
		for (const url of sameAs) {
			expect(url.startsWith('https://')).toBe(true)
		}
	})
})

describe('buildLandingMetadata — Phase 2', () => {
	it('2.2 returns title with business name and location', () => {
		const metadata = buildLandingMetadata()
		expect(metadata.title).toBe(
			'Jumping Park - Parque de Trampolines en Villavicencio',
		)
	})

	it('2.3 returns a non-empty description', () => {
		const metadata = buildLandingMetadata()
		expect(typeof metadata.description).toBe('string')
		expect(metadata.description!.length).toBeGreaterThan(50)
		expect(metadata.description!.length).toBeLessThan(200)
	})

	it('2.4 sets self-referencing canonical URL to site root', () => {
		const metadata = buildLandingMetadata()
		expect(metadata.alternates).toBeDefined()
		expect(metadata.alternates!.canonical).toBe('/')
	})

	it('2.5 configures OpenGraph tags with title, description, images, and website type', () => {
		const metadata = buildLandingMetadata()

		expect(metadata.openGraph).toBeDefined()
		const og = metadata.openGraph!

		expect(og.title).toBe(
			'Jumping Park - Parque de Trampolines en Villavicencio',
		)
		expect(typeof og.description).toBe('string')
		expect((og.description as string).length).toBeGreaterThan(50)
		expect(og.url).toBe(createCanonicalUrl('/'))

		const ogWithType = og as Record<string, unknown>
		expect(ogWithType.type).toBe('website')

		expect(og.images).toBeDefined()
		const images = Array.isArray(og.images) ? og.images : [og.images]
		expect(images.length).toBeGreaterThanOrEqual(1)

		const firstImage = images[0]!
		expect(typeof firstImage).toBe('object')
		const img = firstImage as { url: string; width?: number; height?: number }
		expect(typeof img.url).toBe('string')
		expect(img.url.length).toBeGreaterThan(0)
		expect(img.width).toBe(1200)
		expect(img.height).toBe(630)
	})

	it('2.6 sets Twitter card to summary_large_image', () => {
		const metadata = buildLandingMetadata()

		expect(metadata.twitter).toBeDefined()
		const tw = metadata.twitter!

		const twRecord = tw as Record<string, unknown>
		expect(twRecord.card).toBe('summary_large_image')
		expect(typeof tw.title).toBe('string')
		expect((tw.title as string).length).toBeGreaterThan(0)
		expect(typeof tw.description).toBe('string')
		expect((tw.description as string).length).toBeGreaterThan(0)
	})
})
