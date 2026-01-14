"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Interfaz para el evento beforeinstallprompt
 * No está en los tipos estándar de TypeScript
 */
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
	/** Si la app puede ser instalada (el prompt está disponible) */
	isInstallable: boolean;
	/** Si la app ya está instalada */
	isInstalled: boolean;
	/** Si el navegador soporta PWA */
	isSupported: boolean;
	/** Dispara el prompt de instalación */
	promptInstall: () => Promise<boolean>;
}

/**
 * Verifica si el navegador soporta Service Workers
 */
function checkBrowserSupport(): boolean {
	return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Verifica si la app ya está instalada como PWA
 */
function checkIsInstalled(): boolean {
	if (typeof window === "undefined") return false;

	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		// @ts-expect-error - navigator.standalone es específico de iOS
		window.navigator.standalone === true ||
		document.referrer.includes("android-app://")
	);
}

/**
 * Hook para manejar la instalación de la PWA.
 * Captura el evento beforeinstallprompt y permite disparar el prompt manualmente.
 *
 * @example
 * ```tsx
 * const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
 *
 * if (isInstallable && !isInstalled) {
 *   return <button onClick={promptInstall}>Instalar App</button>;
 * }
 * ```
 */
export function usePWAInstall(): UsePWAInstallReturn {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	// Inicializar estados con funciones para evitar cascading renders
	const [isInstalled, setIsInstalled] = useState(() => checkIsInstalled());
	const [isSupported] = useState(() => checkBrowserSupport());

	useEffect(() => {
		// Solo en el cliente
		if (typeof window === "undefined") return;

		// Escuchar cambios en el display-mode
		const mediaQuery = window.matchMedia("(display-mode: standalone)");
		const handleDisplayModeChange = (e: MediaQueryListEvent) => {
			setIsInstalled(e.matches);
		};
		mediaQuery.addEventListener("change", handleDisplayModeChange);

		// Capturar el evento beforeinstallprompt
		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevenir que Chrome muestre el mini-infobar automáticamente
			e.preventDefault();
			// Guardar el evento para usarlo después
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};

		// Escuchar cuando la app es instalada
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
			console.log("[PWA] App instalada exitosamente");
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			mediaQuery.removeEventListener("change", handleDisplayModeChange);
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	/**
	 * Dispara el prompt de instalación nativo.
	 * @returns true si el usuario aceptó, false si rechazó o hubo error
	 */
	const promptInstall = useCallback(async (): Promise<boolean> => {
		if (!deferredPrompt) {
			console.warn("[PWA] No hay prompt de instalación disponible");
			return false;
		}

		try {
			// Mostrar el prompt
			await deferredPrompt.prompt();

			// Esperar la elección del usuario
			const { outcome } = await deferredPrompt.userChoice;

			// Limpiar el prompt (solo se puede usar una vez)
			setDeferredPrompt(null);

			if (outcome === "accepted") {
				console.log("[PWA] Usuario aceptó la instalación");
				return true;
			}
			console.log("[PWA] Usuario rechazó la instalación");
			return false;
		} catch (error) {
			console.error("[PWA] Error al mostrar prompt:", error);
			return false;
		}
	}, [deferredPrompt]);

	return {
		isInstallable: deferredPrompt !== null,
		isInstalled,
		isSupported,
		promptInstall,
	};
}
