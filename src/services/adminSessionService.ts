import {
	buildAdminSessionCookieValue,
	createAdminSessionPayload,
	readAdminSessionFromRequest,
} from '@/lib/adminAuth'
import { ApiError } from '@/lib/apiHandler'
import { adminAuth } from '@/lib/firebaseAdmin'
import type { CustomClaims, UserRole } from '@/types/auth'
import { canAccessAdmin, getRoleFromClaims } from '@/types/auth'

export interface AdminSessionExchangeResult {
	role: UserRole
	expiresAt: string
	cookieValue: string
}

export async function exchangeAdminSessionFromIdToken(
	idToken: string,
): Promise<AdminSessionExchangeResult> {
	try {
		const decodedToken = await adminAuth.verifyIdToken(idToken)
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

		if (error instanceof Error && error.message.includes('expired')) {
			throw new ApiError('Token expirado. Inicia sesion nuevamente.', 401)
		}

		throw new ApiError('No se pudo crear la sesion de administrador', 401)
	}
}

export function refreshAdminSessionFromRequest(request: Request): AdminSessionExchangeResult | null {
	const session = readAdminSessionFromRequest(request as never)

	if (!session) {
		return null
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
	}
}
