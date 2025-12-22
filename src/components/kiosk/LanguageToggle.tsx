"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
	/** Variante de estilo */
	variant?: "minimal" | "pill";
	/** Clases adicionales */
	className?: string;
}

/**
 * Botón flotante para cambiar el idioma del Kiosco.
 *
 * Variantes:
 * - minimal: Solo icono con texto pequeño
 * - pill: Botón con forma de píldora más visible
 */
export function LanguageToggle({
	variant = "pill",
	className,
}: LanguageToggleProps) {
	const { language, toggleLanguage } = useLanguage();

	const isEnglish = language === "en";

	if (variant === "minimal") {
		return (
			<button
				type="button"
				onClick={toggleLanguage}
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

	// Variante pill (por defecto)
	return (
		<button
			type="button"
			onClick={toggleLanguage}
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
