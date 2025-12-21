"use client";

import { ShieldAlert, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdmin } from "@/types/auth";
import type { Permission } from "@/types/auth";

// ============================================================================
// MAPEO DE RUTAS A PERMISOS
// ============================================================================

/**
 * Mapeo de rutas del panel admin a permisos requeridos.
 * Si una ruta no está en este mapeo, solo se verifica que el usuario
 * pueda acceder al panel admin (canAccessAdmin).
 */
const ROUTE_PERMISSIONS: Record<string, Permission> = {
	"/admin": "dashboard:view",
	"/admin/estadisticas": "statistics:view",
	"/admin/usuarios": "users:view",
	"/admin/consentimientos": "consents:view",
	"/admin/menores": "minors:view",
	"/admin/configuracion": "settings:manage",
};

/**
 * Obtiene el permiso requerido para una ruta dada.
 * Soporta rutas exactas y rutas con prefijo (ej: /admin/usuarios/123).
 */
function getRequiredPermission(pathname: string): Permission | null {
	// Primero buscar coincidencia exacta
	if (ROUTE_PERMISSIONS[pathname]) {
		return ROUTE_PERMISSIONS[pathname];
	}

	// Buscar coincidencia por prefijo (para rutas dinámicas como /admin/usuarios/[id])
	for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
		if (route !== "/admin" && pathname.startsWith(route)) {
			return permission;
		}
	}

	// La ruta base /admin requiere dashboard:view
	if (pathname === "/admin") {
		return "dashboard:view";
	}

	return null;
}

// ============================================================================
// HOOK: useOnlineStatus
// ============================================================================

/**
 * Hook para detectar estado de conexión a internet.
 * Usa useSyncExternalStore para evitar hydration mismatch.
 */
function useOnlineStatus(): boolean {
	const getSnapshot = () => {
		if (typeof window === "undefined") return true;
		return navigator.onLine;
	};

	const getServerSnapshot = () => true; // SSR siempre asume online

	const subscribe = (callback: () => void) => {
		window.addEventListener("online", callback);
		window.addEventListener("offline", callback);
		return () => {
			window.removeEventListener("online", callback);
			window.removeEventListener("offline", callback);
		};
	};

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================================================
// COMPONENTE: OfflineBadge
// ============================================================================

function OfflineBadge() {
	return (
		<div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-yellow-500/90 text-yellow-950 px-3 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
			<WifiOff className="w-4 h-4" />
			<span>Modo Offline</span>
		</div>
	);
}

// ============================================================================
// COMPONENTE: UnauthorizedView
// ============================================================================

interface UnauthorizedViewProps {
	/** Si es true, muestra mensaje de permiso denegado en lugar de acceso denegado */
	isPermissionDenied?: boolean;
	/** Nombre del recurso al que no tiene acceso */
	resourceName?: string;
}

function UnauthorizedView({ isPermissionDenied, resourceName }: UnauthorizedViewProps) {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-md">
				<div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<ShieldAlert className="w-8 h-8 text-destructive" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						{isPermissionDenied ? "Permiso Denegado" : "Acceso Denegado"}
					</h1>
					<p className="text-foreground/60">
						{isPermissionDenied
							? `No tienes permiso para acceder a ${resourceName || "esta sección"}. Contacta al administrador si necesitas acceso.`
							: "No tienes permisos para acceder a esta sección. Contacta al administrador si crees que esto es un error."}
					</p>
				</div>
				<div className="flex gap-3">
					{isPermissionDenied && (
						<button
							type="button"
							onClick={() => router.push("/admin")}
							className="px-6 py-2.5 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-muted transition-colors"
						>
							Ir al Dashboard
						</button>
					)}
					<button
						type="button"
						onClick={() => router.push("/admin/login")}
						className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
					>
						{isPermissionDenied ? "Cambiar cuenta" : "Volver al Login"}
					</button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE: AdminGuard
// ============================================================================

interface AdminGuardProps {
	children: React.ReactNode;
}

/**
 * Mapeo de permisos a nombres legibles para mostrar en mensajes de error.
 */
const PERMISSION_LABELS: Record<string, string> = {
	"dashboard:view": "el Dashboard",
	"statistics:view": "las Estadísticas",
	"users:view": "la sección de Usuarios",
	"consents:view": "los Consentimientos",
	"minors:view": "la sección de Acompañantes",
	"settings:manage": "la Configuración",
};

export function AdminGuard({ children }: AdminGuardProps) {
	const { user, isLoading, isAdmin, role, hasPermission } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const isOnline = useOnlineStatus();

	// Obtener el permiso requerido para la ruta actual
	const requiredPermission = useMemo(
		() => getRequiredPermission(pathname),
		[pathname]
	);

	// Verificar si el usuario tiene el permiso para la ruta actual
	const hasRoutePermission = useMemo(() => {
		if (!requiredPermission) return true; // Ruta sin permiso específico
		return hasPermission(requiredPermission);
	}, [requiredPermission, hasPermission]);

	// Obtener rol cacheado directamente de sessionStorage (sin estado React)
	const getCachedRole = (): string | null => {
		if (typeof window === "undefined") return null;
		try {
			return sessionStorage.getItem("jp_user_role");
		} catch {
			return null;
		}
	};

	// Guardar rol en sessionStorage cuando cambia (efecto sincronizado)
	useEffect(() => {
		if (role && isOnline) {
			try {
				sessionStorage.setItem("jp_user_role", role);
			} catch {
				// sessionStorage no disponible
			}
		}
	}, [role, isOnline]);

	// Obtener el rol cacheado para la lógica de acceso
	const cachedRole = getCachedRole();

	useEffect(() => {
		if (isLoading) return;

		// Si no hay usuario, redirigir a login
		if (!user) {
			router.replace("/admin/login");
			return;
		}

		// Si estamos offline y tenemos cache de rol válido, permitir acceso
		if (
			!isOnline &&
			cachedRole &&
			canAccessAdmin(cachedRole as "admin" | "cashier" | "visitor")
		) {
			return; // Permitir acceso con datos cacheados
		}

		// Si estamos online y no tiene acceso, mostrar vista de no autorizado
		if (isOnline && !isAdmin) {
			// No redirigir inmediatamente, mostrar vista de acceso denegado
			return;
		}

		// Si estamos offline sin cache y sin confirmación de admin, esperar
		// Firebase Auth cachea el token internamente, confiamos en él
	}, [user, isLoading, isAdmin, isOnline, cachedRole, router]);

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-foreground/60">Verificando acceso...</p>
				</div>
			</div>
		);
	}

	// Sin usuario
	if (!user) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-foreground/60">Redirigiendo...</p>
				</div>
			</div>
		);
	}

	// Determinar si permitir acceso basado en rol
	const cachedHasAccess = cachedRole
		? canAccessAdmin(cachedRole as "admin" | "cashier" | "visitor")
		: false;
	const allowAccess = isAdmin || (!isOnline && cachedHasAccess);

	// Si no tiene acceso al panel admin en general
	if (!allowAccess) {
		return <UnauthorizedView />;
	}

	// Si tiene acceso al panel pero no a esta ruta específica
	if (!hasRoutePermission) {
		const resourceLabel = requiredPermission
			? PERMISSION_LABELS[requiredPermission] || "esta sección"
			: "esta sección";
		return (
			<UnauthorizedView isPermissionDenied resourceName={resourceLabel} />
		);
	}

	return (
		<>
			{children}
			{/* Indicador de Modo Offline */}
			{!isOnline && <OfflineBadge />}
		</>
	);
}
