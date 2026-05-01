import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'
import { createConsentPostHandler } from '@/app/api/consentimientos/route'
import { verifyOtpSessionWithDeps } from '@/services/authService'

function createConsentRequest() {
	return new NextRequest('https://example.com/api/consentimientos', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-forwarded-for': '203.0.113.15',
		},
		body: JSON.stringify({
			acceptedPolicy: true,
			minors: [],
			signature: 'data:image/png;base64,abc',
			responsibleAdult: {
				fullName: 'Ada Lovelace',
				documentId: '1032456789',
				email: 'ada@jumpingpark.test',
				phone: '3000000000',
			},
		}),
	})
}

describe('consent route otp enforcement', () => {
	it('returns 201 when the consent request has a valid otp session', async () => {
		const createConsentCalls: Array<Record<string, unknown>> = []
		const handler = createConsentPostHandler({
			verifyOtpSession: async () => true,
			createConsent: async (payload) => {
				createConsentCalls.push(payload as unknown as Record<string, unknown>)
				return {
					success: true,
					consentId: 'consent-1',
					consecutivo: 1001,
				}
			},
		})

		const response = await handler(createConsentRequest(), {
			params: Promise.resolve({}),
		})

		expect(response.status).toBe(201)
		expect(await response.json()).toEqual({
			success: true,
			consentId: 'consent-1',
			consecutivo: 1001,
			replayed: false,
		})
		expect(createConsentCalls).toEqual([
			{
				responsibleAdult: {
					fullName: 'Ada Lovelace',
					documentId: '1032456789',
					email: 'ada@jumpingpark.test',
					phone: '3000000000',
				},
				minors: [],
				signatureBase64: 'data:image/png;base64,abc',
				ipAddress: '203.0.113.15',
				offlineSync: undefined,
			},
		])
	})

	it('returns 401 and aborts consent creation when the otp session is invalid', async () => {
		let createConsentCalled = false
		const handler = createConsentPostHandler({
			verifyOtpSession: async () => false,
			createConsent: async () => {
				createConsentCalled = true
				return {
					success: true,
				}
			},
		})

		const response = await handler(createConsentRequest(), {
			params: Promise.resolve({}),
		})

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({
			error: 'La sesión OTP es inválida o expiró',
			code: 'OTP_SESSION_INVALID',
		})
		expect(createConsentCalled).toBe(false)
	})

	it('returns 201 when the consent request succeeds through the legacy otp fallback path', async () => {
		const accessLookups: string[] = []
		const legacyLookups: string[] = []
		const createConsentCalls: Array<Record<string, unknown>> = []
		const handler = createConsentPostHandler({
			verifyOtpSession: async (userId) => {
				const result = await verifyOtpSessionWithDeps(userId, {
					getAccessSession: async (requestedUserId) => {
						accessLookups.push(requestedUserId)
						return null
					},
					getLegacySession: async (requestedUserId) => {
						legacyLookups.push(requestedUserId)

						return {
							userId: requestedUserId,
							validatedAt: new Date(),
							email: 'ada@jumpingpark.test',
							expiresAt: new Date(Date.now() + 60_000),
							createdAt: new Date(),
							updatedAt: new Date(),
						}
					},
					deleteAccessSession: async () => undefined,
					deleteLegacySession: async () => undefined,
				})

				return result.valid
			},
			createConsent: async (payload) => {
				createConsentCalls.push(payload as unknown as Record<string, unknown>)
				return {
					success: true,
					consentId: 'consent-legacy',
					consecutivo: 1002,
				}
			},
		})

		const response = await handler(createConsentRequest(), {
			params: Promise.resolve({}),
		})

		expect(response.status).toBe(201)
		expect(await response.json()).toEqual({
			success: true,
			consentId: 'consent-legacy',
			consecutivo: 1002,
			replayed: false,
		})
		expect(accessLookups).toEqual(['1032456789'])
		expect(legacyLookups).toEqual(['1032456789'])
		expect(createConsentCalls.length).toBe(1)
	})

	it('returns the failing createConsent status instead of leaking a false 201', async () => {
		const handler = createConsentPostHandler({
			verifyOtpSession: async () => true,
			createConsent: async () => ({
				success: false,
				error: 'Ledger conflict',
				errorCode: 'OFFLINE_SYNC_LEDGER_CONFLICT',
				statusCode: 409,
			}),
		})

		const response = await handler(createConsentRequest(), {
			params: Promise.resolve({}),
		})

		expect(response.status).toBe(409)
		expect(await response.json()).toEqual({
			error: 'Ledger conflict',
			code: 'OFFLINE_SYNC_LEDGER_CONFLICT',
		})
	})
})
