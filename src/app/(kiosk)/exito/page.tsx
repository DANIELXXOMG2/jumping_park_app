"use client";

import { ArrowRight, CheckCircle2, PartyPopper, Rocket, Sparkles, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKioskStore } from "@/store/kioskStore";

/**
 * Componente interno que contiene la lógica de useSearchParams y el renderizado visual.
 */
function ExitoContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { clearSession } = useKioskStore();
	const { t, language } = useLanguage();
	const [countdown, setCountdown] = useState(8);
	const [_isHovering, setIsHovering] = useState(false);

	const consecutivo = searchParams.get("consecutivo") || "---";
	const nombre = searchParams.get("nombre") || (language === "es" ? "Visitante" : "Visitor");

	useEffect(() => {
		// Limpiar el estado del kiosko Y localStorage inmediatamente
		// Esto evita que el siguiente usuario herede la sesión
		clearSession();

		// Countdown para volver al inicio
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					router.push("/ingreso");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [clearSession, router]);

	const handleContinue = () => {
		router.push("/ingreso");
	};

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
			{/* ═══ PARTÍCULAS DE FONDO ANIMADAS ═══ */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
				{/* Estrellas flotantes */}
				<Star className="absolute top-[10%] left-[15%] w-4 h-4 text-yellow-400/30 animate-pulse" />
				<Star className="absolute top-[20%] right-[20%] w-3 h-3 text-primary/40 animate-pulse delay-150" />
				<Star className="absolute top-[60%] left-[10%] w-5 h-5 text-purple-400/30 animate-pulse delay-300" />
				<Star className="absolute top-[70%] right-[15%] w-4 h-4 text-emerald-400/30 animate-pulse delay-500" />
				<Star className="absolute bottom-[20%] left-[25%] w-3 h-3 text-yellow-400/40 animate-pulse delay-700" />
				
				{/* Orbes de luz */}
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 right-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500" />
			</div>

			{/* ═══ CÍRCULO DE ÉXITO ANIMADO ═══ */}
			<div className="relative mb-6 sm:mb-8">
				{/* Anillos pulsantes */}
				<div className="absolute inset-0 scale-150 animate-ping opacity-20">
					<div className="w-full h-full rounded-full border-4 border-primary" />
				</div>
				<div className="absolute inset-0 scale-125 animate-pulse opacity-30">
					<div className="w-full h-full rounded-full border-2 border-emerald-400" />
				</div>
				
				{/* Glow de fondo */}
				<div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
				
				{/* Círculo principal con gradiente */}
				<div className="relative bg-gradient-to-br from-primary via-emerald-400 to-primary rounded-full p-6 sm:p-8 shadow-[0_0_60px_rgba(46,204,113,0.5)]">
					<CheckCircle2 size={60} className="text-zinc-900 sm:w-20 sm:h-20" strokeWidth={1.5} />
					
					{/* Sparkles decorativos */}
					<Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-bounce" />
					<Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-yellow-400 animate-bounce delay-150" />
				</div>
			</div>

			{/* ═══ MENSAJE PRINCIPAL ═══ */}
			<div className="text-center max-w-md relative z-10">
				<div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
					<PartyPopper className="text-yellow-400 w-6 h-6 sm:w-7 sm:h-7 animate-bounce" />
					<h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("exito.title")}</h1>
					<PartyPopper className="text-yellow-400 w-6 h-6 sm:w-7 sm:h-7 scale-x-[-1] animate-bounce delay-150" />
				</div>

				<p className="text-foreground/70 text-base sm:text-lg mb-4 sm:mb-6">
					{t("exito.greeting")}{" "}
					<span className="text-primary font-semibold">{nombre}</span>
				</p>

				{/* ═══ NÚMERO DE CONSECUTIVO ═══ */}
				<div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 dark:from-zinc-800/80 dark:via-zinc-900/60 dark:to-zinc-800/80 border-2 border-primary/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 overflow-hidden">
					{/* Shimmer effect */}
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" aria-hidden="true" />
					
					<p className="text-foreground/60 text-xs sm:text-sm uppercase tracking-wider mb-2">
						{t("exito.registerNumber")}
					</p>
					<div className="flex items-center justify-center gap-2">
						<span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
							#{consecutivo}
						</span>
					</div>
					<p className="text-foreground/50 text-xs sm:text-sm mt-2 sm:mt-3 flex items-center justify-center gap-1.5">
						<CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
						{t("exito.saved")}
					</p>
				</div>

				{/* ═══ MENSAJE DE INSTRUCCIÓN ═══ */}
				<div className="relative bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 border border-primary/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 overflow-hidden">
					{/* Partículas */}
					<span className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" aria-hidden="true" />
					<span className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-emerald-400/30 animate-pulse delay-300" aria-hidden="true" />
					
					<p className="text-primary font-medium flex items-center justify-center gap-2 text-sm sm:text-base">
						<Rocket className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
						{t("exito.canPass")} 🎉
					</p>
					<p className="text-foreground/60 text-xs sm:text-sm mt-1">
						{t("exito.checkRules")}
					</p>
				</div>

				{/* ═══ BOTÓN DE CONTINUAR ═══ */}
				<button
					type="button"
					onClick={handleContinue}
					onMouseEnter={() => setIsHovering(true)}
					onMouseLeave={() => setIsHovering(false)}
					className="group relative w-full py-3 sm:py-4 bg-gradient-to-r from-zinc-800/80 via-zinc-900/80 to-zinc-800/80 dark:from-zinc-700/50 dark:via-zinc-800/50 dark:to-zinc-700/50 text-foreground font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 border border-white/10 dark:border-zinc-600/50 overflow-hidden hover:border-primary/30 hover:shadow-[0_0_30px_rgba(46,204,113,0.2)]"
				>
					{/* Shimmer */}
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" aria-hidden="true" />
					
					<span className="relative text-sm sm:text-base">{t("exito.backToStart")}</span>
					<ArrowRight className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
				</button>

				{/* ═══ COUNTDOWN ═══ */}
				<p className="text-foreground/40 text-xs sm:text-sm mt-3 sm:mt-4 flex items-center justify-center gap-2">
					{t("exito.autoRedirect")}{" "}
					<span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs sm:text-sm">
						{countdown}
					</span>
				</p>
			</div>

			{/* ═══ DECORACIÓN INFERIOR ═══ */}
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
			
			{/* Línea de brillo animada */}
			<div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
				<div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
			</div>
		</div>
	);
}

/**
 * Página de Éxito - Se muestra después de completar el consentimiento.
 * Proporciona feedback visual positivo antes de volver al inicio.
 */
export default function ExitoPage() {
	const { t } = useLanguage();
	
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center bg-background">
					<div className="flex flex-col items-center gap-4">
						<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-foreground/60">{t("exito.loading")}</p>
					</div>
				</div>
			}
		>
			<ExitoContent />
		</Suspense>
	);
}
