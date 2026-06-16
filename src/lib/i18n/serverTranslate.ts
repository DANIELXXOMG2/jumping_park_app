import { cookies } from "next/headers";
import {
	type DictionaryKey,
	getTranslation,
	type Language,
} from "./dictionary";

const LOCALE_COOKIE = "jp-locale";

/**
 * Pure function — maps a cookie value (or undefined) to a valid Language.
 * Defaults to "es" when the value is missing or unsupported.
 */
export function resolveLocale(cookieValue: string | undefined): Language {
	if (!cookieValue) return "es";
	if (cookieValue === "es" || cookieValue === "en") return cookieValue;
	return "es";
}

interface CookieStore {
	get: (name: string) => { value: string } | undefined;
}

/**
 * Creates a server-safe translator bound to the locale from the jp-locale cookie.
 *
 * Accepts an optional cookieStore for test injection.
 * In production, reads `cookies()` from `next/headers`.
 *
 * @returns { t, locale } — a bound translation function and the resolved locale.
 */
export async function createServerTranslator(
	cookieStore?: CookieStore,
): Promise<{
	t: (
		key: DictionaryKey,
		replacements?: Record<string, string | number>,
	) => string;
	locale: Language;
}> {
	const store = cookieStore ?? (await cookies());
	const cookieValue = store.get(LOCALE_COOKIE)?.value;
	const locale = resolveLocale(cookieValue);

	return {
		locale,
		t: (key, replacements) => getTranslation(key, locale, replacements),
	};
}
