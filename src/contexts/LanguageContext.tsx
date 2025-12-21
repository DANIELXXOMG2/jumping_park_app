"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import {
	type DictionaryKey,
	type Language,
	getTranslation,
} from "@/lib/i18n/dictionary";

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
	t: (key: DictionaryKey, replacements?: Record<string, string | number>) => string;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "kiosk-language";

/**
 * Detecta el idioma preferido del navegador.
 * Retorna 'en' si el navegador está en inglés, 'es' por defecto.
 */
function detectBrowserLanguage(): Language {
	if (typeof window === "undefined") return "es";

	const browserLang = navigator.language || navigator.languages?.[0] || "es";
	const langCode = browserLang.split("-")[0].toLowerCase();

	return langCode === "en" ? "en" : "es";
}

/**
 * Obtiene el idioma guardado en localStorage o detecta del navegador.
 */
function getInitialLanguage(): Language {
	if (typeof window === "undefined") return "es";

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "es" || stored === "en") {
			return stored;
		}
	} catch {
		// localStorage no disponible
	}

	return detectBrowserLanguage();
}

// ============================================================================
// PROVIDER
// ============================================================================

interface LanguageProviderProps {
	children: ReactNode;
	/** Idioma inicial (opcional, si no se provee se detecta automáticamente) */
	defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage }: LanguageProviderProps) {
	// Inicializar con el idioma por defecto o 'es' para evitar hydration mismatch
	const [language, setLanguageState] = useState<Language>(
		defaultLanguage || "es"
	);
	const [isInitialized, setIsInitialized] = useState(false);

	// Detectar idioma del navegador en el cliente (solo una vez)
	useEffect(() => {
		const initLanguage = () => {
			if (!defaultLanguage) {
				const initialLang = getInitialLanguage();
				setLanguageState(initialLang);
			}
			setIsInitialized(true);
		};

		// Usar requestAnimationFrame para evitar el warning de setState síncrono
		const rafId = requestAnimationFrame(initLanguage);
		return () => cancelAnimationFrame(rafId);
	}, [defaultLanguage]);

	// Guardar en localStorage cuando cambie
	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		try {
			localStorage.setItem(STORAGE_KEY, lang);
		} catch {
			// localStorage no disponible
		}
	}, []);

	// Alternar entre idiomas
	const toggleLanguage = useCallback(() => {
		setLanguage(language === "es" ? "en" : "es");
	}, [language, setLanguage]);

	// Función de traducción
	const t = useCallback(
		(key: DictionaryKey, replacements?: Record<string, string | number>): string => {
			return getTranslation(key, language, replacements);
		},
		[language]
	);

	const value: LanguageContextValue = {
		language,
		setLanguage,
		toggleLanguage,
		t,
	};

	// Evitar flash de contenido incorrecto en SSR
	if (!isInitialized) {
		return (
			<LanguageContext.Provider value={value}>
				{children}
			</LanguageContext.Provider>
		);
	}

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

/**
 * Hook simplificado que solo retorna la función de traducción.
 */
export function useTranslation() {
	const { t, language } = useLanguage();
	return { t, language };
}
