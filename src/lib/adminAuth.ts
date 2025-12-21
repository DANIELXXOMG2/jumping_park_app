import { type NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebaseAdmin";
import { AVAILABLE_PERMISSIONS } from "@/types/auth";

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Email del Super Admin que siempre tiene acceso total al sistema.
 * Este usuario puede realizar cualquier acción sin restricciones.
 */
const SUPER_ADMIN_EMAIL = "jumpingadmin@gmail.com";

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuthResult {
	success: true;
	uid: string;
	email: string;
	isSuperAdmin: boolean;
}

export interface AuthError {
	success: false;
	response: NextResponse;
}

// ============================================================================
// FUNCIONES DE SUPER ADMIN
// ============================================================================

/**
 * Verifica si un email corresponde al Super Admin del sistema.
 * El Super Admin tiene acceso total sin restricciones.
 *
 * @param email - Email a verificar
 * @returns true si es el Super Admin
 */
export function isSuperAdmin(email: string): boolean {
	return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Verifica si el usuario actual tiene un permiso específico.
 * El Super Admin siempre retorna true para cualquier permiso.
 *
 * @param email - Email del usuario
 * @param permission - Permiso a verificar
 * @param userPermissions - Permisos del usuario desde Firestore
 * @returns true si tiene el permiso o es Super Admin
 */
export function hasPermissionOrSuperAdmin(
	email: string,
	permission: string,
	userPermissions: string[] = []
): boolean {
	// Super Admin siempre tiene todos los permisos
	if (isSuperAdmin(email)) {
		return true;
	}

	return userPermissions.includes(permission);
}

// ============================================================================
// FUNCIONES DE PERMISOS DINÁMICOS
// ============================================================================

/**
 * Obtiene los permisos efectivos de un usuario desde la base de datos.
 * Esta función lee los permisos del rol asignado al usuario desde Firestore.
 *
 * LÓGICA:
 * A. Si es Super Admin -> Devuelve TODOS los permisos
 * B. Si es otro usuario -> Busca su documento en `admin_users`
 * C. Toma el campo `role` y busca ese rol en la colección `roles`
 * D. Retorna `role.permissions` + `user.customPermissions`
 *
 * @param uid - UID del usuario
 * @param email - Email del usuario
 * @returns Array de permisos efectivos del usuario
 */
export async function getEffectivePermissionsFromDB(
	uid: string,
	email: string
): Promise<string[]> {
	// Super Admin siempre tiene todos los permisos
	if (isSuperAdmin(email)) {
		return [...AVAILABLE_PERMISSIONS];
	}

	try {
		// Buscar usuario en admin_users
		const userDoc = await db.collection("admin_users").doc(uid).get();

		if (!userDoc.exists) {
			console.log(`[PERMS] Usuario ${uid} no encontrado en admin_users`);
			return [];
		}

		const userData = userDoc.data();
		const userRole = userData?.role as string | undefined;
		const customPermissions = (userData?.customPermissions || []) as string[];

		if (!userRole) {
			console.log(`[PERMS] Usuario ${uid} sin rol asignado`);
			return customPermissions;
		}

		// Buscar permisos del rol en la colección roles
		const roleDoc = await db.collection("roles").doc(userRole).get();

		if (!roleDoc.exists) {
			console.log(`[PERMS] Rol '${userRole}' no encontrado en DB`);
			return customPermissions;
		}

		const roleData = roleDoc.data();
		const rolePermissions = (roleData?.permissions || []) as string[];

		// Combinar permisos del rol + permisos personalizados (sin duplicados)
		const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

		console.log(`[PERMS] Usuario ${uid} con rol '${userRole}': ${allPermissions.length} permisos`);

		return allPermissions;
	} catch (error) {
		console.error(`[PERMS] Error obteniendo permisos para ${uid}:`, error);
		return [];
	}
}

/**
 * Verifica si un usuario tiene un permiso específico, consultando la DB.
 *
 * @param uid - UID del usuario
 * @param email - Email del usuario
 * @param permission - Permiso a verificar
 * @returns true si tiene el permiso
 */
export async function hasPermissionFromDB(
	uid: string,
	email: string,
	permission: string
): Promise<boolean> {
	// Super Admin siempre tiene todos los permisos
	if (isSuperAdmin(email)) {
		return true;
	}

	const permissions = await getEffectivePermissionsFromDB(uid, email);
	return permissions.includes(permission);
}

export async function verifyAdminToken(
	request: NextRequest,
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
		const email = decodedToken.email || "";
		const superAdmin = isSuperAdmin(email);

		// Super Admin siempre tiene acceso
		if (superAdmin) {
			console.log(`[AUTH] Super Admin ${email} autenticado`);
			return {
				success: true,
				uid: decodedToken.uid,
				email,
				isSuperAdmin: true,
			};
		}

		// Si el token tiene el claim admin, usar eso directamente
		if (decodedToken.admin === true) {
			console.log(`[AUTH] Usuario ${decodedToken.uid} autenticado via custom claims`);
			return {
				success: true,
				uid: decodedToken.uid,
				email,
				isSuperAdmin: false,
			};
		}

		// Si no hay custom claim, buscar en admin_users para verificar si es staff
		console.log(`[AUTH] Token sin claim admin para ${decodedToken.uid}. Buscando en admin_users...`);
		try {
			const adminUserDoc = await db.collection("admin_users").doc(decodedToken.uid).get();

			if (adminUserDoc.exists) {
				const userData = adminUserDoc.data();
				const userRole = userData?.role;

				// Si existe en admin_users con rol válido, es staff autorizado
				if (userRole === "admin" || userRole === "cashier") {
					console.log(`[AUTH] Usuario ${decodedToken.uid} encontrado en admin_users con rol: ${userRole}`);

					// Actualizar custom claims para futuras peticiones
					try {
						await admin.auth().setCustomUserClaims(decodedToken.uid, {
							admin: true,
							role: userRole,
						});
						console.log(`[AUTH] Custom claims actualizados para ${decodedToken.uid}`);
					} catch (claimError) {
						console.warn(`[AUTH] No se pudieron actualizar claims para ${decodedToken.uid}:`, claimError);
					}

					return {
						success: true,
						uid: decodedToken.uid,
						email: decodedToken.email || "",
						isSuperAdmin: false,
					};
				}
			}

			console.log(`[AUTH] Usuario ${decodedToken.uid} no encontrado en admin_users o sin rol válido`);
		} catch (dbError) {
			console.error(`[AUTH] Error consultando admin_users para ${decodedToken.uid}:`, dbError);
		}

		return {
			success: false,
			response: NextResponse.json(
				{ error: "No tienes permisos de administrador" },
				{ status: 403 },
			),
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
