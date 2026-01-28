"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { adminGet } from "@/lib/adminApi";
import type { UserProfile } from "@/types/firestore";

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Estado de conexión de red y Firestore.
 */
export interface ConnectionState {
	/** Si el navegador reporta conexión a internet */
	isOnline: boolean;
	/** Si Firestore está sincronizado con el servidor */
	isFirestoreConnected: boolean;
}

/**
 * Resultado del hook useRecentRegistrations.
 */
export interface RecentRegistrationsResult<T> {
	/** Datos de la consulta */
	data: T[];
	/** Estado de carga */
	loading: boolean;
	/** Error si ocurrió alguno */
	error: Error | null;
	/** Si los datos provienen de caché local */
	fromCache: boolean;
	/** Si hay escrituras pendientes de sincronizar */
	hasPendingWrites: boolean;
	/** Forzar recarga de datos */
	refresh: () => void;
}

// ============================================================================
// HOOK: useOfflineConnection
// ============================================================================

/**
 * Hook para monitorear el estado de conexión del navegador.
 * 
 * Implementación **totalmente pasiva** que no requiere escrituras en Firestore:
 * - Eventos `online`/`offline` del navegador (navigator.onLine)
 * - `isFirestoreConnected` se sincroniza con `isOnline` para simplificar
 * 
 * Nota: Para detección más precisa de conectividad con Firestore, los hooks
 * que suscriben a datos pueden usar `snapshot.metadata.fromCache`.
 * 
 * @returns Estado de conexión actual
 * 
 * @example
 * ```tsx
 * const { isOnline, isFirestoreConnected } = useOfflineConnection();
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useOfflineConnection(): ConnectionState {
	const [isOnline, setIsOnline] = useState<boolean>(() => {
		// SSR safe: asumir online si no hay window
		if (typeof window === "undefined") return true;
		return navigator.onLine;
	});

	// isFirestoreConnected se sincroniza con isOnline (enfoque pasivo)
	const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		return navigator.onLine;
	});

	useEffect(() => {
		// Solo ejecutar en cliente
		if (typeof window === "undefined") return;

		// Handlers para eventos de red del navegador
		const handleOnline = () => {
			setIsOnline(true);
			setIsFirestoreConnected(true);
		};

		const handleOffline = () => {
			setIsOnline(false);
			setIsFirestoreConnected(false);
		};

		// Suscribirse a eventos de red
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return { isOnline, isFirestoreConnected };
}

// ============================================================================
// HOOK: useRecentRegistrations
// ============================================================================

/**
 * API response type for recent registrations endpoint.
 */
interface RecentRegistrationsResponse {
	users: UserProfile[];
	fromCache?: boolean;
}

/**
 * Hook para obtener registros recientes de usuarios con caché SWR.
 * 
 * 🔥 OPTIMIZADO: Reemplazó onSnapshot (tiempo real) por SWR con fetch simple.
 * Impacto estimado: -15,000 lecturas/día
 * 
 * Estrategia:
 * - Fetch inicial + revalidación cada 5 minutos
 * - Sin revalidación al cambiar de pestaña
 * - Datos en caché mientras revalida
 * 
 * @param days - Número de días hacia atrás para filtrar (default: 3)
 * @returns Datos, estado de carga, flags de caché y función de refresh
 * 
 * @example
 * ```tsx
 * const { data, loading, fromCache, refresh } = useRecentRegistrations(3);
 * ```
 */
export function useRecentRegistrations(
	days = 3
): RecentRegistrationsResult<UserProfile> {
	const { isOnline } = useOfflineConnection();

	// Clave única basada en los días
	const swrKey = `admin/users/recent?days=${days}`;

	const { data, error, isLoading, mutate } = useSWR<RecentRegistrationsResponse>(
		swrKey,
		async () => {
			// Fetch via API en lugar de Firestore directo (aprovecha caché del servidor)
			const response = await adminGet<RecentRegistrationsResponse>(
				`/api/admin/users/recent?days=${days}`
			);
			return response;
		},
		{
			// ⚡ Optimizaciones de costo
			revalidateOnFocus: false, // NO recargar al cambiar de pestaña
			revalidateOnReconnect: true, // SÍ recargar al reconectarse
			dedupingInterval: 60000, // 1 minuto de deduplicación
			refreshInterval: 5 * 60 * 1000, // 5 minutos de refresco automático
			
			// 📦 UX
			keepPreviousData: true,
			errorRetryCount: 2,
		}
	);

	// Función de refresh manual
	const refresh = useCallback(() => {
		mutate();
	}, [mutate]);

	return {
		data: data?.users ?? [],
		loading: isLoading,
		error: error ?? null,
		fromCache: !isOnline, // Asumimos caché si está offline
		hasPendingWrites: false, // Ya no aplica con SWR
		refresh,
	};
}
