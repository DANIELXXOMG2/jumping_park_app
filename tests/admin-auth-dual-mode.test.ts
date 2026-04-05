import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'

process.env.ADMIN_JWT_SECRET = 'test-admin-session-secret'
process.env.ADMIN_SESSION_MODE = 'dual'

const { verifyAdminToken } = await import('@/lib/adminAuth')

describe('admin auth dual mode', () => {
	it('accepts bearer fallback when cookie session is absent', async () => {
		const request = new NextRequest('https://example.com/api/admin/roles', {
			headers: {
				Authorization: 'Bearer valid-token',
			},
		})
		const verifyToken = async () => ({
			uid: 'admin-uid',
			email: 'admin@example.com',
			exp: Math.floor(Date.now() / 1000) + 3600,
			role: 'admin',
			admin: true,
		})

		const result = await verifyAdminToken(request, undefined, verifyToken)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.role).toBe('admin')
			expect(result.transport).toBe('bearer')
		}
	})
})
