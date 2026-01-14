"use client";

import { Download } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * Botón para instalar la PWA en el escritorio.
 * Solo se muestra si la app es instalable y no está ya instalada.
 */
export function InstallAppButton() {
	const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

	// No mostrar si ya está instalada o no es instalable
	if (isInstalled || !isInstallable) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={promptInstall}
			className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
			title="Instalar aplicación en el escritorio"
			aria-label="Instalar aplicación"
		>
			<Download className="w-4 h-4" />
			<span className="hidden sm:inline">Instalar App</span>
		</button>
	);
}
