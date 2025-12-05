'use client';

import { useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { useKioskStore } from "@/store/kioskStore";

interface StartActionButtonProps {
  href?: string;
}

/**
 * StartActionButton - Botón principal del Kiosko
 * 
 * Diseñado para ser el disparador principal de la experiencia.
 * Implementa un efecto de "latido" constante para llamar la atención
 * y feedback visual al ser presionado.
 */
export function StartActionButton({ href = "/ingreso" }: StartActionButtonProps) {
  const router = useRouter();
  const resetFlow = useKioskStore((state) => state.resetFlow);
  const setStep = useKioskStore((state) => state.setStep);
  const [isPending, startTransition] = useTransition();

  const handlePress = useCallback(() => {
    startTransition(() => {
      resetFlow();
      setStep(1);
      router.push(href);
    });
  }, [href, resetFlow, router, setStep, startTransition]);

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={isPending}
      aria-label="Toca para iniciar tu registro en Jumping Park"
      className={`
        group
        relative
        overflow-hidden
        
        /* ═══ FORMA Y TAMAÑO ═══ */
        rounded-full
        px-16 py-8
        sm:px-20 sm:py-10
        
        /* ═══ COLORES ═══ */
        bg-brand-green
        text-surface
        
        /* ═══ TIPOGRAFÍA ═══ */
        text-2xl sm:text-3xl
        font-bold
        uppercase
        tracking-wider
        
        /* ═══ SOMBRA BRILLANTE (GLOW) ═══ */
        shadow-[0_0_40px_rgba(46,204,113,0.5),0_0_80px_rgba(46,204,113,0.3),0_8px_32px_rgba(0,0,0,0.3)]
        
        /* ═══ ANIMACIÓN DE LATIDO ═══ */
        animate-[heartbeat_1.5s_ease-in-out_infinite]
        
        /* ═══ TRANSICIONES ═══ */
        transition-all
        duration-200
        ease-out
        
        /* ═══ ESTADOS ═══ */
        hover:shadow-[0_0_60px_rgba(46,204,113,0.6),0_0_100px_rgba(46,204,113,0.4),0_12px_40px_rgba(0,0,0,0.4)]
        hover:brightness-110
        
        active:scale-95
        active:shadow-[0_0_20px_rgba(46,204,113,0.4),0_4px_16px_rgba(0,0,0,0.3)]
        active:brightness-95
        
        disabled:opacity-70
        disabled:cursor-not-allowed
        disabled:animate-none
        
        /* ═══ FOCUS ACCESIBLE ═══ */
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-brand-green/40
        focus-visible:ring-offset-4
        focus-visible:ring-offset-black
      `}
      style={{
        // Keyframes inline para el efecto heartbeat
        animation: isPending ? 'none' : 'heartbeat 1.5s ease-in-out infinite',
      }}
    >
      {/* Efecto de brillo interno (shimmer) */}
      <span 
        className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      
      {/* Contenido del botón */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        {isPending ? (
          <>
            <svg 
              className="h-7 w-7 animate-spin" 
              viewBox="0 0 24 24" 
              fill="none"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>CARGANDO...</span>
          </>
        ) : (
          <>
            <span>TOCA PARA INICIAR</span>
            <span className="text-3xl sm:text-4xl" role="img" aria-label="cohete">
              🚀
            </span>
          </>
        )}
      </span>
      
      {/* Anillo exterior pulsante */}
      <span 
        className="absolute inset-0 -z-10 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-4 border-brand-green/30"
        aria-hidden="true"
      />
    </button>
  );
}

// Nota: Agregar estos keyframes al archivo globals.css o tailwind.config.ts:
// @keyframes heartbeat {
//   0%, 100% { transform: scale(1); }
//   14% { transform: scale(1.05); }
//   28% { transform: scale(1); }
//   42% { transform: scale(1.05); }
//   70% { transform: scale(1); }
// }
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
