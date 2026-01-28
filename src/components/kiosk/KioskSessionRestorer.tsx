"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useKioskStore } from "@/store/kioskStore";

/**
 * Componente que restaura la sesión del kiosko desde localStorage al cargar.
 * 
 * Si encuentra una sesión válida (no expirada) con OTP verificado:
 * - Restaura el estado del store
 * - Redirige al usuario al paso donde estaba (ej: consentimiento)
 * 
 * Esto evita que el usuario tenga que solicitar un nuevo OTP si recarga
 * la página por accidente (optimización de costos).
 */
export function KioskSessionRestorer() {
	const router = useRouter();
	const pathname = usePathname();
	const restoreSession = useKioskStore((state) => state.restoreSession);
	const _wasRestored = useKioskStore((state) => state.wasRestored);
	const isAuthenticated = useKioskStore((state) => state.isAuthenticated);
	const hasCheckedRef = useRef(false);

	useEffect(() => {
		// Solo ejecutar una vez al montar usando ref (evita cascading renders)
		if (hasCheckedRef.current) return;
		hasCheckedRef.current = true;

		// No restaurar si ya está autenticado (evita loops)
		if (isAuthenticated) return;

		// No restaurar si estamos en la página de éxito (ya terminó el flujo)
		if (pathname === "/exito") return;

		// Intentar restaurar sesión
		const restored = restoreSession();

		if (restored) {
			console.log("[KioskSession] Sesión restaurada desde localStorage");
			
			// Si estamos en páginas iniciales y hay sesión válida, 
			// redirigir al consentimiento (donde probablemente estaba)
			if (pathname === "/" || pathname === "/ingreso" || pathname === "/otp" || pathname === "/registro") {
				router.replace("/consentimiento");
			}
		}
	}, [isAuthenticated, pathname, restoreSession, router]);

	// Este componente no renderiza nada visible
	return null;
}
