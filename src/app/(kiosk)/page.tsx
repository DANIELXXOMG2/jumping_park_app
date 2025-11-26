import { ShieldCheck, Sparkles } from "lucide-react";
import { StartActionButton } from "@/components/kiosk/StartActionButton";

/**
 * Página principal del Kiosko (Home)
 * 
 * El layout se aplica automáticamente por el sistema de rutas de Next.js
 * a través del archivo (kiosk)/layout.tsx
 */
export default function HomePage() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 pb-14 pt-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <span className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-foreground/70">
          Experiencia touch-first
        </span>

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
            Bienvenido a Jumping Park
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-foreground/80 sm:text-xl">
            Toca la pantalla para comenzar o escanea tu QR para validar tu
            consentimiento, firmar y disfrutar del parque en menos de 2
            minutos.
          </p>
        </div>

        <StartActionButton />

        <div className="grid w-full gap-6 text-left text-foreground/80 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
            <Sparkles className="mb-4 h-10 w-10 text-primary" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-white">Registro express</h2>
            <p className="mt-2 text-base">
              Captura tus datos y los de tus acompañantes con campos
              preparados para pantallas táctiles y lectores de cédula.
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.35)]">
            <ShieldCheck className="mb-4 h-10 w-10 text-primary" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold text-white">Consentimiento seguro</h2>
            <p className="mt-2 text-base">
              Firma digital, OTP obligatorio y generación de consecutivos para
              cumplir con RF-03 y las políticas de Mamba Park.
            </p>
          </article>
        </div>

        <p className="text-sm uppercase tracking-[0.5em] text-foreground/60">
          Toca cualquier lugar para continuar
        </p>
      </div>
    </section>
  );
}
