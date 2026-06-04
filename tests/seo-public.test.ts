import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'

const { proxy } = await import('@/proxy')
const { default: robots } = await import('@/app/robots')
const { default: sitemap } = await import('@/app/sitemap')
const { generateMetadata } = await import('@/app/(public)/layout')

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

describe('public seo boundary', () => {
	it('applies noindex header to kiosk root without leaking to public pages', async () => {
		await withEnv('PUBLIC_SEO_ENABLED', 'true', async () => {
			const kioskResponse = await proxy(new NextRequest('https://example.com/'))
			const publicResponse = await proxy(
				new NextRequest('https://example.com/consentimiento-digital'),
			)

			expect(kioskResponse.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
			expect(publicResponse.headers.get('X-Robots-Tag')).toBe(null)
		})
	})

	it('publishes robots, sitemap, and metadata when public SEO is enabled', async () => {
		await withEnv('PUBLIC_SEO_ENABLED', 'true', async () => {
			const manifest = robots()
			const rules = Array.isArray(manifest.rules)
				? manifest.rules[0]
				: manifest.rules
			const entries = sitemap()
			const metadata = generateMetadata()
			const robotsMetadata = metadata.robots as {
				index?: boolean
				follow?: boolean
			}

			expect(rules?.allow).toContain('/')
			expect(rules?.allow).toContain('/consentimiento-digital')
			expect(rules?.disallow).toContain('/admin/')
			expect(rules?.disallow).toContain('/ingreso/')
			expect(manifest.sitemap).toBe('https://www.jumpingpark.lat/sitemap.xml')
			expect(entries.length).toBe(2)
			expect(entries[0]?.url).toBe(
				'https://www.jumpingpark.lat/',
			)
			expect(entries[1]?.url).toBe(
				'https://www.jumpingpark.lat/consentimiento-digital',
			)
			expect(robotsMetadata.index).toBe(true)
			expect(robotsMetadata.follow).toBe(true)
		})
	})

	it('blocks robots, hides sitemap, and returns noindex metadata when SEO is disabled', async () => {
		await withEnv('PUBLIC_SEO_ENABLED', 'false', async () => {
			const manifest = robots()
			const rules = Array.isArray(manifest.rules)
				? manifest.rules[0]
				: manifest.rules
			const entries = sitemap()
			const metadata = generateMetadata()
			const robotsMetadata = metadata.robots as {
				index?: boolean
				follow?: boolean
			}

			expect(rules?.disallow).toContain('/')
			expect(manifest.sitemap).toBe(undefined)
			expect(entries.length).toBe(0)
			expect(robotsMetadata.index).toBe(false)
			expect(robotsMetadata.follow).toBe(false)
		})
	})
})
