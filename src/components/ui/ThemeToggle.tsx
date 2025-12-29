"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Hook para detectar si estamos en el cliente (evita hydration mismatch)
function useIsMounted() {
	return useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
}

/**
 * Botón discreto para alternar entre modos de tema.
 * Solo 2 estados: light ↔ dark (simplificado)
 */
export function ThemeToggle() {
	const { setTheme, resolvedTheme } = useTheme();
	const { t } = useLanguage();
	const isMounted = useIsMounted();

	if (!isMounted) {
		return (
			<button
				type="button"
				className="p-2 rounded-lg bg-surface-muted text-text-secondary"
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

	const label = isDark ? t("theme.dark") : t("theme.light");
	const toggleLabel = isDark ? t("theme.switchToLight") : t("theme.switchToDark");

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="
        p-2.5 rounded-xl
        bg-surface dark:bg-surface-muted
        border border-border dark:border-border-muted
        text-text-secondary dark:text-text-muted
        hover:bg-surface-muted dark:hover:bg-surface
        hover:text-text-primary dark:hover:text-text-primary
        transition-all duration-200
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-brand-blue/30
      "
			aria-label={toggleLabel}
			aria-pressed={isDark}
			title={toggleLabel}
		>
			{isDark ? (
				<Moon className="w-5 h-5" />
			) : (
				<Sun className="w-5 h-5" />
			)}
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
			className="
        p-2 rounded-lg
        text-text-muted hover:text-text-primary
        hover:bg-surface-muted dark:hover:bg-surface
        transition-colors duration-150
      "
			aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
			aria-pressed={isDark}
		>
			{isDark ? (
				<Sun className="w-5 h-5" />
			) : (
				<Moon className="w-5 h-5" />
			)}
		</button>
	);
}
