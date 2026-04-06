import { describe, expect, it } from 'bun:test'
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
	EXPORT_RANGE_MAX_DAYS,
	resolveBoundedExportRange,
} from '@/services/exportRangeService'

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
		})

		expect(result.metadata.bounded).toBe(true)
		expect(result.metadata.rejected).toBe(false)
		expect(result.metadata.capped).toBe(false)
		expect(result.metadata.dayCount).toBe(30)
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
