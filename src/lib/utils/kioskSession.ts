/**
 * Utilidades para persistencia de sesión del Kiosco.
 * 
 * Usa localStorage para mantener la sesión del visitante por 10 minutos,
 * evitando re-envío de OTPs costosos si el usuario recarga la página.
 * 
 * SEGURIDAD: La validación crítica se hace en el backend al firmar el consentimiento.
 * Esta persistencia es solo para UX y optimización de costos.
 */

import type { UserProfile } from "@/types/firestore";
import type { ConsentFormState } from "@/store/kioskStore";

const KIOSK_SESSION_KEY = "kiosk_session";
const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutos

export interface KioskSession {
	/** UID/Cédula del visitante */
	uid: string;
	/** Datos del visitante */
	visitorData: Partial<UserProfile>;
	/** Estado del consentimiento */
	consent: ConsentFormState;
	/** Paso actual del flujo */
	step: number;
	/** Si el OTP fue validado */
	isAuthenticated: boolean;
	/** Timestamp de expiración */
	expiresAt: number;
}

/**
 * Guarda la sesión del kiosco en localStorage con expiración de 10 minutos.
 */
export function saveKioskSession(session: Omit<KioskSession, "expiresAt">): void {
	if (typeof window === "undefined") return;
	
	const sessionWithExpiry: KioskSession = {
		...session,
		expiresAt: Date.now() + SESSION_DURATION_MS,
	};
	
	try {
		localStorage.setItem(KIOSK_SESSION_KEY, JSON.stringify(sessionWithExpiry));
	} catch (error) {
		console.warn("[KioskSession] Error guardando sesión:", error);
	}
}

/**
 * Obtiene la sesión del kiosco si existe y no ha expirado.
 * Si ha expirado, la elimina automáticamente.
 */
export function getKioskSession(): KioskSession | null {
	if (typeof window === "undefined") return null;
	
	try {
		const stored = localStorage.getItem(KIOSK_SESSION_KEY);
		if (!stored) return null;
		
		const session: KioskSession = JSON.parse(stored);
		
		// Verificar expiración
		if (Date.now() >= session.expiresAt) {
			clearKioskSession();
			return null;
		}
		
		return session;
	} catch (error) {
		console.warn("[KioskSession] Error leyendo sesión:", error);
		clearKioskSession();
		return null;
	}
}

/**
 * Elimina la sesión del kiosco.
 * Debe llamarse al finalizar el flujo (página de éxito) para que
 * el siguiente usuario no herede la sesión.
 */
export function clearKioskSession(): void {
	if (typeof window === "undefined") return;
	
	try {
		localStorage.removeItem(KIOSK_SESSION_KEY);
	} catch (error) {
		console.warn("[KioskSession] Error eliminando sesión:", error);
	}
}
