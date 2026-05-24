import { describe, expect, it } from 'bun:test'
const {
	APP_NAME,
	CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
	CONSENTIMIENTO_DIGITAL_PAGE_PATH,
	CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
	buildPublicPageStructuredData,
	createCanonicalUrl,
} = await import('@/lib/seo')

interface LocalBusinessAddress {
	'@type': 'PostalAddress'
	addressCountry: string
	addressLocality: string
	addressRegion: string
	streetAddress: string
}

interface WebSiteNode {
	'@type': 'WebSite'
	url: string
}

interface LocalBusinessNode {
	'@type': 'LocalBusiness'
	address: LocalBusinessAddress
	name: string
	openingHours: string[]
	telephone: string
	url: string
	geo?: unknown
}

interface BreadcrumbListItem {
	'@type': 'ListItem'
	item: string
	name: string
	position: number
}

interface BreadcrumbListNode {
	'@type': 'BreadcrumbList'
	itemListElement: BreadcrumbListItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function getGraph(value: unknown): unknown[] {
	if (!isRecord(value) || !Array.isArray(value['@graph'])) {
		throw new Error('Expected structured data graph')
	}

	return value['@graph']
}

function isLocalBusinessAddress(value: unknown): value is LocalBusinessAddress {
	return (
		isRecord(value) &&
		value['@type'] === 'PostalAddress' &&
		typeof value.streetAddress === 'string' &&
		typeof value.addressLocality === 'string' &&
		typeof value.addressRegion === 'string' &&
		typeof value.addressCountry === 'string'
	)
}

function isWebSiteNode(value: unknown): value is WebSiteNode {
	return isRecord(value) && value['@type'] === 'WebSite' && typeof value.url === 'string'
}

function isLocalBusinessNode(value: unknown): value is LocalBusinessNode {
	return (
		isRecord(value) &&
		value['@type'] === 'LocalBusiness' &&
		typeof value.name === 'string' &&
		typeof value.url === 'string' &&
		typeof value.telephone === 'string' &&
		Array.isArray(value.openingHours) &&
		value.openingHours.every((entry) => typeof entry === 'string') &&
		isLocalBusinessAddress(value.address)
	)
}

function isBreadcrumbListItem(value: unknown): value is BreadcrumbListItem {
	return (
		isRecord(value) &&
		value['@type'] === 'ListItem' &&
		typeof value.position === 'number' &&
		typeof value.name === 'string' &&
		typeof value.item === 'string'
	)
}

function isBreadcrumbListNode(value: unknown): value is BreadcrumbListNode {
	return (
		isRecord(value) &&
		value['@type'] === 'BreadcrumbList' &&
		Array.isArray(value.itemListElement) &&
		value.itemListElement.every(isBreadcrumbListItem)
	)
}

function findGraphNode<T>(
	graph: readonly unknown[],
	matcher: (value: unknown) => value is T,
): T | undefined {
	return graph.find(matcher)
}

describe('public structured data', () => {
	it('adds LocalBusiness with verified business details and no invented geo node', () => {
		const data = buildPublicPageStructuredData({
			pathname: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
			title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
			description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
		})

		const localBusiness = findGraphNode(getGraph(data), isLocalBusinessNode)
		const webSite = findGraphNode(getGraph(data), isWebSiteNode)

		expect(localBusiness).toBeDefined()
		expect(webSite).toBeDefined()

		if (!localBusiness) {
			throw new Error('Expected LocalBusiness graph node')
		}

		if (!webSite) {
			throw new Error('Expected WebSite graph node')
		}

		expect(localBusiness.name).toBe(APP_NAME)
		expect(localBusiness.url).toBe(createCanonicalUrl('/'))
		expect(webSite.url).toBe(createCanonicalUrl('/'))
		expect(localBusiness.telephone).toBe('(608) 677 9985')
		expect(localBusiness.address['@type']).toBe('PostalAddress')
		expect(localBusiness.address.streetAddress).toBe(
			'Centro Comercial Primavera Urbana, Calle 15 # 40-01, Locales 313-314-315-316-317',
		)
		expect(localBusiness.address.addressLocality).toBe('Villavicencio')
		expect(localBusiness.address.addressRegion).toBe('Meta')
		expect(localBusiness.address.addressCountry).toBe('CO')
		expect(localBusiness.openingHours).toEqual([
			'Mo-Fr 14:00-20:00',
			'Sa-Su 11:00-20:00',
		])
		expect(localBusiness.geo).toBe(undefined)
	})

	it('adds BreadcrumbList for interior public pages and skips it at the root path', () => {
		const interiorData = buildPublicPageStructuredData({
			pathname: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
			title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
			description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
		})
		const rootData = buildPublicPageStructuredData({
			pathname: '/',
			title: APP_NAME,
			description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
		})

		const interiorBreadcrumbs = findGraphNode(getGraph(interiorData), isBreadcrumbListNode)
		const rootBreadcrumbs = findGraphNode(getGraph(rootData), isBreadcrumbListNode)

		expect(interiorBreadcrumbs).toBeDefined()
		expect(rootBreadcrumbs).toBe(undefined)

		if (!interiorBreadcrumbs) {
			throw new Error('Expected BreadcrumbList graph node')
		}

		expect(interiorBreadcrumbs.itemListElement).toEqual([
			{
				'@type': 'ListItem',
				position: 1,
				name: APP_NAME,
				item: createCanonicalUrl('/'),
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
				item: createCanonicalUrl(CONSENTIMIENTO_DIGITAL_PAGE_PATH),
			},
		])
	})

})
