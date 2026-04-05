import { describe, expect, it } from 'bun:test'
import {
	CONSENT_ASSET_LIMITS,
	getConsentSignatureAccessUrl,
	loadConsentSignatureBuffer,
} from '@/services/consentService'
import {
	EXPORT_RANGE_MAX_DAYS,
	resolveBoundedExportRange,
} from '@/services/exportRangeService'

describe('operational hardening helpers', () => {
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
