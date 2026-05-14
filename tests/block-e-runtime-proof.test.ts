import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { NextRequest } from 'next/server'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildAdminStatsRouteResponse } from '@/app/api/admin/stats/route'
import {
	buildAdminUserDeleteResponse,
} from '@/app/api/admin/users/[id]/route'
import { buildAdminUsersListResponse } from '@/app/api/admin/users/route'
import {
	KioskHardeningProvider,
	useHydrationSafeHardeningFlag,
} from '@/lib/hardeningClient'
import {
	HARDENING_FLAG,
	resolveKioskHardeningFlags,
} from '@/lib/hardeningPolicy'
import type { UserListQuery, UserListResult } from '@/services/userService'

async function withFlagEnv<T>(
	values: {
		server?: string
		client?: string
	},
	callback: () => Promise<T> | T,
): Promise<T> {
	const previousServerValue = process.env.OFFLINE_QUEUE_ENABLED
	const previousClientValue = process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED

	if (values.server === undefined) {
		delete process.env.OFFLINE_QUEUE_ENABLED
	} else {
		process.env.OFFLINE_QUEUE_ENABLED = values.server
	}

	if (values.client === undefined) {
		delete process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED
	} else {
		process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED = values.client
	}

	try {
		return await callback()
	} finally {
		if (previousServerValue === undefined) {
			delete process.env.OFFLINE_QUEUE_ENABLED
		} else {
			process.env.OFFLINE_QUEUE_ENABLED = previousServerValue
		}

		if (previousClientValue === undefined) {
			delete process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED
		} else {
			process.env.NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED = previousClientValue
		}
	}
}

function OfflineQueueFlagProbe() {
	const enabled = useHydrationSafeHardeningFlag(HARDENING_FLAG.OFFLINE_QUEUE)

	return createElement('span', {
		'data-offline-queue': enabled ? 'on' : 'off',
	})
}

describe('block e runtime proof: admin routes behind rollout flags', () => {
	it('returns pageInfo from the users route when cursor pagination is enabled', async () => {
		const listCalls: UserListQuery[] = []
		const items: UserListResult[] = [
			{
				id: '1032456789',
				uid: '1032456789',
				fullName: 'Ada Lovelace',
				email: 'ada@jumpingpark.test',
				phone: '3000000000',
				role: 'visitor',
				customPermissions: [],
				minorsCount: 0,
				minors: [],
				createdAt: '2026-04-07T10:00:00.000Z',
				updatedAt: '2026-04-07T10:00:00.000Z',
			},
		]

		const body = await buildAdminUsersListResponse(
			new URLSearchParams({ limit: '20', cursor: 'opaque-cursor' }),
			{
				cursorEnabled: true,
				listUsers: async (query) => {
					listCalls.push(query)
					return {
						items,
						pagination: {
							limit: 20,
							offset: 0,
							total: 1,
							hasMore: true,
						},
						pageInfo: {
							nextCursor: 'opaque-next-cursor',
							hasNextPage: true,
						},
						meta: {
							source: 'cursor',
						},
					}
				},
			},
		)

		expect(listCalls).toEqual([
			{
				search: undefined,
				limit: 20,
				offset: 0,
				cursor: 'opaque-cursor',
				useCursor: true,
			},
		])
		expect(body.pageInfo).toEqual({
			nextCursor: 'opaque-next-cursor',
			hasNextPage: true,
		})
		expect(body.meta).toEqual({ source: 'cursor' })
	})

	it('returns aggregate freshness metadata from the stats route when aggregates are enabled', async () => {
		const calls: Array<{ forceRecompute?: boolean }> = []

		const body = await buildAdminStatsRouteResponse({
			aggregatesEnabled: true,
			requestUrl: 'http://localhost/api/admin/stats?recompute=true',
			getOverview: async (options) => {
				calls.push(options ?? {})
				return {
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
						computedAt: '2026-04-07T10:00:00.000Z',
						source: 'aggregate',
						stale: false,
					},
				} as never
			},
		})

		expect(calls).toEqual([{ forceRecompute: true }])
		expect(body.stats).toEqual({
			totalUsers: 120,
			totalConsents: 80,
			totalMinors: 46,
			usersToday: 4,
			consentsToday: 3,
			minorsToday: 2,
		})
		expect(body.recentUsers).toEqual([])
		expect(body.recentConsents).toEqual([])
		expect(body.chartData).toEqual([])
		expect(body.freshness).toEqual({
			computedAt: '2026-04-07T10:00:00.000Z',
			source: 'aggregate',
			stale: false,
		})
		expect(body.meta).toEqual({ source: 'aggregate', fallbackApplied: false })
	})

	it('writes an immutable admin audit entry for a routed admin mutation', async () => {
		const auditCalls: Array<Record<string, unknown>> = []

		const body = await buildAdminUserDeleteResponse(
			new NextRequest('http://localhost/api/admin/users/1032456789', {
				method: 'DELETE',
			}),
			{
				uid: 'admin-1',
				email: 'admin@jumpingpark.test',
				role: 'admin',
			},
			{ id: '1032456789' },
			{
				deleteUser: async (id) => ({ success: true, deletedId: id }),
				writeAuditLog: async (entry) => {
					auditCalls.push(entry as unknown as Record<string, unknown>)
				},
			},
		)

		expect(body).toEqual({
			success: true,
			message: 'Usuario eliminado correctamente',
			deletedId: '1032456789',
		})
		expect(auditCalls).toEqual([
			{
				action: 'user.delete',
				actor: {
					uid: 'admin-1',
					email: 'admin@jumpingpark.test',
					role: 'admin',
				},
				target: {
					collection: 'users',
					id: '1032456789',
					label: '1032456789',
				},
				request: {
					method: 'DELETE',
					route: '/api/admin/users/1032456789',
				},
			},
		])
	})

	it('keeps kiosk hardening flag resolution out of module scope for hydration safety', () => {
		const consentPageSource = readFileSync(
			new URL('../src/app/(kiosk)/consentimiento/page.tsx', import.meta.url),
			'utf8',
		)
		const offlineRuntimeSource = readFileSync(
			new URL('../src/components/kiosk/KioskOfflineRuntime.tsx', import.meta.url),
			'utf8',
		)

		expect(consentPageSource).not.toContain(
			'const offlineQueueEnabled = resolveHardeningFlag(',
		)
		expect(offlineRuntimeSource).not.toContain(
			'const offlineQueueEnabled = resolveHardeningFlag(',
		)
	})

	it('proves the kiosk offline queue flag can switch OFF to ON from server runtime values without relying on stale public env', async () => {
		const offMarkup = await withFlagEnv(
			{ server: 'false', client: 'true' },
			() => {
				const hardeningFlags = resolveKioskHardeningFlags()

				expect(hardeningFlags.offlineQueueEnabled).toBe(false)

				return renderToStaticMarkup(
					createElement(
						KioskHardeningProvider,
						{ hardeningFlags },
						createElement(OfflineQueueFlagProbe),
					),
				)
			},
		)

		const onMarkup = await withFlagEnv(
			{ server: 'true', client: 'false' },
			() => {
				const hardeningFlags = resolveKioskHardeningFlags()

				expect(hardeningFlags.offlineQueueEnabled).toBe(true)

				return renderToStaticMarkup(
					createElement(
						KioskHardeningProvider,
						{ hardeningFlags },
						createElement(OfflineQueueFlagProbe),
					),
				)
			},
		)

		expect(offMarkup).toContain('data-offline-queue="off"')
		expect(onMarkup).toContain('data-offline-queue="on"')
	})
})
