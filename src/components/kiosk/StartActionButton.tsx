"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUISound } from "@/hooks";
import { cn } from "@/lib/utils";
import { useKioskStore } from "@/store/kioskStore";

interface StartActionButtonProps {
	href?: string;
	/** Override for the button CTA text (otherwise uses t("common.tapToStart")) */
	ctaText?: string;
	/** Override for the button aria-label (otherwise uses t("common.tapToStartAria")) */
	ctaAriaLabel?: string;
}

/**
 * StartActionButton - Botón principal del Kiosko
 *
 * Diseño premium con gradientes, partículas y animaciones fluidas.
 * Implementa efectos de glow, shimmer y feedback visual al ser presionado.
 */
export function StartActionButton({
	href = "/ingreso",
	ctaText,
	ctaAriaLabel,
}: StartActionButtonProps) {
	const resetFlow = useKioskStore((state) => state.resetFlow);
	const setStep = useKioskStore((state) => state.setStep);
	const [isPending, startTransition] = useTransition();
	const { t } = useLanguage();

	const displayText = ctaText ?? t("common.tapToStart");
	const displayAriaLabel = ctaAriaLabel ?? t("common.tapToStartAria");

	// Hook de sonidos UI
	const { playClick } = useUISound();

	const handlePress = () => {
		// Reproducir sonido de click al presionar
		playClick();

		startTransition(() => {
			resetFlow();
			setStep(1);
		});
	};

	return (
		<Link
			href={href}
			aria-label={displayAriaLabel}
			onClick={handlePress}
			className={cn(
				"group",
				"relative",
				"block",
				"overflow-hidden",
				"w-full",
				"rounded-2xl",
				"px-8 py-6",
				"sm:px-12 sm:py-8",
				"bg-linear-to-r from-primary via-emerald-400 to-primary",
				"dark:from-primary dark:via-emerald-500 dark:to-primary",
				"text-xl sm:text-2xl md:text-3xl",
				"font-bold uppercase tracking-wider text-zinc-900",
				"shadow-[0_0_40px_rgba(46,204,113,0.4),0_8px_32px_rgba(0,0,0,0.3)]",
				"border-2 border-white/30",
				"transition-all duration-300 ease-out",
				"animate-[heartbeat_2s_ease-in-out_infinite]",
				"hover:shadow-[0_0_60px_rgba(46,204,113,0.6),0_0_100px_rgba(46,204,113,0.3),0_12px_40px_rgba(0,0,0,0.4)]",
				"hover:scale-[1.02] hover:border-white/50",
				"active:scale-[0.98] active:shadow-[0_0_20px_rgba(46,204,113,0.5),0_4px_16px_rgba(0,0,0,0.3)]",
				"disabled:opacity-70 disabled:cursor-not-allowed disabled:animate-none disabled:hover:scale-100",
				"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-black",
			)}
		>
			{/* ═══ EFECTO SHIMMER ═══ */}
			<span
				className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-linear-to-r from-transparent via-white/40 to-transparent"
				aria-hidden="true"
			/>

			{/* ═══ PARTÍCULAS DECORATIVAS ═══ */}
			<span
				className="absolute top-2 left-4 w-2 h-2 rounded-full bg-white/40 group-hover:bg-white/60 animate-pulse"
				aria-hidden="true"
			/>
			<span
				className="absolute top-4 right-6 w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-white/50 animate-pulse delay-150"
				aria-hidden="true"
			/>
			<span
				className="absolute bottom-3 left-8 w-1 h-1 rounded-full bg-white/20 group-hover:bg-white/40 animate-pulse delay-300"
				aria-hidden="true"
			/>
			<span
				className="absolute bottom-2 right-4 w-2.5 h-2.5 rounded-full bg-white/25 group-hover:bg-white/45 animate-pulse delay-500"
				aria-hidden="true"
			/>

			{/* ═══ CONTENIDO DEL BOTÓN ═══ */}
			<span className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
				{isPending ? (
					<>
						<svg
							className="h-6 w-6 sm:h-7 sm:w-7 animate-spin"
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
						<span>{t("common.loading").toUpperCase()}</span>
					</>
				) : (
					<>
						{/* Ícono con animación */}
						<span className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/20 group-hover:bg-zinc-900/30 transition-colors duration-300">
							<Sparkles
								className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300"
								strokeWidth={2.5}
							/>
							{/* Ping de atención */}
							<span
								className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100"
								aria-hidden="true"
							/>
						</span>
						<span className="drop-shadow-sm">{displayText}</span>
						{/* Cohete con animación de despegue */}
						<span
							className="text-2xl sm:text-3xl md:text-4xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
							role="img"
							aria-label="cohete"
						>
							🚀
						</span>
					</>
				)}
			</span>

			{/* ═══ ANILLO EXTERIOR PULSANTE ═══ */}
			<span
				className="absolute inset-0 -z-10 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-2xl border-2 border-primary/20"
				aria-hidden="true"
			/>
		</Link>
	);
}
