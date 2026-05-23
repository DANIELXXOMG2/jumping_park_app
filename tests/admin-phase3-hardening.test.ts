import { describe, expect, it } from 'bun:test'
import { buildAdminConsentsListResponse } from '@/app/api/admin/consents/route'
import { buildAdminMinorsListResponse } from '@/app/api/admin/minors/route'
import {
	buildAdminDetailedStatsRouteResponse,
} from '@/app/api/admin/stats/detailed/route'
import { buildAdminStatsRouteResponse } from '@/app/api/admin/stats/route'
import { buildAdminUsersListResponse } from '@/app/api/admin/users/route'
import { addAdminAuditLogToBatch } from '@/services/adminAuditService'
import {
	buildExportMetadataHeaders,
	EXPORT_FALLBACK_ROW_CAP,
} from '@/services/exportRangeService'

describe('phase 3 admin contract hardening', () => {
	it('returns cursor envelope plus freshness metadata for admin user lists', async () => {
		const payload = await buildAdminUsersListResponse(
			new URLSearchParams({ limit: '20', cursor: 'opaque-cursor' }),
			{
				cursorEnabled: true,
				listUsers: async () => ({
					items: [],
					pagination: {
						total: 0,
						limit: 20,
						offset: 0,
						hasMore: false,
					},
					pageInfo: {
						nextCursor: 'next-user-cursor',
						hasNextPage: true,
					},
					meta: {
						source: 'cursor',
						totalApprox: 0,
					},
				}),
			},
		)

		expect(payload.pageInfo).toEqual({
			nextCursor: 'next-user-cursor',
			hasNextPage: true,
		})
		expect(payload.meta).toEqual({ source: 'cursor', totalApprox: 0 })
		expect(payload.freshness.source).toBe('live')
	})

	it('returns aligned freshness metadata for minors and consents contracts', async () => {
		const minorsPayload = await buildAdminMinorsListResponse(
			new URLSearchParams({ limit: '20' }),
			{
				cursorEnabled: false,
				listMinors: async () => ({
					items: [],
					pagination: {
						total: 0,
						limit: 20,
						offset: 0,
						hasMore: false,
					},
					pageInfo: { nextCursor: null, hasNextPage: false },
					meta: { source: 'search', totalApprox: 0 },
				}),
			},
		)
		const consentsPayload = buildAdminConsentsListResponse({
			consents: [],
			pagination: {
				total: 0,
				limit: 20,
				offset: 0,
				hasMore: false,
			},
			pageInfo: { nextCursor: null, hasNextPage: false },
			meta: { source: 'search', totalApprox: 0 },
		})

		expect(minorsPayload.freshness.source).toBe('live')
		expect(consentsPayload.freshness.source).toBe('live')
	})

	it('reports aggregate fallback source for overview stats', async () => {
		const payload = await buildAdminStatsRouteResponse({
			aggregatesEnabled: true,
			requestUrl: 'http://localhost/api/admin/stats',
			getOverview: async () => null,
			getLiveStats: async () => ({
				stats: {
					totalUsers: 1,
					totalConsents: 2,
					totalMinors: 3,
					usersToday: 0,
					consentsToday: 0,
					minorsToday: 0,
				},
				recentUsers: [],
				recentConsents: [],
				chartData: [],
				freshness: {
					computedAt: '2026-04-29T00:00:00.000Z',
					source: 'live',
					stale: false,
				},
				meta: { source: 'live', fallbackApplied: false },
			}),
		})

		expect(payload.meta).toEqual({ source: 'live', fallbackApplied: true })
		expect(payload.freshness.source).toBe('live')
	})

	it('preserves unknown date buckets in aggregate detailed stats and reports fallback', async () => {
		const aggregatePayload = await buildAdminDetailedStatsRouteResponse({
			aggregatesEnabled: true,
			period: 'month',
			shouldRecompute: false,
			getDetailed: async () => ({
				period: 'month',
				dateRange: {
					start: '2026-04-01T00:00:00.000Z',
					end: '2026-04-30T23:59:59.999Z',
				},
				kpis: {
					consents: { value: 2, change: 0, previousValue: 2 },
					users: { value: 1, change: 0, previousValue: 1 },
					minors: { value: 3, change: 0, previousValue: 3 },
					uniqueMinors: { value: 2, label: 'Participantes únicos' },
					activeConsents: { value: 1, label: 'Vigentes' },
					expiredConsents: { value: 1, label: 'Vencidos' },
				},
				totals: { users: 5, consents: 6, minors: 7 },
				chartData: [],
				topDays: [],
				averages: { consentsPerDay: 0.1, minorsPerConsent: 1.5 },
				freshness: {
					computedAt: '2026-04-29T00:00:00.000Z',
					source: 'aggregate',
					stale: false,
				},
				unknownDateBuckets: { users: 4, consents: 9 },
			}),
		})

		expect(aggregatePayload.meta).toEqual({
			source: 'aggregate',
			fallbackApplied: false,
		})
		expect(aggregatePayload.unknownDateBuckets).toEqual({ users: 4, consents: 9 })

		const fallbackPayload = await buildAdminDetailedStatsRouteResponse({
			aggregatesEnabled: true,
			period: 'month',
			shouldRecompute: false,
			getDetailed: async () => null,
			getLiveDetailed: async () => ({
				period: 'month',
				dateRange: {
					start: '2026-04-01T00:00:00.000Z',
					end: '2026-04-30T23:59:59.999Z',
				},
				kpis: {
					consents: { value: 0, change: 0, previousValue: 0 },
					users: { value: 0, change: 0, previousValue: 0 },
					minors: { value: 0, change: 0, previousValue: 0 },
					uniqueMinors: { value: 0, label: 'Participantes únicos' },
					activeConsents: { value: 0, label: 'Vigentes' },
					expiredConsents: { value: 0, label: 'Vencidos' },
				},
				totals: { users: 0, consents: 0, minors: 0 },
				chartData: [],
				topDays: [],
				averages: { consentsPerDay: 0, minorsPerConsent: 0 },
				freshness: {
					computedAt: '2026-04-29T00:00:00.000Z',
					source: 'live',
					stale: false,
				},
				unknownDateBuckets: { users: 0, consents: 0 },
				meta: { source: 'live', fallbackApplied: false },
			}),
		})

		expect(fallbackPayload.meta).toEqual({ source: 'live', fallbackApplied: true })
	})

	it('adds bounded export freshness headers and audit batch entries', () => {
		const headers = buildExportMetadataHeaders(
			{
				field: 'createdAt',
				from: '2026-04-01',
				to: '2026-04-30',
				dayCount: 30,
				maxDays: 30,
				bounded: true,
				capped: false,
				rejected: false,
				rowCap: EXPORT_FALLBACK_ROW_CAP,
			},
			25,
			'2026-04-29T00:00:00.000Z',
			'live',
		)
		const setCalls: Array<{ data: Record<string, unknown> }> = []
		addAdminAuditLogToBatch(
			{
				set: (_docRef, data) => {
					setCalls.push({ data: data as Record<string, unknown> })
				},
				commit: async () => undefined,
			},
			{
				doc: () => ({ id: 'audit-1' }) as unknown as FirebaseFirestore.DocumentReference,
			},
			{
				action: 'consent.delete',
				actor: { uid: 'admin-1', email: 'admin@test.dev', role: 'admin' },
				target: { collection: 'consents', id: 'consent-1', label: 'consent-1' },
				request: { method: 'DELETE', route: '/api/admin/consents/consent-1' },
			},
			new Date('2026-04-29T00:00:00.000Z'),
		)

		expect(headers['X-Export-Generated-At']).toBe('2026-04-29T00:00:00.000Z')
		expect(headers['X-Export-Source']).toBe('live')
		expect(setCalls.length).toBe(1)
		expect(setCalls[0]?.data.action).toBe('consent.delete')
		expect(setCalls[0]?.data).not.toHaveProperty('details')
	})
})
