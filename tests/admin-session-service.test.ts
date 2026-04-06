import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'

process.env.ADMIN_JWT_SECRET = 'test-admin-session-secret'

const { ApiError } = await import('@/lib/apiHandler')
const {
	exchangeAdminSessionFromIdToken,
	refreshAdminSessionFromRequest,
} = await import('@/services/adminSessionService')
const {
	ADMIN_IDLE_TIMEOUT_MINUTES,
	ADMIN_SESSION_COOKIE_NAME,
	buildAdminSessionCookieValue,
	createAdminSessionPayload,
} = await import('@/lib/adminAuth')

describe('admin session exchange error mapping', () => {
	it('returns explicit 500 when firebase admin is misconfigured', async () => {
		const fakeVerifier = async () => {
			throw Object.assign(
				new Error(
					'The credential implementation provided to initializeApp() failed to fetch a valid Google OAuth2 access token',
				),
				{ code: 'app/invalid-credential' },
			)
		}

		try {
			await exchangeAdminSessionFromIdToken('fake-token', fakeVerifier)
			expect(true).toBe(false)
		} catch (error) {
			expect(error instanceof ApiError).toBe(true)
			if (!(error instanceof ApiError)) {
				return
			}

			expect(error.statusCode).toBe(500)
			expect(error.code).toBe('FIREBASE_ADMIN_CONFIG_ERROR')
		}
	})

	it('does not rotate a healthy cookie during routine session checks', () => {
		const issuedAt = Date.now()
		const payload = createAdminSessionPayload({
			uid: 'admin-uid',
			email: 'admin@example.com',
			role: 'admin',
			now: issuedAt,
		})
		const request = new NextRequest('https://example.com/api/admin/session', {
			headers: {
				cookie: `${ADMIN_SESSION_COOKIE_NAME}=${buildAdminSessionCookieValue(payload)}`,
			},
		})

		const session = refreshAdminSessionFromRequest(request, issuedAt + 60_000)

		expect(session === null).toBe(false)
		expect(session?.didRefresh).toBe(false)
		expect(session?.cookieValue).toBe(null)
		expect(session?.expiresAt).toBe(new Date(payload.expiresAt).toISOString())
	})

	it('rotates the cookie only when the session is close to expiry', () => {
		const now = Date.now()
		const issuedAt =
			now - (ADMIN_IDLE_TIMEOUT_MINUTES * 60 * 1000 - 60_000)
		const payload = createAdminSessionPayload({
			uid: 'admin-uid',
			email: 'admin@example.com',
			role: 'admin',
			now: issuedAt,
		})
		const request = new NextRequest('https://example.com/api/admin/session', {
			headers: {
				cookie: `${ADMIN_SESSION_COOKIE_NAME}=${buildAdminSessionCookieValue(payload)}`,
			},
		})

		const session = refreshAdminSessionFromRequest(request, now)

		expect(session === null).toBe(false)
		expect(session?.didRefresh).toBe(true)
		expect(typeof session?.cookieValue).toBe('string')
		expect(Date.parse(session?.expiresAt ?? '')).toBeGreaterThan(payload.expiresAt)
	})
})
