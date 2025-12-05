"use client";

import { useCallback, useRef, useEffect, useState } from "react";
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
  // Instancia singleton de Snd usando useRef
  const sndRef = useRef<Snd | null>(null);
  
  // Estado para controlar si el sistema está listo
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(true);
  
  // Flag para evitar múltiples inicializaciones
  const isInitializing = useRef(false);

  /**
   * Inicializa la instancia de Snd y carga el kit de sonidos
   */
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return;
    
    // Evitar múltiples inicializaciones
    if (isInitializing.current || sndRef.current) return;
    
    isInitializing.current = true;

    const initSnd = async () => {
      try {
        // Crear instancia de Snd
        const snd = new Snd();
        
        // Cargar el kit básico minimalista
        await snd.load(Snd.KITS.SND01);
        
        // Guardar referencia
        sndRef.current = snd;
        setIsReady(true);
        
        if (process.env.NODE_ENV === "development") {
          console.debug("[useUISound] Kit SND01 cargado correctamente");
        }
      } catch (error) {
        // Manejar errores silenciosamente para no romper la UX
        if (process.env.NODE_ENV === "development") {
          console.debug("[useUISound] Error al inicializar snd-lib:", error);
        }
        isInitializing.current = false;
      }
    };

    initSnd();

    // Cleanup
    return () => {
      // snd-lib no requiere cleanup explícito
    };
  }, []);

  /**
   * Reproduce un sonido de forma segura
   * Maneja excepciones de "User interaction required"
   */
  const safePlay = useCallback(
    (sound: string) => {
      if (!isEnabled) return;
      if (!sndRef.current) return;

      try {
        sndRef.current.play(sound);
      } catch (error) {
        // Manejar el error "User interaction required" silenciosamente
        // snd-lib lo maneja bien, pero por seguridad lo capturamos
        if (process.env.NODE_ENV === "development") {
          console.debug(`[useUISound] No se pudo reproducir sonido:`, error);
        }
      }
    },
    [isEnabled]
  );

  /**
   * Funciones específicas para cada tipo de sonido
   * Mapeadas a los sonidos del kit SND01
   */
  const playClick = useCallback(() => {
    safePlay(Snd.SOUNDS.TAP);
  }, [safePlay]);

  const playSuccess = useCallback(() => {
    safePlay(Snd.SOUNDS.CELEBRATION);
  }, [safePlay]);

  const playError = useCallback(() => {
    safePlay(Snd.SOUNDS.CAUTION);
  }, [safePlay]);

  const playScanComplete = useCallback(() => {
    // Reutiliza el sonido de celebración para el escaneo completado
    safePlay(Snd.SOUNDS.CELEBRATION);
  }, [safePlay]);

  /**
   * Reproduce un sonido genérico por tipo
   */
  const playSound = useCallback(
    (type: SoundType): void => {
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
    },
    [playClick, playSuccess, playError, playScanComplete]
  );

  /**
   * Habilita o deshabilita los sonidos globalmente
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
  }, []);

  return {
    // Funciones de reproducción
    playClick,
    playSuccess,
    playError,
    playScanComplete,
    playSound,
    
    // Utilidades
    setEnabled,
    
    // Estado
    isEnabled,
    isReady,
  };
}

export default useUISound;
