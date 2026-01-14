"use client";

import { FileText, Shield, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SpaceBackground } from "@/components/kiosk/SpaceBackground";
import { StartActionButton } from "@/components/kiosk/StartActionButton";
import { SecretAdminTrigger } from "@/components/ui/SecretAdminTrigger";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Página principal del Kiosko - Landing de Alto Impacto
 *
 * Diseño inmersivo con fondo animado de galaxia/espacio que transmite la energía del parque.
 * Hero centrado con CTA principal y footer minimalista con beneficios.
 */
export default function HomePage() {
	const { t } = useLanguage();
	const { isAdmin, isLoading } = useAuth();
	const router = useRouter();

	// Redirección automática para administradores con sesión activa
	useEffect(() => {
		if (!isLoading && isAdmin) {
			router.replace("/admin/usuarios");
		}
	}, [isAdmin, isLoading, router]);

	return (
		<main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
			{/* ═══════════════════════════════════════════════════════════════════
          FONDO ANIMADO DE ESPACIO - Estrellas, nebulosas y estrellas fugaces
      ═══════════════════════════════════════════════════════════════════ */}
			<SpaceBackground />

			{/* ═══════════════════════════════════════════════════════════════════
          OVERLAY OSCURO - Gradiente radial para legibilidad
      ═══════════════════════════════════════════════════════════════════ */}
			<div
				className="absolute inset-0 z-10 bg-linear-to-b from-black/40 via-transparent to-black/60"
				aria-hidden="true"
			/>

			{/* ═══════════════════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL - Por encima del video
      ═══════════════════════════════════════════════════════════════════ */}
			<div className="relative z-20 flex min-h-screen flex-col">
				{/* ─────────────────────────────────────────────────────────────────
            HERO SECTION - Centro de la pantalla
        ───────────────────────────────────────────────────────────────── */}
				<section className="flex flex-1 flex-col items-center justify-center px-6 text-center relative">
					{/* Partículas decorativas animadas */}
					<div
						className="pointer-events-none absolute inset-0 overflow-hidden"
						aria-hidden="true"
					>
						<div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/10 blur-3xl" />
						<div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl delay-1000" />
					</div>

					{/* ═══ ASTRONAUTA FLOTANTE ═══ */}
					<div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none -translate-x-[30%] xs:-translate-x-[20%] sm:-translate-x-[10%] md:translate-x-0 md:left-2 lg:left-8 xl:left-20 2xl:left-32">
						<div className="relative">
							{/* Sombra del astronauta */}
							<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 h-6 xs:w-32 xs:h-7 sm:w-40 sm:h-8 md:w-48 md:h-10 lg:w-64 lg:h-12 bg-black/30 rounded-full blur-xl animate-float-shadow" />
							{/* Astronauta */}
							<Image
								src="/assets/astronauta.png"
								alt="Astronauta flotando"
								width={500}
								height={625}
								className="animate-float drop-shadow-[0_0_60px_rgba(139,92,246,0.5)] w-40 h-auto opacity-50 xs:w-48 xs:opacity-60 sm:w-56 sm:opacity-70 md:w-64 md:opacity-80 lg:w-80 lg:opacity-100 xl:w-96 2xl:w-[480px]"
							/>
						</div>
					</div>

					{/* ═══ SISTEMA SOLAR (derecha) ═══ */}
					<div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none translate-x-[35%] sm:translate-x-[38%] md:translate-x-[40%] lg:translate-x-[40%]">
						<div className="relative">
							{/* Máscara con degradado suave para integrar con el fondo */}
							<div 
								className="relative overflow-hidden"
								style={{
									maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 70%), linear-gradient(to right, transparent 0%, black 25%, black 100%)',
									WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 70%), linear-gradient(to right, transparent 0%, black 25%, black 100%)',
									maskComposite: 'intersect',
									WebkitMaskComposite: 'source-in',
								}}
							>
								<Image
									src="/assets/solar-system.png"
									alt="Sistema Solar"
									width={2000}
									height={1560}
									className="h-auto opacity-60 mix-blend-screen md:opacity-50"
									style={{ minWidth: '600px' }}
								/>
							</div>
							{/* Glow suave que se mezcla con el fondo espacial */}
							<div className="absolute inset-0 bg-gradient-radial from-[#111C59]/30 via-[#0a1a12]/20 to-transparent blur-3xl" />
							<div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#111C59]/20 to-transparent blur-2xl" />
						</div>
					</div>

					{/* ═══ LOGO DE LA EMPRESA ═══ */}
					<div className="mb-8 animate-fade-in">
						<SecretAdminTrigger redirectTo="/admin/login">
							<Image
								src="/assets/jumping-park-logo.webp"
								alt="Jumping Park - Logo"
								width={280}
								height={100}
							priority
							className="h-auto w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] sm:w-56 md:w-64 lg:w-72"
						/>
						</SecretAdminTrigger>
					</div>

					{/* Título Principal */}
					<h1 className="font-sora mb-6 text-6xl font-black uppercase leading-none tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
						{t("home.title.line1")}
						<span className="mt-2 block bg-linear-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
							{t("home.title.line2")}
						</span>
					</h1>

					{/* Subtítulo */}
					<p className="mb-12 max-w-xl text-xl font-light tracking-wide text-white/80 sm:text-2xl md:text-3xl">
						{t("home.subtitle")}
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
								{t("home.benefit.secure")}
							</span>
						</div>

						{/* Separador visual (solo desktop) */}
						<div
							className="hidden h-6 w-px bg-white/20 md:block"
							aria-hidden="true"
						/>

						{/* Ingreso Rápido */}
						<div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
							<Zap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
							<span className="text-sm font-medium tracking-wide sm:text-base">
								{t("home.benefit.fast")}
							</span>
						</div>

						{/* Separador visual (solo desktop) */}
						<div
							className="hidden h-6 w-px bg-white/20 md:block"
							aria-hidden="true"
						/>

						{/* 100% Digital */}
						<div className="flex items-center gap-3 text-white/60 transition-colors hover:text-white/80">
							<FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
							<span className="text-sm font-medium tracking-wide sm:text-base">
								{t("home.benefit.digital")}
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
