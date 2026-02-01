"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getKioskSession } from "@/lib/utils/kioskSession";
import { useKioskStore } from "@/store/kioskStore";

/** Rutas que requieren autenticación OTP */
const PROTECTED_ROUTES = ["/consentimiento"];

/** Rutas públicas (no requieren autenticación) */
const PUBLIC_ROUTES = ["/", "/ingreso", "/otp", "/registro"];

/**
 * Componente que maneja la sesión del kiosko:
 * 
 * 1. PROTECCIÓN: Si intenta acceder a rutas protegidas sin OTP → redirige a /
 * 2. RESTAURACIÓN: Si hay sesión válida y recarga → fuerza a /consentimiento
 * 3. PERSISTENCIA: La sesión dura 10 minutos (configurable en kioskSession.ts)
 * 
 * La ÚNICA forma de salir del flujo autenticado es:
 * - Clic en botón Home (Jumping Park) → Hard Reset
 * - Expiración de la sesión (10 minutos)
 */
export function KioskSessionRestorer() {
	const router = useRouter();
	const pathname = usePathname();
	const restoreSession = useKioskStore((state) => state.restoreSession);
	const isAuthenticated = useKioskStore((state) => state.isAuthenticated);
	const clearSession = useKioskStore((state) => state.clearSession);
	
	// Referencia para tracking de la ruta ya procesada
	const lastProcessedPath = useRef<string | null>(null);

	useEffect(() => {
		// Si ya procesamos esta ruta, no hacer nada (evita loops)
		if (lastProcessedPath.current === pathname) return;
		lastProcessedPath.current = pathname;

		// Página de éxito: flujo terminado, no hacer nada
		if (pathname === "/exito") return;

		// Verificar si hay sesión guardada en localStorage (no expirada)
		const savedSession = getKioskSession();
		const hasValidSession = savedSession?.isAuthenticated === true;

		// ═══════════════════════════════════════════════════════════════
		// CASO 1: Usuario YA autenticado en store (sesión activa en memoria)
		// ═══════════════════════════════════════════════════════════════
		if (isAuthenticated) {
			// Si está autenticado pero intenta ir a ruta pública, forzar a consentimiento
			if (PUBLIC_ROUTES.includes(pathname)) {
				console.log("[KioskSession] Autenticado intentando ir a ruta pública, forzando /consentimiento");
				router.replace("/consentimiento");
			}
			return;
		}

		// ═══════════════════════════════════════════════════════════════
		// CASO 2: NO autenticado en store, pero hay sesión en localStorage
		// → RESTAURAR sesión y forzar a /consentimiento
		// ═══════════════════════════════════════════════════════════════
		if (hasValidSession) {
			console.log("[KioskSession] Sesión válida encontrada, restaurando...");
			const restored = restoreSession();
			
			if (restored) {
				console.log("[KioskSession] Sesión restaurada, forzando a /consentimiento");
				router.replace("/consentimiento");
				return;
			}
		}

		// ═══════════════════════════════════════════════════════════════
		// CASO 3: NO hay sesión válida (ni en store ni en localStorage)
		// → Proteger rutas que requieren autenticación
		// ═══════════════════════════════════════════════════════════════
		if (!hasValidSession && !isAuthenticated && PROTECTED_ROUTES.includes(pathname)) {
			console.log("[KioskSession] Acceso a ruta protegida sin sesión, redirigiendo a /");
			clearSession(); // Limpiar cualquier residuo
			router.replace("/");
		}

	}, [isAuthenticated, pathname, restoreSession, clearSession, router]);

	// Este componente no renderiza nada visible
	return null;
}
