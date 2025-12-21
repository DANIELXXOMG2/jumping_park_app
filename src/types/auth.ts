/**
 * ============================================================================
 * TIPOS DE AUTENTICACIÓN Y ROLES - RBAC
 * ============================================================================
 *
 * Control de Acceso Basado en Roles (RBAC) para Jumping Park.
 *
 * Roles disponibles:
 * - admin: Acceso completo al panel de administración
 * - cashier: Acceso limitado (ver reportes, gestionar ingresos)
 * - visitor: Usuario final del kiosco (solo puede firmar consentimientos)
 *
 * Modelo de permisos: ADITIVO
 * - Los permisos del rol base + customPermissions del usuario
 */

/**
 * Roles de usuario disponibles en el sistema.
 */
export type UserRole = "admin" | "cashier" | "visitor";

/**
 * Tipo literal de todos los permisos disponibles en el sistema.
 */
export type Permission =
	// Dashboard
	| "dashboard:view"
	// Usuarios
	| "users:view"
	| "users:create"
	| "users:edit"
	| "users:delete"
	// Consentimientos
	| "consents:view"
	| "consents:export"
	// Menores
	| "minors:view"
	| "minors:edit"
	// Estadísticas
	| "statistics:view"
	// Configuración
	| "settings:manage"
	// Roles y permisos
	| "roles:manage"
	// Kiosco
	| "kiosk:access"
	| "consent:sign";

/**
 * Todos los permisos disponibles agrupados por módulo/recurso.
 * Útil para construir interfaces de asignación de permisos.
 */
export const ALL_PERMISSIONS = {
	Dashboard: ["dashboard:view"] as const,
	Usuarios: ["users:view", "users:create", "users:edit", "users:delete"] as const,
	Consentimientos: ["consents:view", "consents:export"] as const,
	Menores: ["minors:view", "minors:edit"] as const,
	Estadísticas: ["statistics:view"] as const,
	Configuración: ["settings:manage"] as const,
	Roles: ["roles:manage"] as const,
	Kiosco: ["kiosk:access", "consent:sign"] as const,
} as const;

/**
 * Lista plana de todos los permisos (para validaciones).
 */
export const AVAILABLE_PERMISSIONS: Permission[] = Object.values(ALL_PERMISSIONS).flat() as Permission[];

/**
 * Información del usuario autenticado con su rol.
 */
export interface AuthenticatedUser {
	uid: string;
	email: string;
	displayName?: string;
	photoURL?: string;
	role: UserRole;
	/** Permisos adicionales asignados al usuario (modelo aditivo) */
	customPermissions?: Permission[];
}

/**
 * Resultado de verificación de autenticación.
 */
export interface AuthVerificationResult {
	isAuthenticated: boolean;
	user?: AuthenticatedUser;
	error?: string;
}

/**
 * Permisos por rol para diferentes acciones.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	admin: [
		"dashboard:view",
		"users:view",
		"users:create",
		"users:edit",
		"users:delete",
		"consents:view",
		"consents:export",
		"minors:view",
		"minors:edit",
		"statistics:view",
		"settings:manage",
		"roles:manage",
	],
	cashier: [
		"dashboard:view",
		"users:view",
		"consents:view",
		"minors:view",
		"statistics:view",
	],
	visitor: ["kiosk:access", "consent:sign"],
};

/**
 * Verifica si un rol (y opcionalmente permisos extra) tiene un permiso específico.
 * Modelo ADITIVO: el permiso es válido si está en el rol base O en los permisos extra.
 *
 * @param role - Rol base del usuario
 * @param permission - Permiso a verificar
 * @param userPermissions - Permisos adicionales del usuario (opcional)
 * @returns true si el usuario tiene el permiso
 */
export function hasPermission(
	role: UserRole,
	permission: Permission | string,
	userPermissions?: string[]
): boolean {
	// Verificar en permisos del rol base
	const hasRolePermission = ROLE_PERMISSIONS[role]?.includes(permission as Permission) ?? false;

	// Si tiene el permiso por rol, retornar true
	if (hasRolePermission) {
		return true;
	}

	// Modelo aditivo: verificar también en permisos extra del usuario
	if (userPermissions?.length) {
		return userPermissions.includes(permission);
	}

	return false;
}

/**
 * Obtiene todos los permisos efectivos de un usuario (rol + custom).
 *
 * @param role - Rol base del usuario
 * @param customPermissions - Permisos adicionales del usuario
 * @returns Array de permisos únicos
 */
export function getEffectivePermissions(
	role: UserRole,
	customPermissions?: string[]
): Permission[] {
	const rolePerms = ROLE_PERMISSIONS[role] ?? [];
	const customPerms = (customPermissions ?? []).filter(
		(p): p is Permission => AVAILABLE_PERMISSIONS.includes(p as Permission)
	);

	// Combinar y eliminar duplicados
	return [...new Set([...rolePerms, ...customPerms])];
}

/**
 * Roles que tienen acceso al panel de administración.
 */
export const ADMIN_ROLES: UserRole[] = ["admin", "cashier"];

/**
 * Verifica si un rol puede acceder al panel admin.
 */
export function canAccessAdmin(role: UserRole): boolean {
	return ADMIN_ROLES.includes(role);
}
