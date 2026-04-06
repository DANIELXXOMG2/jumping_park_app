import {
	buildAdminSessionCookieValue,
	createAdminSessionPayload,
	readAdminSessionFromRequest,
} from '@/lib/adminAuth'
import { ApiError } from '@/lib/apiHandler'
import { adminAuth } from '@/lib/firebaseAdmin'
import type { CustomClaims, UserRole } from '@/types/auth'
import { canAccessAdmin, getRoleFromClaims } from '@/types/auth'

const ADMIN_SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000

interface DecodedAdminIdToken {
	uid: string
	email?: string | null
	[key: string]: unknown
}

type AdminIdTokenVerifier = (
	idToken: string,
) => Promise<DecodedAdminIdToken>

function isFirebaseAdminConfigurationError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false
	}

	const message = error.message.toLowerCase()
	const maybeErrorWithCode = error as Error & { code?: string }
	const code =
		typeof maybeErrorWithCode.code === 'string'
			? maybeErrorWithCode.code.toLowerCase()
			: ''

	return (
		code.includes('invalid-credential') ||
		code.includes('invalid-app-options') ||
		code.includes('no-app') ||
		message.includes('credential') ||
		message.includes('service account') ||
		message.includes('initializeapp') ||
		message.includes('project id')
	)
}

export interface AdminSessionExchangeResult {
	role: UserRole
	expiresAt: string
	cookieValue: string
}

export interface AdminSessionRefreshResult {
	role: UserRole
	expiresAt: string
	cookieValue: string | null
	didRefresh: boolean
}

export async function exchangeAdminSessionFromIdToken(
	idToken: string,
	verifyIdToken: AdminIdTokenVerifier = (token) =>
		adminAuth.verifyIdToken(token) as Promise<DecodedAdminIdToken>,
): Promise<AdminSessionExchangeResult> {
	try {
		const decodedToken = await verifyIdToken(idToken)
		const claims = decodedToken as unknown as CustomClaims
		const role = getRoleFromClaims(claims)

		if (!role || !canAccessAdmin(role)) {
			throw new ApiError(
				'No tienes permisos para acceder al panel de administracion',
				403,
			)
		}

		const payload = createAdminSessionPayload({
			uid: decodedToken.uid,
			email: decodedToken.email ?? '',
			role,
		})

		return {
			role,
			expiresAt: new Date(payload.expiresAt).toISOString(),
			cookieValue: buildAdminSessionCookieValue(payload),
		}
	} catch (error) {
		if (error instanceof ApiError) {
			throw error
		}

		if (
			error instanceof Error &&
			error.message.includes('ADMIN_JWT_SECRET is required')
		) {
			console.error('[AdminSessionService] Missing ADMIN_JWT_SECRET')
			throw new ApiError(
				'Configuracion de sesion de administrador incompleta',
				500,
				'ADMIN_SESSION_CONFIG_ERROR',
			)
		}

		if (isFirebaseAdminConfigurationError(error)) {
			console.error('[AdminSessionService] Firebase Admin misconfiguration', error)
			throw new ApiError(
				'Configuracion de Firebase Admin invalida',
				500,
				'FIREBASE_ADMIN_CONFIG_ERROR',
			)
		}

		if (error instanceof Error && error.message.includes('expired')) {
			throw new ApiError('Token expirado. Inicia sesion nuevamente.', 401, 'TOKEN_EXPIRED')
		}

		if (
			error instanceof Error &&
			(error.message.toLowerCase().includes('invalid') ||
				error.message.toLowerCase().includes('malformed'))
		) {
			throw new ApiError(
				'Token invalido. Inicia sesion nuevamente.',
				401,
				'TOKEN_INVALID',
			)
		}

		throw new ApiError(
			'No se pudo crear la sesion de administrador',
			401,
			'ADMIN_SESSION_EXCHANGE_FAILED',
		)
	}
}

export function refreshAdminSessionFromRequest(
	request: Request,
	now = Date.now(),
): AdminSessionRefreshResult | null {
	const session = readAdminSessionFromRequest(request as never)

	if (!session) {
		return null
	}

	if (session.expiresAt - now > ADMIN_SESSION_REFRESH_THRESHOLD_MS) {
		return {
			role: session.role,
			expiresAt: new Date(session.expiresAt).toISOString(),
			cookieValue: null,
			didRefresh: false,
		}
	}

	const refreshedPayload = createAdminSessionPayload({
		uid: session.uid,
		email: session.email,
		role: session.role,
	})

	return {
		role: refreshedPayload.role,
		expiresAt: new Date(refreshedPayload.expiresAt).toISOString(),
		cookieValue: buildAdminSessionCookieValue(refreshedPayload),
		didRefresh: true,
	}
}
