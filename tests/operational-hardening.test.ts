import { describe, expect, it } from 'bun:test'
import { NextRequest, NextResponse } from 'next/server'
import {
	evaluateHardeningFlag,
	HARDENING_FLAG,
	resolveHardeningFlag,
} from '@/lib/hardeningPolicy'
import {
	CONSENT_ASSET_LIMITS,
	getConsentSignatureAccessUrl,
	loadConsentSignatureBuffer,
} from '@/services/consentService'
import {
	buildExportMetadataHeaders,
	EXPORT_FALLBACK_ROW_CAP,
	EXPORT_RANGE_MAX_DAYS,
	resolveBoundedExportRange,
	resolveExportRange,
} from '@/services/exportRangeService'

const { handleUsersExport } = await import(
	'@/app/api/admin/export/users/route'
)
const { handleConsentsExport } = await import(
	'@/app/api/admin/export/consents/route'
)

function createAuthorizedExportDeps<TCsv extends { csv: string; rowCount: number }>(
	exportResult: TCsv,
) {
	return {
		verifyAdminTokenWithPermission: async () => ({
			success: true as const,
			uid: 'admin-uid',
			email: 'admin@example.com',
			role: 'admin' as const,
			expiresAt: new Date(Date.now() + 60_000).toISOString(),
			transport: 'bearer' as const,
		}),
		buildUsersCsvExport: async () => exportResult,
		buildConsentsCsvExport: async () => exportResult,
	}
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

describe('operational hardening helpers', () => {
	it('honors explicit true rollout flags', async () => {
		await withEnv('OTP_HARDENING_ENABLED', 'true', () => {
			const resolution = resolveHardeningFlag(HARDENING_FLAG.OTP_HARDENING)

			expect(resolution.enabled).toBe(true)
			expect(resolution.status).toBe('enabled')
			expect(resolution.fallbackApplied).toBe(false)
		})
	})

	it('defaults missing and malformed rollout flags to secure-on with deterministic warnings', async () => {
		const originalWarn = console.warn
		const warnings: unknown[][] = []
		console.warn = (...args: unknown[]) => {
			warnings.push(args)
		}

		try {
			await withEnv('OTP_HARDENING_ENABLED', undefined, () => {
				const resolution = resolveHardeningFlag(HARDENING_FLAG.OTP_HARDENING)

				expect(resolution.enabled).toBe(true)
				expect(resolution.status).toBe('defaulted')
			})

			await withEnv('OTP_HARDENING_ENABLED', 'banana', () => {
				const resolution = resolveHardeningFlag(HARDENING_FLAG.OTP_HARDENING)

				expect(resolution.enabled).toBe(true)
				expect(resolution.status).toBe('defaulted')
			})
		} finally {
			console.warn = originalWarn
		}

		expect(warnings.length).toBe(2)
		expect((warnings[0]?.[1] as Record<string, unknown>)?.feature_name).toBe(
			'otp-hardening',
		)
		expect((warnings[0]?.[1] as Record<string, unknown>)?.status).toBe(
			'defaulted',
		)
		expect((warnings[1]?.[1] as Record<string, unknown>)?.feature_name).toBe(
			'otp-hardening',
		)
		expect((warnings[1]?.[1] as Record<string, unknown>)?.status).toBe(
			'defaulted',
		)
	})

	it('emits deterministic policy telemetry markers', async () => {
		const originalInfo = console.info
		const events: unknown[][] = []
		console.info = (...args: unknown[]) => {
			events.push(args)
		}

		try {
			await withEnv('EXPORT_BOUNDS_ENFORCED', 'false', () => {
				const evaluation = evaluateHardeningFlag({
					featureName: HARDENING_FLAG.EXPORT_BOUNDS,
					source: 'admin-export-users',
					route: '/api/admin/export/users',
				})

				expect(evaluation.event.feature_name).toBe('export-bounds')
				expect(evaluation.event.status).toBe('disabled')
				expect(evaluation.headers['X-Hardening-Feature']).toBe('export-bounds')
				expect(evaluation.headers['X-Hardening-Status']).toBe('disabled')
			})
		} finally {
			console.info = originalInfo
		}

		expect(events.length).toBe(1)
		expect((events[0]?.[1] as Record<string, unknown>)?.feature_name).toBe(
			'export-bounds',
		)
		expect((events[0]?.[1] as Record<string, unknown>)?.status).toBe(
			'disabled',
		)
	})

	it('rejects unbounded export ranges', () => {
		let errorMessage = ''

		try {
			resolveBoundedExportRange({
				field: 'signedAt',
				from: '2026-01-01',
				source: 'admin-export-consents',
			})
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'unknown-error'
		}

		expect(errorMessage).toBe('Los exports requieren un rango acotado con from y to.')
	})

	it('rejects export ranges wider than thirty days', () => {
		let errorMessage = ''

		try {
			resolveBoundedExportRange({
				field: 'signedAt',
				from: '2026-01-01',
				to: '2026-02-01',
				source: 'admin-export-consents',
			})
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'unknown-error'
		}

		expect(errorMessage).toBe(
			`El rango máximo permitido es de ${EXPORT_RANGE_MAX_DAYS} días.`,
		)
	})

	it('returns bounded metadata for valid export ranges', () => {
		const result = resolveBoundedExportRange({
			field: 'createdAt',
			from: '2026-01-01',
			to: '2026-01-30',
			source: 'admin-export-users',
		})

		expect(result.metadata.bounded).toBe(true)
		expect(result.metadata.rejected).toBe(false)
		expect(result.metadata.capped).toBe(false)
		expect(result.metadata.dayCount).toBe(30)
	})

	it('bypasses export bounds and keeps observability headers when disabled', async () => {
		await withEnv('EXPORT_BOUNDS_ENFORCED', 'false', () => {
			const range = resolveExportRange({
				field: 'signedAt',
				from: '2026-01-01',
				to: '2026-12-31',
				source: 'admin-export-consents',
				route: '/api/admin/export/consents',
			})
			const headers = {
				...range.hardening.headers,
				...buildExportMetadataHeaders(range.metadata, 42),
			}

			expect(range.hardening.status).toBe('disabled')
			expect(range.metadata.dayCount).toBeGreaterThan(EXPORT_RANGE_MAX_DAYS)
			expect(headers['X-Hardening-Feature']).toBe('export-bounds')
			expect(headers['X-Hardening-Status']).toBe('disabled')
			expect(headers['X-Export-Bounds']).toBe('enforced')
			expect(headers['X-Export-Row-Cap']).toBe(String(EXPORT_FALLBACK_ROW_CAP))
		})
	})

	it('returns 400 with hardening headers from /api/admin/export/users when enforced bounds reject the range', async () => {
		await withEnv('EXPORT_BOUNDS_ENFORCED', 'true', async () => {
			const response = await handleUsersExport(
				new NextRequest(
					'https://example.com/api/admin/export/users?from=2026-01-01&to=2026-12-31',
				),
				createAuthorizedExportDeps({
					csv: 'uid,name\n123,Visitor',
					rowCount: 1,
				}),
			)
			const body = (await response.json()) as {
				code?: string
				error?: string
			}

			expect(response.status).toBe(400)
			expect(body.code).toBe('EXPORT_RANGE_TOO_WIDE')
			expect(body.error).toBe(
				`El rango máximo permitido es de ${EXPORT_RANGE_MAX_DAYS} días.`,
			)
			expect(response.headers.get('X-Hardening-Policy')).toBe('hardening.policy')
			expect(response.headers.get('X-Hardening-Feature')).toBe('export-bounds')
			expect(response.headers.get('X-Hardening-Status')).toBe('enabled')
		})
	})

	it('returns 200 with final headers from /api/admin/export/users when bounds are disabled', async () => {
		await withEnv('EXPORT_BOUNDS_ENFORCED', 'false', async () => {
			const response = await handleUsersExport(
				new NextRequest(
					'https://example.com/api/admin/export/users?from=2026-01-01&to=2026-12-31',
				),
				createAuthorizedExportDeps({
					csv: 'uid,name\n123,Visitor',
					rowCount: 1,
				}),
			)

			expect(response.status).toBe(200)
			expect(await response.text()).toContain('uid,name')
			expect(response.headers.get('X-Hardening-Policy')).toBe('hardening.policy')
			expect(response.headers.get('X-Hardening-Feature')).toBe('export-bounds')
			expect(response.headers.get('X-Hardening-Status')).toBe('disabled')
			expect(response.headers.get('X-Export-Bounds')).toBe('enforced')
			expect(response.headers.get('X-Export-Row-Cap')).toBe(
				String(EXPORT_FALLBACK_ROW_CAP),
			)
		})
	})

	it('returns 400 with hardening headers from /api/admin/export/consents when enforced bounds reject the range', async () => {
		await withEnv('EXPORT_BOUNDS_ENFORCED', 'true', async () => {
			const response = await handleConsentsExport(
				new NextRequest(
					'https://example.com/api/admin/export/consents?from=2026-01-01&to=2026-12-31',
				),
				createAuthorizedExportDeps({
					csv: 'consecutivo\n1',
					rowCount: 1,
				}),
			)
			const body = (await response.json()) as {
				code?: string
				error?: string
			}

			expect(response.status).toBe(400)
			expect(body.code).toBe('EXPORT_RANGE_TOO_WIDE')
			expect(body.error).toBe(
				`El rango máximo permitido es de ${EXPORT_RANGE_MAX_DAYS} días.`,
			)
			expect(response.headers.get('X-Hardening-Policy')).toBe('hardening.policy')
			expect(response.headers.get('X-Hardening-Feature')).toBe('export-bounds')
			expect(response.headers.get('X-Hardening-Status')).toBe('enabled')
		})
	})

	it('returns 200 with final headers from /api/admin/export/consents when bounds are disabled', async () => {
		await withEnv('EXPORT_BOUNDS_ENFORCED', 'false', async () => {
			const response = await handleConsentsExport(
				new NextRequest(
					'https://example.com/api/admin/export/consents?from=2026-01-01&to=2026-12-31',
				),
				createAuthorizedExportDeps({
					csv: 'consecutivo\n1',
					rowCount: 1,
				}),
			)

			expect(response.status).toBe(200)
			expect(await response.text()).toContain('consecutivo')
			expect(response.headers.get('X-Hardening-Policy')).toBe('hardening.policy')
			expect(response.headers.get('X-Hardening-Feature')).toBe('export-bounds')
			expect(response.headers.get('X-Hardening-Status')).toBe('disabled')
			expect(response.headers.get('X-Export-Bounds')).toBe('enforced')
			expect(response.headers.get('X-Export-Row-Cap')).toBe(
				String(EXPORT_FALLBACK_ROW_CAP),
			)
		})
	})

	it('keeps legacy http signature urls accessible', async () => {
		const url = 'https://example.com/signature.png'
		const resolvedUrl = await getConsentSignatureAccessUrl({ signatureUrl: url })

		expect(resolvedUrl).toBe(url)
	})

	it('decodes legacy data urls for pdf generation', async () => {
		const buffer = await loadConsentSignatureBuffer({
			signatureUrl: 'data:image/png;base64,ZmFrZS1zaWduYXR1cmU=',
		})

		expect(buffer?.toString('utf-8')).toBe('fake-signature')
	})

	it('caps consent asset ttl to fifteen minutes', () => {
		expect(CONSENT_ASSET_LIMITS.SIGNED_URL_TTL_MINUTES <= 15).toBe(true)
	})
})
