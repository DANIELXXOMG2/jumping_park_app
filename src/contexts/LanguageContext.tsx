"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import {
	type DictionaryKey,
	getTranslation,
	type Language,
} from "@/lib/i18n/dictionary";

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "kiosk-language";
const LOCALE_COOKIE = "jp-locale";

// ============================================================================
// PURE HELPERS (exported for testing)
// ============================================================================

/**
 * Reads the jp-locale cookie value from document.cookie.
 * Returns the cookie value or undefined if not found.
 */
function readLocaleCookie(): string | undefined {
	if (typeof document === "undefined") return undefined;

	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
	);
	return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Writes the jp-locale cookie for server-side locale persistence.
 * Client-side only — no-op during SSR.
 */
function writeLocaleCookie(lang: Language): void {
	if (typeof document === "undefined") return;

	document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; sameSite=lax`;
}

/**
 * Pure function — resolves the initial language from server prop,
 * existing cookie, or defaults to "es".
 *
 * Priority: initialLanguage (server) > cookie > "es"
 */
export function resolveInitialLanguage(
	initialLanguage: Language | undefined,
	cookieValue: string | undefined,
): Language {
	if (initialLanguage === "es" || initialLanguage === "en") {
		return initialLanguage;
	}
	if (cookieValue === "es" || cookieValue === "en") {
		return cookieValue;
	}
	return "es";
}

// ============================================================================
// TIPOS
// ============================================================================

interface LanguageContextValue {
	/** Idioma actual ('es' | 'en') */
	language: Language;
	/** Cambiar idioma */
	setLanguage: (lang: Language) => void;
	/** Alternar entre idiomas */
	toggleLanguage: () => void;
	/** Función de traducción */
	t: (
		key: DictionaryKey,
		replacements?: Record<string, string | number>,
	) => string;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const LanguageContext = createContext<LanguageContextValue | undefined>(
	undefined,
);

// ============================================================================
// PROVIDER
// ============================================================================

interface LanguageProviderProps {
	children: ReactNode;
	/** Idioma inicial desde el servidor (REQUERIDO en SSR) */
	initialLanguage: Language;
}

export function LanguageProvider({
	children,
	initialLanguage,
}: LanguageProviderProps) {
	// Resolve language on mount: server prop > cookie > default "es"
	const resolveLanguage = (): Language => {
		const cookieValue = readLocaleCookie();
		return resolveInitialLanguage(initialLanguage, cookieValue);
	};

	const [language, setLanguageState] = useState<Language>(resolveLanguage);

	// Guardar en localStorage + cookie cuando cambie
	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		try {
			localStorage.setItem(STORAGE_KEY, lang);
		} catch {
			// localStorage no disponible
		}
		writeLocaleCookie(lang);
	};

	// Alternar entre idiomas
	const toggleLanguage = () => {
		setLanguage(language === "es" ? "en" : "es");
	};

	// Función de traducción
	const t = (
		key: DictionaryKey,
		replacements?: Record<string, string | number>,
	): string => {
		return getTranslation(key, language, replacements);
	};

	const value: LanguageContextValue = {
		language,
		setLanguage,
		toggleLanguage,
		t,
	};

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para acceder al contexto de idioma.
 * Debe usarse dentro de un LanguageProvider.
 */
export function useLanguage(): LanguageContextValue {
	const context = useContext(LanguageContext);

	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}

	return context;
}
