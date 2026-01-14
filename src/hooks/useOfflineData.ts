"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	collection,
	query,
	where,
	onSnapshot,
	type Unsubscribe,
	type QuerySnapshot,
	type DocumentData,
	Timestamp,
	orderBy,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseClient";
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
 * Hook para obtener registros recientes de usuarios con soporte offline.
 * 
 * Estrategia "Offline First":
 * - Si hay internet: trae los datos más recientes del servidor
 * - Si no hay internet: muestra los datos en caché sin error
 * - Siempre indica si los datos vienen de caché
 * 
 * @param days - Número de días hacia atrás para filtrar (default: 3)
 * @returns Datos, estado de carga, flags de caché y función de refresh
 * 
 * @example
 * ```tsx
 * const { data, loading, fromCache, hasPendingWrites } = useRecentRegistrations(3);
 * 
 * if (fromCache) {
 *   console.log("Mostrando datos de caché - podrían no estar actualizados");
 * }
 * ```
 */
export function useRecentRegistrations(
	days = 3
): RecentRegistrationsResult<UserProfile> {
	const [data, setData] = useState<UserProfile[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);
	const [fromCache, setFromCache] = useState<boolean>(false);
	const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const dataRef = useRef<UserProfile[]>([]);

	// Calcular fecha límite (hoy - days días)
	const dateThreshold = useMemo(() => {
		const date = new Date();
		date.setDate(date.getDate() - days);
		date.setHours(0, 0, 0, 0);
		return Timestamp.fromDate(date);
	}, [days]);

	// Función para forzar recarga
	const refresh = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	useEffect(() => {
		// Solo ejecutar en cliente
		if (typeof window === "undefined") return;

		// Query: usuarios creados en los últimos N días, ordenados por fecha
		const usersQuery = query(
			collection(firestore, "users"),
			where("createdAt", ">=", dateThreshold),
			orderBy("createdAt", "desc")
		);

		let unsubscribe: Unsubscribe | null = null;
		let isFirstSnapshot = true;

		try {
			unsubscribe = onSnapshot(
				usersQuery,
				{ includeMetadataChanges: true },
				(snapshot: QuerySnapshot<DocumentData>) => {
					// Extraer metadata de conectividad
					const metadata = snapshot.metadata;
					setFromCache(metadata.fromCache);
					setHasPendingWrites(metadata.hasPendingWrites);

					// Mapear documentos a UserProfile
					const users: UserProfile[] = snapshot.docs.map((doc) => ({
						...(doc.data() as Omit<UserProfile, "uid">),
						uid: doc.id,
					}));

					dataRef.current = users;
					setData(users);
					if (isFirstSnapshot) {
						setLoading(false);
						isFirstSnapshot = false;
					}
					setError(null);
				},
				(err: Error) => {
					// Manejo de errores graceful
					// Si hay error de red, no lanzar error fatal - los datos de caché siguen disponibles
					// Solo marcar error si no tenemos datos en caché
					if (dataRef.current.length === 0) {
						setError(err);
					}
					
					setFromCache(true);
					setLoading(false);
				}
			);
		} catch (caughtErr) {
			// Error al crear la query - manejar en el próximo tick para evitar warnings
			const errorToSet = caughtErr instanceof Error ? caughtErr : new Error("Error desconocido");
			console.error("[useRecentRegistrations] Error creando query:", caughtErr);
			// Usar setTimeout para mover fuera del ciclo síncrono del effect
			setTimeout(() => {
				setError(errorToSet);
				setLoading(false);
			}, 0);
		}

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [dateThreshold, refreshKey]);

	return {
		data,
		loading,
		error,
		fromCache,
		hasPendingWrites,
		refresh,
	};
}

// ============================================================================
// HOOK: useOfflineAwareQuery (Genérico)
// ============================================================================

/**
 * Opciones para el hook useOfflineAwareQuery
 */
export interface OfflineQueryOptions {
	/** Nombre de la colección */
	collectionName: string;
	/** Campo de fecha para filtrar */
	dateField?: string;
	/** Número de días hacia atrás (si aplica) */
	days?: number;
	/** Habilitar la consulta */
	enabled?: boolean;
}

/**
 * Hook genérico para consultas con soporte offline.
 * 
 * @param options - Opciones de configuración
 * @returns Datos y metadata de la consulta
 */
export function useOfflineAwareQuery<T extends object>(
	options: OfflineQueryOptions
): RecentRegistrationsResult<T> {
	const { collectionName, dateField = "createdAt", days = 3, enabled = true } = options;

	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState<boolean>(enabled);
	const [error, setError] = useState<Error | null>(null);
	const [fromCache, setFromCache] = useState<boolean>(false);
	const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const dataRef = useRef<T[]>([]);

	const refresh = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	const dateThreshold = useMemo(() => {
		const date = new Date();
		date.setDate(date.getDate() - days);
		date.setHours(0, 0, 0, 0);
		return Timestamp.fromDate(date);
	}, [days]);

	useEffect(() => {
		if (typeof window === "undefined" || !enabled) return;

		let isFirstSnapshot = true;

		const q = query(
			collection(firestore, collectionName),
			where(dateField, ">=", dateThreshold),
			orderBy(dateField, "desc")
		);

		const unsubscribe = onSnapshot(
			q,
			{ includeMetadataChanges: true },
			(snapshot) => {
				setFromCache(snapshot.metadata.fromCache);
				setHasPendingWrites(snapshot.metadata.hasPendingWrites);

				const items: T[] = snapshot.docs.map((doc) => ({
					...(doc.data() as T),
					uid: doc.id,
				}));

				dataRef.current = items;
				setData(items);
				if (isFirstSnapshot) {
					setLoading(false);
					isFirstSnapshot = false;
				}
				setError(null);
			},
			(err) => {
				console.warn(`[useOfflineAwareQuery:${collectionName}] Error:`, err.message);
				if (dataRef.current.length === 0) {
					setError(err);
				}
				setFromCache(true);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [collectionName, dateField, dateThreshold, enabled, refreshKey]);

	return {
		data,
		loading,
		error,
		fromCache,
		hasPendingWrites,
		refresh,
	};
}
