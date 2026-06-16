import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";

/**
 * Tests for parseAcceptLanguage() — extracted from proxy.ts.
 *
 * The function parses an Accept-Language header and returns
 * the first supported locale ("es" | "en"), defaulting to "es".
 */

const { parseAcceptLanguage, proxy } = await import("@/proxy");

describe("parseAcceptLanguage", () => {
	it("returns 'es' for Spanish-priority Accept-Language", () => {
		expect(parseAcceptLanguage("es-CO,en;q=0.9")).toBe("es");
	});

	it("returns 'en' for English-only Accept-Language", () => {
		expect(parseAcceptLanguage("en-US")).toBe("en");
	});

	it("returns 'es' when header is null (missing)", () => {
		expect(parseAcceptLanguage(null)).toBe("es");
	});

	it("returns 'es' when header is empty string", () => {
		expect(parseAcceptLanguage("")).toBe("es");
	});

	it("returns 'es' for unsupported language (French)", () => {
		expect(parseAcceptLanguage("fr-FR,fr;q=0.9")).toBe("es");
	});

	it("returns 'en' for English-priority mixed header", () => {
		expect(parseAcceptLanguage("en-US,es;q=0.9")).toBe("en");
	});

	it("returns 'es' for bare 'es' tag", () => {
		expect(parseAcceptLanguage("es")).toBe("es");
	});

	it("returns 'en' for bare 'en' tag", () => {
		expect(parseAcceptLanguage("en")).toBe("en");
	});
});

// ============================================================================
// Integration: proxy() sets jp-locale cookie from Accept-Language
// ============================================================================

function createLocaleRequest(pathname: string, opts?: {
	acceptLanguage?: string;
	locoleCookie?: string;
}): NextRequest {
	const headers: Record<string, string> = {};
	if (opts?.acceptLanguage) {
		headers["Accept-Language"] = opts.acceptLanguage;
	}
	if (opts?.locoleCookie) {
		headers.cookie = `jp-locale=${opts.locoleCookie}`;
	}
	return new NextRequest(`https://example.com${pathname}`, { headers });
}

function getCookieValue(response: Response, cookieName: string): string | null {
	const setCookie = response.headers.get("set-cookie");
	if (!setCookie) return null;
	const match = setCookie.match(
		new RegExp(`${cookieName}=([^;]+)`),
	);
	return match ? match[1] : null;
}

describe("proxy locale detection", () => {
	it("sets jp-locale=es from Accept-Language: es-CO", async () => {
		const response = await proxy(
			createLocaleRequest("/", { acceptLanguage: "es-CO" }),
		);
		expect(getCookieValue(response, "jp-locale")).toBe("es");
	});

	it("sets jp-locale=en from Accept-Language: en-US", async () => {
		const response = await proxy(
			createLocaleRequest("/", { acceptLanguage: "en-US" }),
		);
		expect(getCookieValue(response, "jp-locale")).toBe("en");
	});

	it("defaults to es when Accept-Language is missing", async () => {
		const response = await proxy(createLocaleRequest("/"));
		expect(getCookieValue(response, "jp-locale")).toBe("es");
	});

	it("skips cookie when jp-locale already present", async () => {
		const response = await proxy(
			createLocaleRequest("/", {
				acceptLanguage: "es-CO",
				locoleCookie: "en",
			}),
		);
		// Should NOT overwrite existing cookie
		expect(getCookieValue(response, "jp-locale")).toBeNull();
	});

	it("does NOT set jp-locale on sub-paths like /ingreso", async () => {
		const response = await proxy(
			createLocaleRequest("/ingreso", { acceptLanguage: "en-US" }),
		);
		expect(getCookieValue(response, "jp-locale")).toBeNull();
	});
});
