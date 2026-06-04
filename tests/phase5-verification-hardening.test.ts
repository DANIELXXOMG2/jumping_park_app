import { describe, expect, it } from 'bun:test'
import {
	applyCreatedAtCursor,
	buildCursorPageInfo,
	resolveAdminCursorRequest,
} from '@/lib/adminCursor'
import { decodeFirestoreCursor } from '@/lib/firestoreService'
import {
	APP_URL,
	buildLlmsText,
	buildPublicPageStructuredData,
	createCanonicalUrl,
} from '@/lib/seo'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function findGraphNodeByType<T extends string>(
	graph: readonly unknown[],
	type: T,
): Record<string, unknown> | undefined {
	const foundNode = graph.find(
		(node) => isRecord(node) && node['@type'] === type,
	)

	return isRecord(foundNode) ? foundNode : undefined
}
import {
	ADMIN_METRIC_KIND,
	ADMIN_METRIC_FRESHNESS_SOURCE,
	type AdminMetricDaily,
	type AdminMetricOverview,
} from '@/types/firestore'

const { GET: getLlmsText } = await import('@/app/llms.txt/route')
const { buildDetailedAggregateStats, ADMIN_METRIC_PERIOD } = await import(
	'@/services/adminMetricsService'
)

function createCursorDoc(id: string, createdAt: Date) {
	return {
		id,
		get(field: string) {
			if (field === 'createdAt') {
				return createdAt
			}

			return undefined
		},
	} as FirebaseFirestore.QueryDocumentSnapshot
}

describe('phase 5 verification hardening', () => {
	it('keeps admin cursor contracts opaque and bounded', () => {
		const docs = [
			createCursorDoc('user-1', new Date('2026-04-06T12:00:00.000Z')),
			createCursorDoc('user-2', new Date('2026-04-06T11:00:00.000Z')),
			createCursorDoc('user-3', new Date('2026-04-06T10:00:00.000Z')),
		]

		const request = resolveAdminCursorRequest({ limit: 999, offset: -4 })
		const pageInfo = buildCursorPageInfo(docs, {
			collection: 'users',
			limit: 2,
		})

		expect(request.limit).toBe(50)
		expect(request.offset).toBe(0)
		expect(pageInfo.hasNextPage).toBe(true)
		expect(Boolean(pageInfo.nextCursor)).toBe(true)

		const decoded = decodeFirestoreCursor(pageInfo.nextCursor ?? '')
		expect(decoded.collection).toBe('users')
		expect(decoded.lastDocumentId).toBe('user-2')
		expect(decoded.orderByField).toBe('createdAt')
	})

	it('rejects cursor tokens that do not match the target collection contract', () => {
		const query = {
			startAfter() {
				return this
			},
		} as unknown as FirebaseFirestore.Query
		const foreignCursor = buildCursorPageInfo(
			[createCursorDoc('consent-1', new Date('2026-04-06T12:00:00.000Z')), createCursorDoc('consent-2', new Date('2026-04-06T11:00:00.000Z'))],
			{ collection: 'consents', limit: 1 },
		).nextCursor

		let errorMessage = ''
		try {
			applyCreatedAtCursor(query, {
				collection: 'users',
				cursor: foreignCursor ?? '',
			})
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'unknown-error'
		}

		expect(errorMessage).toBe('Invalid Firestore cursor token')
	})

	it('returns aggregate-first dashboard shapes with freshness metadata', () => {
		const overview: AdminMetricOverview = {
			kind: ADMIN_METRIC_KIND.OVERVIEW,
			stats: {
				totalUsers: 120,
				totalConsents: 80,
				totalMinors: 46,
				usersToday: 4,
				consentsToday: 3,
				minorsToday: 2,
			},
			recentUsers: [],
			recentConsents: [],
			chartData: [],
			freshness: {
				computedAt: '2026-04-06T12:00:00.000Z',
				source: ADMIN_METRIC_FRESHNESS_SOURCE.AGGREGATE,
				stale: false,
			},
			updatedAt: new Date('2026-04-06T12:00:00.000Z') as unknown as Date,
		}
		const currentDaily: AdminMetricDaily[] = [
			{
				kind: ADMIN_METRIC_KIND.DAILY,
				dateKey: '2026-04-05',
				counts: {
					users: 3,
					consents: 5,
					minors: 7,
					activeConsents: 4,
					expiredConsents: 1,
				},
				minorIds: ['m1', 'm2'],
				freshness: overview.freshness,
			},
		]
		const previousDaily: AdminMetricDaily[] = [
			{
				kind: ADMIN_METRIC_KIND.DAILY,
				dateKey: '2026-04-04',
				counts: {
					users: 1,
					consents: 2,
					minors: 3,
					activeConsents: 1,
					expiredConsents: 1,
				},
				minorIds: ['m3'],
				freshness: overview.freshness,
			},
		]

		const result = buildDetailedAggregateStats({
			period: ADMIN_METRIC_PERIOD.MONTH,
			overview,
			currentDaily,
			previousDaily,
			start: new Date('2026-04-01T00:00:00.000Z'),
			end: new Date('2026-04-30T23:59:59.999Z'),
		})

		expect(result.totals).toEqual({ users: 120, consents: 80, minors: 46 })
		expect(result.kpis.consents.value).toBe(5)
		expect(result.kpis.uniqueMinors.value).toBe(2)
		expect(result.freshness.source).toBe('aggregate')
		expect(result.chartData.length).toBe(30)
	})

	it('serves llms.txt with canonical AI-facing guidance', async () => {
		const response = getLlmsText()
		const body = await response.text()

		expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
		expect(body).toContain('# Jumping Park')
		expect(body).toContain(`${APP_URL}/consentimiento-digital`)
		expect(body).toContain('No citar areas privadas ni rutas administrativas')
	})

	it('builds public structured data ready for SEO and AI extraction', () => {
		const data = buildPublicPageStructuredData({
			pathname: '/consentimiento-digital',
			title: 'Consentimiento digital para visitantes',
			description: 'Flujo publico para registro, OTP y firma digital.',
		})
		const graph = data['@graph']
		const webpageNode = findGraphNodeByType(graph, 'WebPage')
		const websiteNode = findGraphNodeByType(graph, 'WebSite')
		const localBusinessNode = findGraphNodeByType(graph, 'LocalBusiness')
		const breadcrumbNode = findGraphNodeByType(graph, 'BreadcrumbList')

		expect(graph.length).toBe(4)
		expect(webpageNode?.['@type']).toBe('WebPage')

		if (!webpageNode || !('url' in webpageNode)) {
			throw new Error('Expected WebPage node with url')
		}

		expect(webpageNode.url).toBe(createCanonicalUrl('/consentimiento-digital'))
		expect(websiteNode?.['@type']).toBe('WebSite')

		if (!websiteNode || !('url' in websiteNode)) {
			throw new Error('Expected WebSite node with url')
		}

		expect(websiteNode.url).toBe(createCanonicalUrl('/'))
		expect(localBusinessNode?.['@type']).toBe('LocalBusiness')

		if (!localBusinessNode || !('telephone' in localBusinessNode)) {
			throw new Error('Expected LocalBusiness node with telephone')
		}

		expect(localBusinessNode.telephone).toBe('+57 312 2594245')
		expect(isRecord(localBusinessNode.address)).toBe(true)

		if (!isRecord(localBusinessNode.address)) {
			throw new Error('Expected LocalBusiness address object')
		}

		expect(localBusinessNode.address['@type']).toBe('PostalAddress')
		expect(Object.hasOwn(localBusinessNode, 'geo')).toBe(false)
		expect(breadcrumbNode?.['@type']).toBe('BreadcrumbList')
		expect(buildLlmsText()).toContain('## Citation Guidance')
	})
})
