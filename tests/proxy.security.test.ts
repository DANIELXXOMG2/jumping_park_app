import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'bun:test'
import { NextRequest } from 'next/server'

process.env.ADMIN_JWT_SECRET = 'test-admin-session-secret'

const { proxy } = await import('@/proxy')
const { ADMIN_SESSION_COOKIE_NAME } = await import('@/lib/adminSessionEdge')

type AdminSessionRole = 'admin' | 'worker'

interface AdminSessionPayload {
	uid: string
	email: string
	role: AdminSessionRole
	issuedAt: number
	expiresAt: number
}

function buildAdminSessionCookieValue(payload: AdminSessionPayload): string {
	const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
	const signature = createHmac(
		'sha256',
		process.env.ADMIN_JWT_SECRET ?? '',
	)
		.update(encodedPayload)
		.digest('base64url')

	return `${encodedPayload}.${signature}`
}

function createRequest(pathname: string, cookieValue?: string): NextRequest {
	return new NextRequest(`https://example.com${pathname}`, {
		headers: cookieValue
			? {
				cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookieValue}`,
			}
			: undefined,
	})
}

describe('admin perimeter hardening', () => {
	it('redirects protected admin routes without a valid cookie', async () => {
		const response = await proxy(createRequest('/admin/dashboard'))

		expect(response.status).toBe(307)
		expect(response.headers.get('location') ?? '').toContain(
			'/admin/login?redirect=%2Fadmin%2Fdashboard&reason=session-required',
		)
	})

	it('invalidates expired admin session cookies', async () => {
		const now = Date.now()
		const expiredCookie = buildAdminSessionCookieValue({
			uid: 'worker-1',
			email: 'worker@example.com',
			role: 'worker',
			issuedAt: now - 60_000,
			expiresAt: now - 1_000,
		})

		const response = await proxy(
			createRequest('/admin/dashboard', expiredCookie),
		)

		expect(response.status).toBe(307)
		expect(response.headers.get('location') ?? '').toContain('/admin/login')
		expect(response.headers.get('set-cookie') ?? '').toContain(
			`${ADMIN_SESSION_COOKIE_NAME}=`,
		)
		expect(response.headers.get('set-cookie') ?? '').toContain('Max-Age=0')
	})

	it('adds perimeter security headers to responses', async () => {
		const response = await proxy(createRequest('/ingreso'))

		expect(response.headers.get('Content-Security-Policy') ?? '').toContain(
			"default-src 'self'",
		)
		expect(response.headers.get('X-Frame-Options')).toBe('DENY')
		expect(response.headers.get('Strict-Transport-Security') ?? '').toContain(
			'max-age=31536000',
		)
	})
})
