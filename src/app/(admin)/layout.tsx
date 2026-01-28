"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

const AuthProvider = dynamic(
	() => import("@/contexts/AuthContext").then((mod) => mod.AuthProvider),
	{ ssr: false },
);

/**
 * Configuración global de SWR para el área de admin.
 * 
 * 🔥 OPTIMIZADO: Reduce lecturas de Firestore significativamente.
 * - Sin revalidación al cambiar de pestaña (evita fetches innecesarios)
 * - Deduplicación de 60 segundos (evita requests duplicados)
 * - Throttle de 2 minutos para focus events
 */
const swrConfig = {
	revalidateOnFocus: false, // NO recargar al cambiar de pestaña
	revalidateOnReconnect: true, // SÍ recargar al reconectarse a internet
	dedupingInterval: 60000, // 1 minuto de deduplicación
	focusThrottleInterval: 120000, // 2 minutos entre revalidaciones por focus
	errorRetryCount: 3, // Reintentar 3 veces en error
	keepPreviousData: true, // Mantener datos mientras revalida
};

interface AdminLayoutProps {
	children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<SWRConfig value={swrConfig}>
			<AuthProvider>{children}</AuthProvider>
		</SWRConfig>
	);
}
