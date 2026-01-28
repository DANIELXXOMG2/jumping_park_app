"use client";

import { Lock, ShieldAlert, WifiOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { canAccessAdmin, canAccessRoute } from "@/types/auth";

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

function UnauthorizedView() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-md">
				<div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<ShieldAlert className="w-8 h-8 text-destructive" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						Acceso Denegado
					</h1>
					<p className="text-foreground/60">
						No tienes permisos para acceder a esta sección. Contacta al
						administrador si crees que esto es un error.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push("/admin/login")}
					className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
				>
					Volver al Login
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE: RestrictedRouteView (Para rutas restringidas por rol)
// ============================================================================

function RestrictedRouteView() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-md">
				<div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
					<Lock className="w-8 h-8 text-yellow-600" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						Sección Restringida
					</h1>
					<p className="text-foreground/60">
						Tu rol no tiene acceso a esta sección. Solo puedes acceder al Dashboard.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push("/admin")}
					className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
				>
					Ir al Dashboard
				</button>
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

export function AdminGuard({ children }: AdminGuardProps) {
	const { user, isLoading, role } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const isOnline = useOnlineStatus();

	// Obtener rol cacheado directamente de sessionStorage (sin estado React)
	const getCachedRole = (): UserRole | null => {
		if (typeof window === "undefined") return null;
		try {
			const cached = sessionStorage.getItem("jp_user_role");
			return cached as UserRole | null;
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
	
	// Determinar el rol efectivo (online: del contexto, offline: del cache)
	const effectiveRole = isOnline ? role : (cachedRole || role);

	useEffect(() => {
		if (isLoading) return;

		// Si no hay usuario, redirigir a login
		if (!user) {
			router.replace("/admin/login");
			return;
		}
	}, [user, isLoading, router]);

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

	// Verificar acceso al panel admin
	const hasAdminAccess = effectiveRole && canAccessAdmin(effectiveRole);
	
	if (!hasAdminAccess) {
		return <UnauthorizedView />;
	}

	// Verificar acceso a la ruta específica según el rol
	const canAccessCurrentRoute = effectiveRole && canAccessRoute(effectiveRole, pathname);
	
	if (!canAccessCurrentRoute) {
		return <RestrictedRouteView />;
	}

	return (
		<>
			{children}
			{/* Indicador de Modo Offline */}
			{!isOnline && <OfflineBadge />}
		</>
	);
}
