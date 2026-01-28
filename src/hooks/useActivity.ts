"use client";

import useSWR from "swr";
import { adminGet } from "@/lib/adminApi";

// ============================================================================
// TIPOS
// ============================================================================

export interface ActivityStats {
	consentsToday: number;
	minorsToday: number;
	timestamp: string;
}

export interface LatestConsent {
	id: string;
	consecutivo: number;
	adultName: string;
	minorsCount: number;
	signedAt: string | null;
}

export interface HourlyDataPoint {
	hour: number;
	label: string;
	count: number;
}

export interface ActivityData {
	stats: ActivityStats;
	latestConsents: LatestConsent[];
	hourlyData: HourlyDataPoint[];
}

// ============================================================================
// HOOK: useActivity
// ============================================================================

/**
 * Hook para obtener la actividad del día con caché SWR.
 * 
 * Optimizado para reducir lecturas de Firestore:
 * - Refresco automático cada 5 minutos (no 30 segundos)
 * - Sin revalidación al cambiar de pestaña
 * - Deduplicación de 60 segundos
 * 
 * @returns Datos de actividad, estado de carga y función de refresco manual
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isValidating, mutate } = useActivity();
 * 
 * // Refrescar manualmente
 * <button onClick={() => mutate()}>Actualizar</button>
 * ```
 */
export function useActivity() {
	const { data, error, isLoading, isValidating, mutate } = useSWR<ActivityData>(
		"admin/activity",
		() => adminGet<ActivityData>("/api/admin/activity"),
		{
			// ⚡ Optimizaciones de costo
			revalidateOnFocus: false, // No recargar al cambiar de pestaña
			revalidateOnReconnect: true, // Sí recargar al reconectarse a internet
			dedupingInterval: 60000, // 1 minuto de deduplicación
			refreshInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos (no 30s!)
			
			// 📦 UX
			keepPreviousData: true, // Mantener datos mientras revalida
			errorRetryCount: 3, // Reintentar 3 veces en error
		}
	);

	return {
		data,
		error,
		isLoading,
		isValidating, // true cuando está refrescando en segundo plano
		mutate, // Para refresh manual
	};
}

export type { ActivityData as UseActivityData };
