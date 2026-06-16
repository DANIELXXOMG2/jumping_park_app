import { describe, expect, it } from "bun:test";
import type { Language } from "@/lib/i18n/dictionary";

/**
 * Tests for the pure language resolution logic extracted from LanguageContext.
 *
 * Per spec:
 * - Server provides initialLanguage via prop (required)
 * - Client-side fallback reads jp-locale cookie
 * - Defaults to "es" when nothing is available
 */

// NOTE: resolveInitialLanguage does not exist yet — RED phase.
// It will be exported from LanguageContext.tsx.
const { resolveInitialLanguage } = await import("@/contexts/LanguageContext");

describe("resolveInitialLanguage", () => {
	it("returns initialLanguage when provided from server", () => {
		expect(resolveInitialLanguage("en" as Language, undefined)).toBe(
			"en",
		);
		expect(resolveInitialLanguage("es" as Language, undefined)).toBe(
			"es",
		);
	});

	it("falls back to cookie when initialLanguage is undefined", () => {
		expect(
			resolveInitialLanguage(undefined, "en"),
		).toBe("en");
		expect(
			resolveInitialLanguage(undefined, "es"),
		).toBe("es");
	});

	it("defaults to 'es' when both initialLanguage and cookie are missing", () => {
		expect(resolveInitialLanguage(undefined, undefined)).toBe("es");
	});

	it("defaults to 'es' for unsupported cookie values", () => {
		expect(resolveInitialLanguage(undefined, "fr")).toBe("es");
	});

	it("prefers initialLanguage over cookie when both are present", () => {
		// Server says "en", cookie says "es" → server wins
		expect(
			resolveInitialLanguage("en" as Language, "es"),
		).toBe("en");
	});
});
