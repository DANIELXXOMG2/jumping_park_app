import { describe, expect, it, mock } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ============================================================================
// Paths and helpers
// ============================================================================

const PROJECT_ROOT = join(import.meta.dir, "..");
const SRC = join(PROJECT_ROOT, "src");

function readSource(relativePath: string): string {
	return readFileSync(join(SRC, relativePath), "utf-8");
}

// ============================================================================
// Task 2.5: LanguageToggle uses dictionary keys for accessible labels
// ============================================================================

const TOGGLE_PATH = join(
	import.meta.dir,
	"../src/components/kiosk/LanguageToggle.tsx",
);

function readToggleSource(): string {
	return readFileSync(TOGGLE_PATH, "utf-8");
}

describe("Task 2.5 — LanguageToggle uses dictionary keys", () => {
	it("[RED 2.5a] LanguageToggle does NOT contain hardcoded 'Cambiar a Español' string", () => {
		const source = readToggleSource();
		// The hardcoded string "Cambiar a Español" should be replaced by t() call
		expect(source).not.toContain('"Cambiar a Español"');
		expect(source).not.toContain("'Cambiar a Español'");
	});

	it("[RED 2.5b] LanguageToggle does NOT contain hardcoded 'Switch to English' string", () => {
		const source = readToggleSource();
		expect(source).not.toContain('"Switch to English"');
		expect(source).not.toContain("'Switch to English'");
	});

	it("[RED 2.5c] LanguageToggle uses t('home.toggle.switchToEs') in aria-label/title", () => {
		const source = readToggleSource();
		expect(source).toContain("home.toggle.switchToEs");
	});

	it("[TRIANGULATE 2.5d] LanguageToggle uses t('home.toggle.switchToEn') in aria-label/title", () => {
		const source = readToggleSource();
		expect(source).toContain("home.toggle.switchToEn");
	});

	it("[TRIANGULATE 2.5e] ALL three variants use dictionary keys (no variant has hardcoded strings)", () => {
		const source = readToggleSource();
		// After removing all quoted string occurrences of the hardcoded labels,
		// there should be zero remaining across minimal, pill, and premium variants
		const hardcodedMatches = source.match(
			/(Cambiar a Español|Switch to English)/g,
		);
		expect(hardcodedMatches).toBeNull();
	});

	it("[TRIANGULATE 2.5f] LanguageToggle still imports useLanguage", () => {
		const source = readToggleSource();
		expect(source).toContain("useLanguage");
	});
});

// ============================================================================
// Task 2.1: HomepageHeroIsland — client island
// ============================================================================

const HERO_ISLAND_PATH = join(
	SRC,
	"components/kiosk/HomepageHeroIsland.tsx",
);

describe("Task 2.1 — HomepageHeroIsland client island", () => {
	it("[RED 2.1a] HomepageHeroIsland file exists", () => {
		expect(existsSync(HERO_ISLAND_PATH)).toBe(true);
	});

	it("[RED 2.1b] HomepageHeroIsland is a client component", () => {
		const source = readFileSync(HERO_ISLAND_PATH, "utf-8");
		expect(source).toContain('"use client"');
	});

	it("[RED 2.1c] HomepageHeroIsland renders astronaut Image with translated alt text", () => {
		const source = readFileSync(HERO_ISLAND_PATH, "utf-8");
		// Astronaut Image uses PAGE_IMAGE_VARIANTS.kioskAstronaut.src (constant reference)
		expect(source).toContain("PAGE_IMAGE_VARIANTS.kioskAstronaut");
		expect(source).toContain("alt={astronautAlt}");
	});

	it("[RED 2.1d] HomepageShell renders logo with priority for LCP", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("SecretAdminTrigger");
		expect(source).toContain("PAGE_IMAGE_VARIANTS.kioskLogo");
		expect(source).toContain("priority");
	});

	it("[TRIANGULATE 2.1e] HomepageHeroIsland imports SpaceBackground", () => {
		const source = readFileSync(HERO_ISLAND_PATH, "utf-8");
		expect(source).toContain("SpaceBackground");
	});

	it("[TRIANGULATE 2.1f] HomepageHeroIsland imports StartActionButton", () => {
		const source = readFileSync(HERO_ISLAND_PATH, "utf-8");
		expect(source).toContain("StartActionButton");
	});
});

// ============================================================================
// Task 2.2: HomepageShell — Server Component
// ============================================================================

const SHELL_PATH = join(SRC, "components/kiosk/HomepageShell.tsx");

describe("Task 2.2 — HomepageShell Server Component", () => {
	it("[RED 2.2a] HomepageShell file exists", () => {
		expect(existsSync(SHELL_PATH)).toBe(true);
	});

	it("[RED 2.2b] HomepageShell is NOT a client component (no 'use client')", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).not.toContain('"use client"');
	});

	it("[RED 2.2c] HomepageShell renders H1 with home.title.line1 and line2 keys", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("home.title.line1");
		expect(source).toContain("home.title.line2");
	});

	it("[RED 2.2d] HomepageShell renders attractions section using dictionary keys", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("home.attractions.title");
		expect(source).toContain("home.attractions.trampolines");
	});

	it("[RED 2.2e] HomepageShell renders business info section using dictionary keys", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("home.business.address");
		expect(source).toContain("home.business.phone");
	});

	it("[RED 2.2f] HomepageShell renders footer with copyright key", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("home.footer.copyright");
	});

	it("[TRIANGULATE 2.2g] HomepageShell composes HomepageHeroIsland", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		expect(source).toContain("HomepageHeroIsland");
	});

	it("[TRIANGULATE 2.2h] HomepageShell renders LanguageToggle for language switching", () => {
		const source = readFileSync(SHELL_PATH, "utf-8");
		// LanguageToggle is composed in the shell (not the island)
		expect(source).toContain("LanguageToggle");
	});
});

// ============================================================================
// Task 2.3: page.tsx rewrite — Server Component shell
// ============================================================================

const PAGE_PATH = join(SRC, "app/(public)/page.tsx");

describe("Task 2.3 — page.tsx SSR rewrite", () => {
	it("[RED 2.3a] page.tsx does NOT use 'use client'", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).not.toContain('"use client"');
	});

	it("[RED 2.3b] page.tsx uses createServerTranslator", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).toContain("createServerTranslator");
	});

	it("[RED 2.3c] page.tsx renders HomepageShell", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).toContain("HomepageShell");
	});

	it("[RED 2.3d] page.tsx does NOT import next/script", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).not.toMatch(/from\s+["']next\/script["']/);
	});

	it("[RED 2.3e] page.tsx renders JSON-LD inline (dangerouslySetInnerHTML)", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).toContain("dangerouslySetInnerHTML");
		expect(source).toContain("application/ld+json");
	});

	it("[TRIANGULATE 2.3f] page.tsx does NOT import HomepageExperience", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).not.toContain("HomepageExperience");
	});

	it("[TRIANGULATE 2.3g] page.tsx still exports metadata from landingSeo", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).toContain("buildLandingMetadata");
		expect(source).toContain("export const metadata");
	});

	it("[TRIANGULATE 2.3h] page.tsx passes locale to LanguageProvider", () => {
		const source = readFileSync(PAGE_PATH, "utf-8");
		expect(source).toContain("LanguageProvider");
		expect(source).toContain("initialLanguage=");
	});
});

// ============================================================================
// Task 2.4: layout.tsx — dynamic <html lang>
// ============================================================================

const LAYOUT_PATH = join(SRC, "app/layout.tsx");

describe("Task 2.4 — layout.tsx dynamic html lang", () => {
	it("[RED 2.4a] layout.tsx imports cookies from next/headers", () => {
		const source = readFileSync(LAYOUT_PATH, "utf-8");
		expect(source).toContain("next/headers");
	});

	it("[RED 2.4b] layout.tsx is async (to read cookies)", () => {
		const source = readFileSync(LAYOUT_PATH, "utf-8");
		expect(source).toMatch(/async\s+function\s+RootLayout/);
	});

	it("[RED 2.4c] layout.tsx uses cookie value for html lang attribute", () => {
		const source = readFileSync(LAYOUT_PATH, "utf-8");
		expect(source).toContain("jp-locale");
	});

	it("[TRIANGULATE 2.4d] layout.tsx defaults html lang to 'es'", () => {
		const source = readFileSync(LAYOUT_PATH, "utf-8");
		// Default value should still be "es" when cookie is missing
		expect(source).toContain('"es"');
	});
});

// ============================================================================
// Task 2.6: Delete HomepageExperience + update test references
// ============================================================================

const OLD_EXPERIENCE_PATH = join(
	SRC,
	"components/kiosk/HomepageExperience.tsx",
);

describe("Task 2.6 — HomepageExperience deletion", () => {
	it("[RED 2.6a] HomepageExperience.tsx no longer exists", () => {
		expect(existsSync(OLD_EXPERIENCE_PATH)).toBe(false);
	});

	it("[RED 2.6b] global-viewport test no longer imports HomepageExperience", () => {
		const testPath = join(PROJECT_ROOT, "tests", "global-viewport-consentimiento-a11y.test.tsx");
		const testSource = readFileSync(testPath, "utf-8");
		expect(testSource).not.toContain("HomepageExperience");
	});

	it("[RED 2.6c] landing-page test references HomepageShell instead of HomepageExperience", () => {
		const testPath = join(PROJECT_ROOT, "tests", "landing-page.test.ts");
		const testSource = readFileSync(testPath, "utf-8");
		expect(testSource).toContain("HomepageShell");
		expect(testSource).not.toContain("HomepageExperience");
	});

	it("[TRIANGULATE 2.6d] seo-geo-core-vitals test references HomepageHeroIsland for solar-system/lighthouse checks", () => {
		const testPath = join(PROJECT_ROOT, "tests", "seo-geo-core-vitals.test.ts");
		const testSource = readFileSync(testPath, "utf-8");
		expect(testSource).toContain("HomepageHeroIsland");
		expect(testSource).not.toContain("HomepageExperience");
	});
});
