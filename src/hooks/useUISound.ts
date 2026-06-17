"use client";

import { useRef, useState } from "react";
import Snd from "snd-lib";

/**
 * Tipos de sonido disponibles en la aplicación
 */
export type SoundType = "click" | "success" | "error" | "scanComplete";

/**
 * Hook para manejar efectos de sonido en la UI usando snd-lib
 *
 * @description
 * Implementa un sistema de feedback auditivo usando la librería snd-lib,
 * que es más performante y minimalista que cargar archivos MP3 locales.
 * Usa el kit SND01 (básico minimalista) para mantener el bundle pequeño.
 *
 * Audio is lazy-loaded on first user interaction to avoid impacting TBT
 * during initial page load.
 *
 * @example
 * ```tsx
 * const { playClick, playSuccess, playError, playScanComplete } = useUISound();
 *
 * const handleButtonClick = () => {
 *   playClick();
 *   // ... resto de la lógica
 * };
 * ```
 */
export function useUISound() {
	const sndRef = useRef<Snd | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isEnabled, setIsEnabledState] = useState(true);
	const isInitializing = useRef(false);

	/**
	 * Lazy-initialize snd-lib on first user interaction instead of on mount.
	 * This avoids fetching + parsing audio data during initial page load,
	 * reducing TBT and competing with LCP hydration.
	 */
	const ensureInitialized = async () => {
		if (sndRef.current || isInitializing.current) return;
		isInitializing.current = true;

		try {
			const snd = new Snd();
			await snd.load(Snd.KITS.SND01);
			sndRef.current = snd;
			setIsReady(true);

			if (process.env.NODE_ENV === "development") {
				console.debug("[useUISound] Kit SND01 loaded on first interaction");
			}
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.debug("[useUISound] Error initializing snd-lib:", error);
			}
			isInitializing.current = false;
		}
	};

	const safePlay = async (sound: string) => {
		if (!isEnabled) return;
		await ensureInitialized();
		if (!sndRef.current) return;

		try {
			sndRef.current.play(sound);
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.debug(`[useUISound] No se pudo reproducir sonido:`, error);
			}
		}
	};

	const playClick = () => {
		safePlay(Snd.SOUNDS.TAP);
	};

	const playSuccess = () => {
		safePlay(Snd.SOUNDS.CELEBRATION);
	};

	const playError = () => {
		safePlay(Snd.SOUNDS.CAUTION);
	};

	const playScanComplete = () => {
		safePlay(Snd.SOUNDS.CELEBRATION);
	};

	const playSound = (type: SoundType): void => {
		switch (type) {
			case "click":
				playClick();
				break;
			case "success":
				playSuccess();
				break;
			case "error":
				playError();
				break;
			case "scanComplete":
				playScanComplete();
				break;
		}
	};

	const setEnabled = (enabled: boolean) => {
		setIsEnabledState(enabled);
	};

	return {
		playClick,
		playSuccess,
		playError,
		playScanComplete,
		playSound,
		setEnabled,
		isEnabled,
		isReady,
	};
}
