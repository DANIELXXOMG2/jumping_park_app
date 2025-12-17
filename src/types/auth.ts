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
 */

/**
 * Roles de usuario disponibles en el sistema.
 */
export type UserRole = 'admin' | 'cashier' | 'visitor';

/**
 * Información del usuario autenticado con su rol.
 */
export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
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
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard:view',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'consents:view',
    'consents:export',
    'minors:view',
    'minors:edit',
    'statistics:view',
    'settings:manage',
    'roles:manage',
  ],
  cashier: [
    'dashboard:view',
    'users:view',
    'consents:view',
    'minors:view',
    'statistics:view',
  ],
  visitor: [
    'kiosk:access',
    'consent:sign',
  ],
};

/**
 * Verifica si un rol tiene un permiso específico.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Roles que tienen acceso al panel de administración.
 */
export const ADMIN_ROLES: UserRole[] = ['admin', 'cashier'];

/**
 * Verifica si un rol puede acceder al panel admin.
 */
export function canAccessAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}
