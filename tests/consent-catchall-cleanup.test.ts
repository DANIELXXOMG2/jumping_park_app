import { describe, expect, it } from 'bun:test'
import {
	consentService,
	OFFLINE_CONSENT_ASSET_CLEANUP_REASON,
} from '@/services/consentService'

type ConsentServiceMutableInternals = Record<string, unknown>

const validInput = {
	responsibleAdult: {
		fullName: 'Ada Lovelace',
		documentId: '123',
		email: 'ada@example.com',
		phone: '3001234567',
	},
	minors: [],
	signatureBase64: 'data:image/png;base64,abc',
	ipAddress: '127.0.0.1',
}

function patchConsentServiceForFailure(input: {
	signaturePath: string
	uploadedThisAttempt: boolean
}) {
	const service = consentService as unknown as ConsentServiceMutableInternals
	const originalUploadSignature = service.uploadSignature
	const originalNormalizeMinors = service.normalizeMinors
	const originalUpsertUser = service.upsertUser
	const originalCleanupUploadedSignature = service.cleanupUploadedSignature
	const cleanupCalls: Array<{ path: string; reason: string }> = []

	service.uploadSignature = async () => ({
		path: input.signaturePath,
		signedUrl: 'https://example.com/signature.png',
		buffer: Buffer.from('signature'),
		uploadedThisAttempt: input.uploadedThisAttempt,
	})
	service.normalizeMinors = () => []
	service.upsertUser = async () => {
		throw new Error('user-upsert-failed')
	}
	service.cleanupUploadedSignature = async (path: string, reason: string) => {
		cleanupCalls.push({ path, reason })
	}

	return {
		cleanupCalls,
		restore() {
			service.uploadSignature = originalUploadSignature
			service.normalizeMinors = originalNormalizeMinors
			service.upsertUser = originalUpsertUser
			service.cleanupUploadedSignature = originalCleanupUploadedSignature
		},
	}
}

describe('consent service catch-all signature cleanup', () => {
	it('cleans a deterministic signature uploaded in the current attempt when a later step fails', async () => {
		const patch = patchConsentServiceForFailure({
			signaturePath: 'signatures/123/offline/dedupe-123.png',
			uploadedThisAttempt: true,
		})

		try {
			const result = await consentService.createConsent({
				...validInput,
				offlineSync: {
					dedupeKey: 'dedupe-123',
					policyVersion: 'v2',
					signedAtLocal: '2026-04-25T12:00:00.000Z',
				},
			})

			expect(result.success).toBe(false)
			expect(result.error).toBe('user-upsert-failed')
			expect(patch.cleanupCalls).toEqual([
				{
					path: 'signatures/123/offline/dedupe-123.png',
					reason: OFFLINE_CONSENT_ASSET_CLEANUP_REASON.POST_UPLOAD_FAILURE,
				},
			])
		} finally {
			patch.restore()
		}
	})

	it('preserves a reused deterministic signature when the current attempt did not upload it', async () => {
		const patch = patchConsentServiceForFailure({
			signaturePath: 'signatures/123/offline/dedupe-123.png',
			uploadedThisAttempt: false,
		})

		try {
			const result = await consentService.createConsent({
				...validInput,
				offlineSync: {
					dedupeKey: 'dedupe-123',
					policyVersion: 'v2',
					signedAtLocal: '2026-04-25T12:00:00.000Z',
				},
			})

			expect(result.success).toBe(false)
			expect(result.error).toBe('user-upsert-failed')
			expect(patch.cleanupCalls).toEqual([])
		} finally {
			patch.restore()
		}
	})
})
