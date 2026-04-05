import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'

const { proxy } = await import('@/proxy')
const { default: robots } = await import('@/app/robots')
const { default: sitemap } = await import('@/app/sitemap')

describe('public seo boundary', () => {
	it('applies noindex header to kiosk root without leaking to public pages', async () => {
		const kioskResponse = await proxy(new NextRequest('https://example.com/'))
		const publicResponse = await proxy(
			new NextRequest('https://example.com/consentimiento-digital'),
		)

		expect(kioskResponse.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
		expect(publicResponse.headers.get('X-Robots-Tag')).toBe(null)
	})

	it('publishes robots rules only for public urls', () => {
		const manifest = robots()
		const rules = Array.isArray(manifest.rules)
			? manifest.rules[0]
			: manifest.rules

		expect(rules?.allow).toContain('/consentimiento-digital')
		expect(rules?.disallow).toContain('/admin/')
		expect(rules?.disallow).toContain('/ingreso/')
		expect(manifest.sitemap).toBe('https://www.jumpingpark.lat/sitemap.xml')
	})

	it('includes only public urls in sitemap', () => {
		const entries = sitemap()

		expect(entries.length).toBe(1)
		expect(entries[0]?.url).toBe(
			'https://www.jumpingpark.lat/consentimiento-digital',
		)
	})
})
