import { describe, expect, it } from 'bun:test'
import { ApiError } from '@/lib/apiHandler'
import { exchangeAdminSessionFromIdToken } from '@/services/adminSessionService'

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
})
