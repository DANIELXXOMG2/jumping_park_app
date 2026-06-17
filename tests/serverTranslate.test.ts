import { describe, expect, it } from "bun:test";

/**
 * Tests for serverTranslate.ts — pure function + thin wrapper over cookies().
 *
 * resolveLocale() is pure: maps cookie value (or undefined) to a Language.
 * createServerTranslator() wraps cookies() → resolveLocale() → getTranslation().
 * An optional cookieStore parameter allows injection for testing.
 */

// This import will fail — serverTranslate.ts does not exist yet (RED phase).
const {
	resolveLocale,
	createServerTranslator,
} = await import("@/lib/i18n/serverTranslate");

// ============================================================================
// Unit: resolveLocale (pure — zero mocks needed)
// ============================================================================

describe("resolveLocale", () => {
	it("returns 'es' when cookie value is 'es'", () => {
		expect(resolveLocale("es")).toBe("es");
	});

	it("returns 'en' when cookie value is 'en'", () => {
		expect(resolveLocale("en")).toBe("en");
	});

	it("defaults to 'es' when cookie value is undefined", () => {
		expect(resolveLocale(undefined)).toBe("es");
	});

	it("defaults to 'es' for unsupported language like 'fr'", () => {
		expect(resolveLocale("fr")).toBe("es");
	});

	it("defaults to 'es' when cookie value is empty string", () => {
		expect(resolveLocale("")).toBe("es");
	});
});

// ============================================================================
// Integration: createServerTranslator with injected mock cookieStore
// ============================================================================

interface CookieStore {
	get: (name: string) => { value: string } | undefined;
}

function mockStore(cookieValue: string | undefined): CookieStore {
	return {
		get: (name: string) =>
			name === "jp-locale" && cookieValue !== undefined
				? { value: cookieValue }
				: undefined,
	};
}

describe("createServerTranslator", () => {
	it("resolves Spanish text when cookie is 'es'", async () => {
		const { t, locale } = await createServerTranslator(mockStore("es"));
		expect(locale).toBe("es");
		expect(t("home.title.line1")).toBe("¿Listo para");
	});

	it("resolves English text when cookie is 'en'", async () => {
		const { t, locale } = await createServerTranslator(mockStore("en"));
		expect(locale).toBe("en");
		expect(t("home.title.line1")).toBe("Ready to");
	});

	it("defaults to Spanish when cookie is missing", async () => {
		const { t, locale } = await createServerTranslator(
			mockStore(undefined),
		);
		expect(locale).toBe("es");
		expect(t("home.title.line1")).toBe("¿Listo para");
	});

	it("supports replacement placeholders in translations", async () => {
		const { t } = await createServerTranslator(mockStore("es"));
		const result = t("ingreso.hint", { min: 10 });
		expect(result).toBe(
			"Letras y números, sin espacios. Mínimo 10 caracteres.",
		);
	});

	it("returns the raw key for unknown dictionary entries", async () => {
		const { t } = await createServerTranslator(mockStore("es"));
		expect(t("nonexistent.key" as never)).toBe("nonexistent.key");
	});
});
