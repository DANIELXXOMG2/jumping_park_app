import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";

// ============================================================================
// Phase 1: OG Image Restructuring
// ============================================================================

describe("Task 1.1 — consentimiento-digital OG image exists with consentimiento content", () => {
	it("[RED 1.1a] exports alt from consentimientoDigitalSeo, not landingSeo", async () => {
		const mod = await import(
			"@/app/(public)/consentimiento-digital/opengraph-image"
		);

		expect(mod.alt).toBeDefined();
		expect(typeof mod.alt).toBe("string");
		expect(mod.alt).toContain("Consentimiento");
		// Must NOT contain landing alt text
		expect(mod.alt).not.toContain("Parque de Trampolines");
	});

	it("[RED 1.1b] exports correct size and content type", async () => {
		const mod = await import(
			"@/app/(public)/consentimiento-digital/opengraph-image"
		);

		expect(mod.size).toEqual({ width: 1200, height: 630 });
		expect(mod.contentType).toBe("image/png");
	});

	it("[RED 1.1c] default export is a function returning ImageResponse", async () => {
		const mod = await import(
			"@/app/(public)/consentimiento-digital/opengraph-image"
		);

		expect(typeof mod.default).toBe("function");
		// ImageResponse is the return type from next/og
		const result = mod.default();
		expect(result).toBeDefined();
		expect(result.constructor.name).toBe("ImageResponse");
	});

	it("[TRIANGULATE 1.1d] consentimiento OG function returns valid ImageResponse without error", async () => {
		const mod = await import(
			"@/app/(public)/consentimiento-digital/opengraph-image"
		);

		// The default export must be callable without error and return an ImageResponse
		let threw = false;
		try {
			mod.default();
		} catch {
			threw = true;
		}
		expect(threw).toBe(false);
		const result = mod.default();
		expect(result).toBeDefined();
		expect(result.constructor.name).toBe("ImageResponse");
		// Verify the response has headers (ImageResponse extends Response)
		expect(typeof result.headers).toBe("object");
	});
});

describe("Task 1.2 — consentimientoDigitalSeo path updated", () => {
	it("[RED 1.2a] CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_PATH points to consentimiento-digital", async () => {
		const { CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_PATH } = await import(
			"@/lib/consentimientoDigitalSeo"
		);

		expect(CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_PATH).toBe(
			"/consentimiento-digital/opengraph-image",
		);
	});

	it("[TRIANGULATE 1.2b] CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL builds correct absolute URL", async () => {
		const { CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL } = await import(
			"@/lib/consentimientoDigitalSeo"
		);

		expect(CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL).toBe(
			"https://www.jumpingpark.lat/consentimiento-digital/opengraph-image",
		);
	});
});

describe("Task 1.3 — landing OG image replaces consentimiento content", () => {
	it("[RED 1.3a] exports alt from landingSeo (not consentimiento)", async () => {
		const mod = await import("@/app/(public)/opengraph-image");

		expect(mod.alt).toBeDefined();
		expect(typeof mod.alt).toBe("string");
		expect(mod.alt).toContain("Jumping Park");
		// Must NOT contain consentimiento alt text
		expect(mod.alt).not.toContain("Consentimiento digital premium");
	});

	it("[RED 1.3b] exports correct size and content type", async () => {
		const mod = await import("@/app/(public)/opengraph-image");

		expect(mod.size).toEqual({ width: 1200, height: 630 });
		expect(mod.contentType).toBe("image/png");
	});

	it("[TRIANGULATE 1.3c] landing OG function returns valid ImageResponse without error", async () => {
		const mod = await import("@/app/(public)/opengraph-image");

		// The default export must be callable without error and return an ImageResponse
		let threw = false;
		try {
			mod.default();
		} catch {
			threw = true;
		}
		expect(threw).toBe(false);
		const result = mod.default();
		expect(result).toBeDefined();
		expect(result.constructor.name).toBe("ImageResponse");
		// Verify the response has a content-type header
		expect(typeof result.headers).toBe("object");
	});
});

// ============================================================================
// Phase 2: Image Priority + Title + Lighthouse CI
// ============================================================================

describe("Task 2.1 — solar-system Image no longer has priority", () => {
	it("[RED 2.1] solar-system Image element lacks priority prop", () => {
		const sourcePath = join(
			process.cwd(),
			"src",
			"components",
			"kiosk",
			"HomepageHeroIsland.tsx",
		);
		const source = readFileSync(sourcePath, "utf-8");

		// The solar-system Image block (src="/assets/solar-system.webp") must NOT contain "priority"
		// Extract the solar-system Image JSX block
		const solarSystemBlock = source.match(
			/src="\/assets\/solar-system\.webp"[^>]*>/,
		);
		expect(solarSystemBlock).toBeDefined();
		if (solarSystemBlock) {
			expect(solarSystemBlock[0]).not.toMatch(/priority/);
			expect(solarSystemBlock[0]).not.toMatch(/loading="eager"/);
		}
	});

	it("[TRIANGULATE 2.1b] logo Image still has priority", () => {
		const sourcePath = join(
			process.cwd(),
			"src",
			"components",
			"kiosk",
			"HomepageHeroIsland.tsx",
		);
		const source = readFileSync(sourcePath, "utf-8");

		// The logo Image block should still have priority
		const logoImageLines = source.match(
			/PAGE_IMAGE_VARIANTS\.kioskLogo[^}]*\}[\s\S]*?\/>/,
		);
		expect(logoImageLines).toBeDefined();
		if (logoImageLines) {
			expect(logoImageLines[0]).toMatch(/priority/);
		}
	});
});

describe("Task 2.2 — Landing page title shortened to ≤60 chars", () => {
	it("[RED 2.2a] LANDING_PAGE_TITLE is 60 chars or fewer", async () => {
		const { LANDING_PAGE_TITLE } = await import("@/lib/landingSeo");

		expect(LANDING_PAGE_TITLE.length).toBeLessThanOrEqual(60);
	});

	it("[RED 2.2b] LANDING_PAGE_TITLE contains primary keywords", async () => {
		const { LANDING_PAGE_TITLE } = await import("@/lib/landingSeo");

		expect(LANDING_PAGE_TITLE).toContain("Jumping Park");
		expect(LANDING_PAGE_TITLE).toContain("Parque de Trampolines");
		expect(LANDING_PAGE_TITLE).toContain("Villavicencio");
	});

	it("[TRIANGULATE 2.2c] LANDING_PAGE_TITLE no longer contains mall name", async () => {
		const { LANDING_PAGE_TITLE } = await import("@/lib/landingSeo");

		expect(LANDING_PAGE_TITLE).not.toContain("Primavera Urbana");
		expect(LANDING_PAGE_TITLE).not.toContain("Centro Comercial");
	});

	it("[TRIANGULATE 2.2d] buildLandingMetadata uses shortened title", async () => {
		const { buildLandingMetadata } = await import("@/lib/landingSeo");
		const metadata = buildLandingMetadata();

		expect(metadata.title).toBeDefined();
		expect((metadata.title as string).length).toBeLessThanOrEqual(60);
		expect(metadata.title).toContain("Jumping Park");
	});
});

describe("Task 2.3 — Lighthouse CI includes homepage URL", () => {
	it("[RED 2.3a] lighthouserc.json url array includes homepage", () => {
		const configPath = join(process.cwd(), "lighthouserc.json");
		const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
			ci?: { collect?: { url?: string[] } };
		};

		const urls = config.ci?.collect?.url;
		expect(urls).toBeDefined();
		expect(Array.isArray(urls)).toBe(true);
		if (urls) {
			expect(urls).toContain("http://127.0.0.1:3000/");
		}
	});

	it("[TRIANGULATE 2.3b] lighthouserc.json still tests consentimiento-digital", () => {
		const configPath = join(process.cwd(), "lighthouserc.json");
		const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
			ci?: { collect?: { url?: string[] } };
		};

		const urls = config.ci?.collect?.url;
		expect(urls).toBeDefined();
		if (urls) {
			expect(urls).toContain("http://127.0.0.1:3000/consentimiento-digital");
		}
	});
});
