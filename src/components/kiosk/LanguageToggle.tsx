"use client";

import { Globe, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUISound } from "@/hooks/useUISound";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
	/** Variante de estilo */
	variant?: "minimal" | "pill" | "premium";
	/** Clases adicionales */
	className?: string;
}

/**
 * Botón flotante para cambiar el idioma del Kiosco.
 *
 * Variantes:
 * - minimal: Solo icono con texto pequeño
 * - pill: Botón con forma de píldora más visible
 * - premium: Diseño con gradientes y animaciones
 */
export function LanguageToggle({
	variant = "premium",
	className,
}: LanguageToggleProps) {
	const { language, toggleLanguage } = useLanguage();
	const { playClick } = useUISound();

	const handleToggle = () => {
		playClick();
		toggleLanguage();
	};

	const isEnglish = language === "en";

	if (variant === "minimal") {
		return (
			<button
				type="button"
				onClick={handleToggle}
				className={cn(
					"flex items-center gap-1.5 px-2 py-1 rounded-lg",
					"text-xs font-medium text-foreground/70 hover:text-foreground",
					"bg-white/5 hover:bg-white/10 border border-white/10",
					"transition-all duration-200",
					className
				)}
				aria-label={isEnglish ? "Cambiar a Español" : "Switch to English"}
				title={isEnglish ? "Cambiar a Español" : "Switch to English"}
			>
				<Globe className="w-3.5 h-3.5" />
				<span className="uppercase">{language}</span>
			</button>
		);
	}

	if (variant === "pill") {
		return (
			<button
				type="button"
				onClick={handleToggle}
				className={cn(
					"flex items-center gap-2 px-3 py-1.5 rounded-full",
					"text-sm font-semibold",
					"bg-surface/80 backdrop-blur-sm border border-border",
					"hover:bg-surface hover:border-primary/50",
					"shadow-lg shadow-black/20",
					"transition-all duration-200 transform hover:scale-105",
					className
				)}
				aria-label={isEnglish ? "Cambiar a Español" : "Switch to English"}
				title={isEnglish ? "Cambiar a Español" : "Switch to English"}
			>
				<Globe className="w-4 h-4 text-primary" />
				<span className="flex items-center gap-1">
					<span
						className={cn(
							"transition-colors",
							!isEnglish ? "text-primary" : "text-foreground/50"
						)}
					>
						ES
					</span>
					<span className="text-foreground/30">/</span>
					<span
						className={cn(
							"transition-colors",
							isEnglish ? "text-primary" : "text-foreground/50"
						)}
					>
						EN
					</span>
				</span>
			</button>
		);
	}

	// Variante premium (por defecto) - con animaciones y gradientes
	return (
		<button
			type="button"
			onClick={handleToggle}
			className={cn(
				"group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl overflow-hidden",
				"bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10",
				"dark:from-primary/20 dark:via-purple-500/20 dark:to-primary/20",
				"border border-primary/20 hover:border-primary/40",
				"shadow-lg shadow-black/10 hover:shadow-[0_0_25px_rgba(46,204,113,0.25)]",
				"transition-all duration-300",
				className
			)}
			aria-label={isEnglish ? "Cambiar a Español" : "Switch to English"}
			title={isEnglish ? "Cambiar a Español" : "Switch to English"}
		>
			{/* Efecto shimmer */}
			<span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" aria-hidden="true" />
			
			{/* Ícono con animación */}
			<span className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors duration-300">
				<Languages 
					className="w-4 h-4 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" 
					strokeWidth={2.5}
				/>
				{/* Ping de atención */}
				<span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary/0 group-hover:bg-primary animate-pulse transition-colors duration-300" aria-hidden="true" />
			</span>

			{/* Selector de idioma */}
			<span className="relative flex items-center gap-1.5">
				<span
					className={cn(
						"text-sm font-bold transition-all duration-300",
						!isEnglish 
							? "text-primary scale-110" 
							: "text-foreground/40 group-hover:text-foreground/60"
					)}
				>
					ES
				</span>
				<span className="text-foreground/20 text-xs">|</span>
				<span
					className={cn(
						"text-sm font-bold transition-all duration-300",
						isEnglish 
							? "text-primary scale-110" 
							: "text-foreground/40 group-hover:text-foreground/60"
					)}
				>
					EN
				</span>
			</span>
		</button>
	);
}
