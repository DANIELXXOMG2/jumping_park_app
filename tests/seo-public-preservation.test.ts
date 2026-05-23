import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'bun:test'

const { generateMetadata } = await import('@/app/(public)/layout')
const {
	alt: consentOpenGraphAlt,
	contentType: consentOpenGraphContentType,
	default: ConsentimientoDigitalOpenGraphImage,
	size: consentOpenGraphSize,
} = await import('@/app/(public)/opengraph-image')
const {
	CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES,
	FRESHNESS_DATE,
	buildFaqPageSchema,
	buildLlmsText,
	buildPublicRobotsManifest,
	buildSiteVerification,
} = await import('@/lib/seo')
const {
	CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL,
	buildConsentimientoDigitalMetadata,
} = await import('@/lib/consentimientoDigitalSeo')

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function getStringProperty(value: unknown, key: string): string | undefined {
	if (!isRecord(value)) {
		return undefined
	}

	const property = value[key]

	return typeof property === 'string' ? property : undefined
}

function getOpenGraphImages(value: unknown): readonly unknown[] {
	if (!isRecord(value)) {
		return []
	}

	const images = value.images

	if (Array.isArray(images)) {
		return images
	}

	return images === undefined ? [] : [images]
}

function getFirstOpenGraphImageProperty(
	value: unknown,
	key: string,
): string | undefined {
	const [firstImage] = getOpenGraphImages(value)

	return getStringProperty(firstImage, key)
}

async function withEnv<T>(
	key: string,
	value: string | undefined,
	callback: () => Promise<T> | T,
): Promise<T> {
	const previousValue = process.env[key]

	if (value === undefined) {
		delete process.env[key]
	} else {
		process.env[key] = value
	}

	try {
		return await callback()
	} finally {
		if (previousValue === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = previousValue
		}
	}
}

describe('public seo preservation slice', () => {
	it('keeps metadata and OG image wiring independent from the landing redesign', () => {
		const metadata = buildConsentimientoDigitalMetadata()
		const openGraph = metadata.openGraph

		expect(metadata.robots).toBe(undefined)
		expect(metadata.alternates?.canonical).toBe('/consentimiento-digital')
		expect(getStringProperty(openGraph, 'type')).toBe('article')
		expect(getStringProperty(openGraph, 'modifiedTime')).toBe(FRESHNESS_DATE)
		expect(getFirstOpenGraphImageProperty(openGraph, 'url')).toBe(
			CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL,
		)
		expect(metadata.twitter?.images).toEqual([
			CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL,
		])
	})

	it('documents google site verification in env example and public metadata', async () => {
		const envExample = readFileSync('.env.example', 'utf8')

		expect(envExample).toContain('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=')

		await withEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', 'google-token-123', () => {
			expect(buildSiteVerification()).toEqual({
				google: 'google-token-123',
			})
			expect(generateMetadata().verification).toEqual({
				google: 'google-token-123',
			})
		})
	})

	it('publishes FAQ-aware llms guidance and AI crawler allow rules', async () => {
		const faqSchema = buildFaqPageSchema(CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES)
		const llmsText = buildLlmsText()

		expect(faqSchema['@type']).toBe('FAQPage')
		expect(faqSchema.mainEntity.length).toBe(
			CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.length,
		)
		expect(llmsText).toContain('## FAQ')

		await withEnv('PUBLIC_SEO_ENABLED', 'true', () => {
			const manifest = buildPublicRobotsManifest()
			const rules = Array.isArray(manifest.rules) ? manifest.rules : [manifest.rules]

			expect(rules.find((rule) => rule.userAgent === 'GPTBot')?.disallow).toContain(
				'/admin/',
			)
			expect(
				rules.find((rule) => rule.userAgent === 'Google-Extended')?.disallow,
			).toContain('/admin/')
		})
	})

	it('serves the dedicated consentimiento digital opengraph image route', () => {
		const metadata = buildConsentimientoDigitalMetadata()
		const response = ConsentimientoDigitalOpenGraphImage()

		expect(consentOpenGraphAlt).toContain('Jumping Park')
		expect(consentOpenGraphContentType).toBe('image/png')
		expect(consentOpenGraphSize).toEqual({
			height: 630,
			width: 1200,
		})
		expect(getFirstOpenGraphImageProperty(metadata.openGraph, 'alt')).toBe(
			consentOpenGraphAlt,
		)
		expect(response.headers.get('content-type')).toContain('image/png')
	})
})
