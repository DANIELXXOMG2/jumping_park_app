/**
 * ============================================================================
 * TIPOS DE AUTENTICACIÓN Y ROLES - RBAC (Custom Claims)
 * ============================================================================
 *
 * Control de Acceso Basado en Roles (RBAC) para Jumping Park.
 * 
 * IMPORTANTE: Los roles se almacenan en Firebase Custom Claims, NO en Firestore.
 * Esto sigue la mejor práctica recomendada por Firebase:
 * - Los claims viajan en el token JWT
 * - Se validan tanto en frontend como en backend
 * - Se pueden verificar en Firestore Security Rules
 *
 * Roles disponibles:
 * - admin: Acceso completo al panel de administración (todas las secciones)
 * - trabajador: Acceso limitado (solo Dashboard)
 * - visitor: Usuario final del kiosco (solo puede firmar consentimientos)
 *
 * Modelo de permisos: ADITIVO
 * - Los permisos del rol base + customPermissions del usuario
 */

/**
 * Roles de usuario disponibles en el sistema.
 * Se almacenan como Custom Claims en Firebase Auth.
 */
export type UserRole = "admin" | "trabajador" | "visitor";

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
 * Admin tiene acceso total, trabajador solo a dashboard.
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
	trabajador: [
		"dashboard:view",
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
export const ADMIN_ROLES: UserRole[] = ["admin", "trabajador"];

/**
 * Verifica si un rol puede acceder al panel admin.
 */
export function canAccessAdmin(role: UserRole): boolean {
	return ADMIN_ROLES.includes(role);
}

/**
 * Rutas del panel admin y los roles que pueden acceder a cada una.
 * Esto se usa para validar el acceso en el frontend (AdminGuard).
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
	"/admin": ["admin", "trabajador"], // Dashboard - todos
	"/admin/estadisticas": ["admin"],
	"/admin/usuarios": ["admin"],
	"/admin/consentimientos": ["admin"],
	"/admin/menores": ["admin"],
	"/admin/configuracion": ["admin"],
};

/**
 * Verifica si un rol puede acceder a una ruta específica.
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
	// Admin tiene acceso total
	if (role === "admin") return true;
	
	// Buscar la ruta más específica que coincida
	const sortedRoutes = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length);
	
	for (const route of sortedRoutes) {
		if (pathname === route || pathname.startsWith(route + "/")) {
			return ROUTE_ACCESS[route].includes(role);
		}
	}
	
	// Por defecto, roles no-admin no pueden acceder a rutas no especificadas
	return false;
}

/**
 * Estructura de Custom Claims para Firebase Auth.
 * Los claims se establecen via Admin SDK y viajan en el token JWT.
 */
export interface CustomClaims {
	role?: UserRole;
	/** @deprecated Usar 'role' en su lugar. Se mantiene por compatibilidad. */
	admin?: boolean;
}

/**
 * Obtiene el rol desde los custom claims del token.
 */
export function getRoleFromClaims(claims: CustomClaims): UserRole | null {
	// Primero verificar el nuevo campo 'role'
	if (claims.role && ADMIN_ROLES.includes(claims.role)) {
		return claims.role;
	}
	
	// Compatibilidad con sistema anterior (admin claim boolean)
	if (claims.admin === true) {
		return "admin";
	}
	
	return null;
}
