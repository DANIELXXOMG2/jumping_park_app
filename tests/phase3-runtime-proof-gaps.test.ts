import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'
import {
	recomputeAdminMetricsWithDb,
} from '@/services/adminMetricsService'
import {
	buildAdminConsentDeleteResponse,
} from '@/app/api/admin/consents/[id]/route'

function timestampLike(value: string) {
	return {
		toDate: () => new Date(value),
	}
}

function createQuerySnapshot(
	docs: Array<{
		id: string
		data?: Record<string, unknown>
		ref?: {
			delete: () => Promise<void>
		}
	}>,
) {
	return {
		docs: docs.map((doc) => ({
			id: doc.id,
			ref: doc.ref ?? {
				delete: async () => undefined,
			},
			data: () => doc.data ?? {},
			get: (field: string) => doc.data?.[field],
		})),
		size: docs.length,
		empty: docs.length === 0,
	}
}

function createAdminMetricsDbFixture() {
	const sets: Array<{ collection: string; id: string; data: Record<string, unknown> }> = []
	const deletes: Array<{ collection: string; id: string }> = []
	const collectionState = new Map<string, Array<{ id: string; data?: Record<string, unknown> }>>([
		[
			'users',
			[
				{ id: 'user-valid', data: { createdAt: timestampLike('2026-04-25T12:00:00.000Z') } },
				{ id: 'user-missing', data: {} },
				{ id: 'user-null', data: { createdAt: null } },
			],
		],
		[
			'consents',
			[
				{
					id: 'consent-valid-fallback',
					data: {
						createdAt: timestampLike('2026-04-26T12:00:00.000Z'),
						signedAt: null,
						minorsSnapshot: [{ idNumber: 'minor-1' }],
						validUntil: timestampLike('2099-04-26T12:00:00.000Z'),
						adultSnapshot: { fullName: 'Ada' },
						consecutivo: 1,
					},
				},
				{
					id: 'consent-missing',
					data: {
						minorsSnapshot: [{ idNumber: 'minor-2' }],
						adultSnapshot: { fullName: 'Grace' },
						consecutivo: 2,
					},
				},
				{
					id: 'consent-malformed',
					data: {
						createdAt: 'banana',
						signedAt: 'broken',
						minorsSnapshot: [],
						adultSnapshot: { fullName: 'Linus' },
						consecutivo: 3,
					},
				},
			],
		],
		[
			'admin_metrics',
			[
				{ id: 'daily:obsolete-day', data: { kind: 'daily', dateKey: '2026-04-01' } },
			],
		],
		[
			'minors_index',
			[],
		],
	])

	function createDocRef(collection: string, id: string) {
		return {
			id,
			set: async (data: Record<string, unknown>) => {
				sets.push({ collection, id, data })
			},
			delete: async () => {
				deletes.push({ collection, id })
			},
			get: async () => {
				const docs = collectionState.get(collection) ?? []
				const match = docs.find((doc) => doc.id === id)
				return {
					exists: Boolean(match),
					data: () => match?.data,
				}
			},
		}
	}

	function createCollection(collection: string) {
		const selectedFields = new Set<string>()
		let ordered = false

		return {
			select: (...fields: string[]) => {
				fields.forEach((field) => selectedFields.add(field))
				return createCollection(collection)
			},
			orderBy: () => {
				ordered = true
				return createCollection(collection)
			},
			limit: () => createCollection(collection),
			where: (field: string, _op: string, value: unknown) => {
				if (collection === 'admin_metrics' && field === 'kind' && value === 'daily') {
					return {
						get: async () =>
							createQuerySnapshot(
								(collectionState.get(collection) ?? []).map((doc) => ({
									...doc,
									ref: {
										delete: async () => {
											deletes.push({ collection, id: doc.id })
										},
									},
								})),
							),
					}
				}

				throw new Error(`Unsupported where for ${collection}:${field}:${String(value)}`)
			},
			count: () => ({
				get: async () => ({
					data: () => ({ count: (collectionState.get(collection) ?? []).length }),
				}),
			}),
			doc: (id: string) => createDocRef(collection, id),
			get: async () => {
				const docs = collectionState.get(collection) ?? []
				if (!ordered) {
					return createQuerySnapshot(docs)
				}

				const projectedDocs = docs.map((doc) => {
					if (selectedFields.size === 0) {
						return doc
					}

					const data = Object.fromEntries(
						Array.from(selectedFields).map((field) => [field, doc.data?.[field]]),
					)
					return { ...doc, data }
				})

				return createQuerySnapshot(projectedDocs)
			},
		}
	}

	return {
			db: {
			collection: (collection: string) => createCollection(collection),
			getAll: async (...refs: Array<{ id: string; get: () => Promise<{ data: () => unknown }> }>) => {
				const snapshots = await Promise.all(refs.map((ref) => ref.get()))
				return snapshots.map((snapshot) => ({
					data: () => snapshot.data(),
				}))
			},
		},
		sets,
		deletes,
	}
}

describe('phase 3 runtime proof gaps', () => {
	it('recomputes aggregate metrics without crashing on dirty historical timestamps', async () => {
		const fixture = createAdminMetricsDbFixture()

		const overview = await recomputeAdminMetricsWithDb(
			fixture.db as unknown as Parameters<typeof recomputeAdminMetricsWithDb>[0],
		)

		expect(overview.stats.totalUsers).toBe(3)
		expect(overview.stats.totalConsents).toBe(3)
		expect(overview.unknownDateBuckets).toEqual({ users: 2, consents: 2 })
		expect(overview.recentConsents.length).toBe(3)
		expect(
			fixture.sets.some(
				(entry) => entry.collection === 'admin_metrics' && entry.id === 'overview',
			),
		).toBe(true)
		expect(fixture.deletes).toEqual([
			{ collection: 'admin_metrics', id: 'daily:obsolete-day' },
		])
	})

	it('uses createdAt as consent fallback before classifying an unknown-date bucket', async () => {
		const fixture = createAdminMetricsDbFixture()

		const overview = await recomputeAdminMetricsWithDb(
			fixture.db as unknown as Parameters<typeof recomputeAdminMetricsWithDb>[0],
		)

		expect(overview.chartData.some((entry) => entry.value === 1)).toBe(true)
		expect(overview.unknownDateBuckets?.consents).toBe(2)
		expect(overview.recentConsents[0]?.adultName).toBe('Ada')
	})

	it('commits consent deletion and audit log inside the same route-level batch boundary', async () => {
		const auditEntries: Array<Record<string, unknown>> = []
		const deletedTargets: Array<{ collection: string; id: string }> = []
		let commitCount = 0

		const body = await buildAdminConsentDeleteResponse(
			new NextRequest('http://localhost/api/admin/consents/consent-1', {
				method: 'DELETE',
			}),
			{
				uid: 'admin-1',
				email: 'admin@jumpingpark.test',
				role: 'admin',
			},
			{ id: 'consent-1' },
			{
				readConsent: async () => ({ exists: true }),
				commitAuditBatch: async ({ apply, audit }) => {
					const batch = {
						delete: (ref: { id: string; parent: { id: string } }) => {
							deletedTargets.push({ collection: ref.parent.id, id: ref.id })
						},
						set: (_ref: unknown, data: Record<string, unknown>) => {
							auditEntries.push(data)
						},
						commit: async () => {
							commitCount += 1
						},
					}
					apply(batch as unknown as FirebaseFirestore.WriteBatch)
					batch.set({}, {
						...audit,
						createdAt: new Date('2026-04-29T00:00:00.000Z'),
					})
					await batch.commit()
				},
				getConsentRef: (id: string) => ({ id, parent: { id: 'consents' } }),
			},
		)

		expect(body).toEqual({
			success: true,
			message: 'Consentimiento eliminado correctamente',
			deletedId: 'consent-1',
		})
		expect(deletedTargets).toEqual([{ collection: 'consents', id: 'consent-1' }])
		expect(auditEntries.length).toBe(1)
		expect(auditEntries[0]?.action).toBe('consent.delete')
		expect(commitCount).toBe(1)
	})

	it('returns null without opening the audit batch when the consent is missing', async () => {
		let commitCalled = false

		const body = await buildAdminConsentDeleteResponse(
			new NextRequest('http://localhost/api/admin/consents/missing-consent', {
				method: 'DELETE',
			}),
			{
				uid: 'admin-1',
				email: 'admin@jumpingpark.test',
				role: 'admin',
			},
			{ id: 'missing-consent' },
			{
				readConsent: async () => ({ exists: false }),
				commitAuditBatch: async () => {
					commitCalled = true
				},
			},
		)

		expect(body).toBe(null)
		expect(commitCalled).toBe(false)
	})
})
