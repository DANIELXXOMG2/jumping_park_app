import { Shield, Zap, FileText } from "lucide-react";
import Image from "next/image";
import { StartActionButton } from "@/components/kiosk/StartActionButton";

/**
 * Página principal del Kiosko - Landing de Alto Impacto
 * 
 * Diseño inmersivo con video de fondo que transmite la energía del parque.
 * Hero centrado con CTA principal y footer minimalista con beneficios.
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          VIDEO DE FONDO - Pantalla completa, loop infinito
      ═══════════════════════════════════════════════════════════════════ */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
        poster="/assets/astronayta.png"
      >
        <source
          src="/assets/hero-opt.mp4"
          type="video/mp4"
        />
        {/* Fallback para navegadores sin soporte de video */}
        Tu navegador no soporta videos HTML5.
      </video>

      {/* ═══════════════════════════════════════════════════════════════════
          OVERLAY OSCURO - Gradiente radial para legibilidad
      ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="absolute inset-0 z-10 bg-linear-to-b from-black/70 via-black/50 to-black/80"
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL - Por encima del video
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 flex min-h-screen flex-col">
        
        {/* ─────────────────────────────────────────────────────────────────
            HERO SECTION - Centro de la pantalla
        ───────────────────────────────────────────────────────────────── */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          {/* Partículas decorativas animadas */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl delay-1000" />
          </div>

          {/* ═══ LOGO DE LA EMPRESA ═══ */}
          <div className="mb-8 animate-fade-in">
            <Image
              src="/assets/jumping-park-logo.webp"
              alt="Jumping Park - Logo"
              width={280}
              height={100}
              priority
              className="h-auto w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:w-56 md:w-64 lg:w-72"
            />
          </div>

          {/* Título Principal */}
          <h1 className="font-sora mb-6 text-6xl font-black uppercase leading-none tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
            ¿Listo para
            <span className="mt-2 block bg-linear-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              saltar?
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mb-12 max-w-xl text-xl font-light tracking-wide text-white/80 sm:text-2xl md:text-3xl">
            Tu aventura comienza con un toque.
          </p>

          {/* Botón CTA Principal */}
          <div className="w-full max-w-2xl transform transition-transform duration-300 hover:scale-[1.02]">
            <StartActionButton />
          </div>

          {/* Indicador de scroll/touch */}
          <div className="mt-16 animate-bounce">
            <div className="mx-auto h-14 w-8 rounded-full border-2 border-white/30 p-1">
              <div className="h-3 w-full animate-pulse rounded-full bg-white/60" />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────
            FOOTER MINIMALISTA - Beneficios del sistema
        ───────────────────────────────────────────────────────────────── */}
        <footer className="px-6 pb-8">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-12 md:justify-between">
            {/* Registro Seguro */}
            <div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide sm:text-base">
                Registro Seguro
              </span>
            </div>

            {/* Separador visual (solo desktop) */}
            <div className="hidden h-6 w-px bg-white/20 md:block" aria-hidden="true" />

            {/* Ingreso Rápido */}
            <div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide sm:text-base">
                Ingreso Rápido
              </span>
            </div>

            {/* Separador visual (solo desktop) */}
            <div className="hidden h-6 w-px bg-white/20 md:block" aria-hidden="true" />

            {/* 100% Digital */}
            <div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide sm:text-base">
                100% Digital
              </span>
            </div>
          </div>

          {/* Copyright sutil */}
          <p className="mt-6 text-center text-xs tracking-widest text-white/30">
            JUMPING PARK © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}
