"use client";

import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useOfflineConnection, useRecentRegistrations } from "@/hooks/useOfflineData";
import { cn } from "@/lib/utils";

/**
 * Estado de conexión para el UI.
 */
type NetworkState = "online" | "offline" | "syncing";

/**
 * Props para el componente NetworkStatus.
 */
interface NetworkStatusProps {
	/** Mostrar versión compacta (solo icono) */
	compact?: boolean;
	/** Clases CSS adicionales */
	className?: string;
}

/**
 * Componente que muestra el estado de conexión de red y sincronización con Firestore.
 * 
 * Estados visuales:
 * - **Online**: Invisible o punto verde sutil (todo funcionando correctamente)
 * - **Offline**: Badge amarillo/naranja visible indicando "Modo Offline"
 * - **Syncing**: Indicador de "Sincronizando..." cuando hay escrituras pendientes
 * 
 * @example
 * ```tsx
 * // En el Header
 * <NetworkStatus />
 * 
 * // Versión compacta para espacios reducidos
 * <NetworkStatus compact />
 * ```
 */
export function NetworkStatus({ compact = false, className }: NetworkStatusProps) {
	const { isOnline, isFirestoreConnected } = useOfflineConnection();
	const { fromCache, hasPendingWrites, loading } = useRecentRegistrations(3);

	// Determinar el estado de la red
	const getNetworkState = (): NetworkState => {
		// Durante la carga inicial, asumir online para evitar parpadeo
		if (loading) return "online";
		if (hasPendingWrites) return "syncing";
		if (!isOnline || !isFirestoreConnected || fromCache) return "offline";
		return "online";
	};

	const networkState = getNetworkState();

	// Si está online y no hay nada pendiente, mostrar indicador sutil o nada
	if (networkState === "online") {
		if (compact) {
			return (
				<div
					className={cn(
						"flex items-center justify-center w-2 h-2 rounded-full bg-success",
						className
					)}
					title="Conectado"
					aria-label="Estado: Conectado"
				/>
			);
		}
		// En modo no compacto, ser invisible cuando está online
		return null;
	}

	// Estado: Sincronizando
	if (networkState === "syncing") {
		return (
			<div
				className={cn(
					"flex items-center gap-1.5 px-2.5 py-1 rounded-full",
					"bg-blue-500/10 text-blue-600 dark:text-blue-400",
					"text-xs font-medium animate-pulse",
					className
				)}
				title="Sincronizando datos con el servidor"
				aria-label="Estado: Sincronizando"
				role="status"
			>
				<RefreshCw className="w-3.5 h-3.5 animate-spin" />
				{!compact && <span>Sincronizando...</span>}
			</div>
		);
	}

	// Estado: Offline
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 px-2.5 py-1 rounded-full",
				"bg-warning/10 text-warning",
				"text-xs font-medium",
				className
			)}
			title={
				fromCache
					? "Mostrando datos almacenados localmente"
					: "Sin conexión a internet"
			}
			aria-label="Estado: Modo Offline"
			role="status"
		>
			{isOnline ? (
				<CloudOff className="w-3.5 h-3.5" />
			) : (
				<WifiOff className="w-3.5 h-3.5" />
			)}
			{!compact && <span>Modo Offline</span>}
		</div>
	);
}

/**
 * Hook para obtener información del estado de red para otros componentes.
 * Versión ligera que solo usa navigator.onLine.
 */
export function useNetworkStatus() {
	const { isOnline, isFirestoreConnected } = useOfflineConnection();

	const isOffline = !isOnline || !isFirestoreConnected;

	return {
		isOnline,
		isFirestoreConnected,
		isOffline,
	};
}

/**
 * Badge pequeño para indicar que los datos vienen de caché.
 * Útil para colocar junto a tablas o listas de datos.
 */
export function CacheBadge({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
				"bg-warning/10 text-warning font-medium",
				className
			)}
			title="Estos datos podrían no estar actualizados"
		>
			<CloudOff className="w-3 h-3" />
			Caché
		</span>
	);
}

/**
 * Banner de advertencia para mostrar cuando los datos vienen de caché.
 */
export function CacheWarningBanner({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex items-center gap-2 px-3 py-2 rounded-lg",
				"bg-warning/10 border border-warning/20",
				"text-sm text-warning",
				className
			)}
			role="alert"
		>
			<CloudOff className="w-4 h-4 shrink-0" />
			<p>
				<strong>Datos locales:</strong> Esta información podría no estar
				actualizada. Se sincronizará automáticamente cuando vuelva la conexión.
			</p>
		</div>
	);
}
