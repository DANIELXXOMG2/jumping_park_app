import { type NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";
import type { UserRole, CustomClaims, Permission } from "@/types/auth";
import { ADMIN_ROLES, canAccessAdmin, getRoleFromClaims, hasPermission } from "@/types/auth";

export interface AuthResult {
	success: true;
	uid: string;
	email: string;
	role: UserRole;
}

export interface AuthError {
	success: false;
	response: NextResponse;
}

/**
 * Verifica el token de autenticación y extrae el rol desde Custom Claims.
 * Esta es la función principal para proteger endpoints de API.
 * 
 * @param request - Request de Next.js
 * @param requiredRole - Rol mínimo requerido (opcional, por defecto cualquier rol admin)
 */
export async function verifyAdminToken(
	request: NextRequest,
	requiredRole?: UserRole,
): Promise<AuthResult | AuthError> {
	try {
		const authHeader = request.headers.get("Authorization");

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return {
				success: false,
				response: NextResponse.json(
					{ error: "Token de autenticación requerido" },
					{ status: 401 },
				),
			};
		}

		const token = authHeader.split("Bearer ")[1];

		if (!token) {
			return {
				success: false,
				response: NextResponse.json(
					{ error: "Token de autenticación inválido" },
					{ status: 401 },
				),
			};
		}

		const decodedToken = await admin.auth().verifyIdToken(token);
		const claims = decodedToken as unknown as CustomClaims;
		
		// Obtener rol desde custom claims
		const role = getRoleFromClaims(claims);
		
		if (!role || !canAccessAdmin(role)) {
			return {
				success: false,
				response: NextResponse.json(
					{ error: "No tienes permisos para acceder al panel de administración" },
					{ status: 403 },
				),
			};
		}

		// Si se requiere un rol específico, verificar
		if (requiredRole && requiredRole !== role && role !== "admin") {
			return {
				success: false,
				response: NextResponse.json(
					{ error: `Se requiere rol '${requiredRole}' para esta acción` },
					{ status: 403 },
				),
			};
		}

		return {
			success: true,
			uid: decodedToken.uid,
			email: decodedToken.email || "",
			role,
		};
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("expired")) {
				return {
					success: false,
					response: NextResponse.json(
						{ error: "Token expirado. Inicia sesión nuevamente." },
						{ status: 401 },
					),
				};
			}
		}

		return {
			success: false,
			response: NextResponse.json(
				{ error: "Error de autenticación" },
				{ status: 401 },
			),
		};
	}
}

/**
 * Verifica que el usuario tenga rol de admin completo.
 * Usar para endpoints que requieren permisos totales.
 */
export async function verifyFullAdminToken(
	request: NextRequest,
): Promise<AuthResult | AuthError> {
	return verifyAdminToken(request, "admin");
}

/**
 * Verifica el token y un permiso específico.
 * Usar para endpoints que requieren permisos granulares.
 * 
 * @param request - Request de Next.js
 * @param permission - Permiso requerido (ej: "minors:view", "users:edit")
 * @returns AuthResult si tiene permiso, AuthError si no
 * 
 * @example
 * const authResult = await verifyAdminTokenWithPermission(request, "minors:view");
 * if (!authResult.success) return authResult.response;
 */
export async function verifyAdminTokenWithPermission(
	request: NextRequest,
	permission: Permission,
): Promise<AuthResult | AuthError> {
	// Primero verificar autenticación básica
	const authResult = await verifyAdminToken(request);
	if (!authResult.success) {
		return authResult;
	}

	// Verificar permiso específico
	if (!hasPermission(authResult.role, permission)) {
		return {
			success: false,
			response: NextResponse.json(
				{ error: `No tienes permiso para esta acción (requiere: ${permission})` },
				{ status: 403 },
			),
		};
	}

	return authResult;
}

/**
 * Verifica el token y múltiples permisos (debe tener al menos uno).
 * Usar cuando una acción puede ser realizada por diferentes permisos.
 * 
 * @param request - Request de Next.js
 * @param permissions - Array de permisos, debe tener al menos uno
 * @returns AuthResult si tiene algún permiso, AuthError si no tiene ninguno
 */
export async function verifyAdminTokenWithAnyPermission(
	request: NextRequest,
	permissions: Permission[],
): Promise<AuthResult | AuthError> {
	const authResult = await verifyAdminToken(request);
	if (!authResult.success) {
		return authResult;
	}

	// Verificar si tiene al menos uno de los permisos
	const hasAnyPermission = permissions.some((p) => hasPermission(authResult.role, p));
	
	if (!hasAnyPermission) {
		return {
			success: false,
			response: NextResponse.json(
				{ error: `No tienes permisos para esta acción (requiere uno de: ${permissions.join(", ")})` },
				{ status: 403 },
			),
		};
	}

	return authResult;
}
