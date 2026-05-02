"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Hook para detectar si estamos en el cliente (evita hydration mismatch)
function useIsMounted() {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
}

/**
 * Botón premium para alternar entre modos de tema.
 * Diseño con gradientes, animaciones y efectos visuales.
 */
export function ThemeToggle() {
	const { setTheme, resolvedTheme } = useTheme();
	const { t } = useLanguage();
	const isMounted = useIsMounted();

	if (!isMounted) {
		return (
			<button
				type="button"
				className="p-2.5 rounded-xl bg-surface-muted/50 text-text-secondary animate-pulse"
				aria-label={t("theme.loading")}
				disabled
			>
				<div className="w-5 h-5" />
			</button>
		);
	}

	const isDark = resolvedTheme === "dark";

	const toggleTheme = () => {
		setTheme(isDark ? "light" : "dark");
	};

	const toggleLabel = isDark
		? t("theme.switchToLight")
		: t("theme.switchToDark");

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={cn(
				"group relative inline-flex items-center justify-center",
				"p-3 rounded-xl overflow-hidden",
				// Fondo con gradiente sutil
				"bg-gradient-to-br",
				isDark
					? "from-indigo-500/10 via-purple-500/10 to-indigo-500/10"
					: "from-amber-500/10 via-orange-500/10 to-amber-500/10",
				// Borde dinámico
				"border",
				isDark
					? "border-indigo-500/20 hover:border-indigo-400/40"
					: "border-amber-500/20 hover:border-amber-400/40",
				// Sombra y glow
				"shadow-lg",
				isDark
					? "shadow-indigo-500/10 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
					: "shadow-amber-500/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]",
				// Transiciones
				"transition-all duration-300",
				// Focus
				"focus-visible:outline-none focus-visible:ring-2",
				isDark
					? "focus-visible:ring-indigo-500/40"
					: "focus-visible:ring-amber-500/40",
			)}
			aria-label={toggleLabel}
			aria-pressed={isDark}
			title={toggleLabel}
		>
			{/* Efecto shimmer */}
			<span
				className={cn(
					"absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent to-transparent",
					isDark ? "via-indigo-400/20" : "via-amber-400/20",
				)}
				aria-hidden="true"
			/>

			{/* Ícono con animación */}
			<span className="relative">
				{isDark ? (
					<Moon
						className={cn(
							"w-5 h-5 transition-all duration-300",
							"text-indigo-400 group-hover:text-indigo-300",
							"group-hover:scale-110 group-hover:-rotate-12",
						)}
						strokeWidth={2}
					/>
				) : (
					<Sun
						className={cn(
							"w-5 h-5 transition-all duration-300",
							"text-amber-500 group-hover:text-amber-400",
							"group-hover:scale-110 group-hover:rotate-45",
						)}
						strokeWidth={2}
					/>
				)}

				{/* Partículas decorativas */}
				<span
					className={cn(
						"absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full",
						"opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300",
						isDark ? "bg-indigo-400" : "bg-amber-400",
					)}
					aria-hidden="true"
				/>
				<span
					className={cn(
						"absolute -bottom-0.5 -left-0.5 w-1 h-1 rounded-full",
						"opacity-0 group-hover:opacity-100 animate-pulse delay-150 transition-opacity duration-300",
						isDark ? "bg-purple-400" : "bg-orange-400",
					)}
					aria-hidden="true"
				/>
			</span>
		</button>
	);
}

/**
 * Variante compacta para usar en navbars (admin)
 * Nota: No usa LanguageContext porque el admin no tiene i18n
 */
export function ThemeToggleCompact() {
	const { setTheme, resolvedTheme } = useTheme();
	const isMounted = useIsMounted();

	if (!isMounted) {
		return <div className="w-9 h-9" />;
	}

	const isDark = resolvedTheme === "dark";

	const toggleTheme = () => {
		setTheme(isDark ? "light" : "dark");
	};

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={cn(
				"group relative p-2 rounded-lg overflow-hidden",
				"text-text-muted hover:text-text-primary",
				"hover:bg-surface-muted dark:hover:bg-surface",
				"transition-all duration-200",
			)}
			aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
			aria-pressed={isDark}
		>
			{/* Efecto shimmer sutil */}
			<span
				className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"
				aria-hidden="true"
			/>

			{isDark ? (
				<Sun className="w-5 h-5 relative group-hover:rotate-45 transition-transform duration-300" />
			) : (
				<Moon className="w-5 h-5 relative group-hover:-rotate-12 transition-transform duration-300" />
			)}
		</button>
	);
}
