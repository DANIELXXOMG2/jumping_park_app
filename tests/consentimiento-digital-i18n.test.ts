import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	dictionary,
	getTranslation,
	type DictionaryKey,
} from "@/lib/i18n/dictionary";

// ============================================================================
// Helpers
// ============================================================================

const PROJECT_ROOT = join(import.meta.dir, "..");
const SRC = join(PROJECT_ROOT, "src");

function readSource(relativePath: string): string {
	return readFileSync(join(SRC, relativePath), "utf-8");
}

const PAGE_SOURCE_PATH = "app/(public)/consentimiento-digital/page.tsx";

// ============================================================================
// All consentDigital.* dictionary keys (91 keys)
// ============================================================================

const CONSENT_DIGITAL_KEYS: string[] = [
	// tagline, country, cityRegion, mallName (4)
	"consentDigital.tagline",
	"consentDigital.country",
	"consentDigital.cityRegion",
	"consentDigital.mallName",

	// stats (3)
	"consentDigital.stats.ratingLabel",
	"consentDigital.stats.visitorsLabel",
	"consentDigital.stats.trampolinesLabel",

	// attractions (7: title + item1-6)
	"consentDigital.attractions.title",
	"consentDigital.attractions.item1",
	"consentDigital.attractions.item2",
	"consentDigital.attractions.item3",
	"consentDigital.attractions.item4",
	"consentDigital.attractions.item5",
	"consentDigital.attractions.item6",

	// hours (2)
	"consentDigital.hours.weekdays",
	"consentDigital.hours.weekends",

	// header (4)
	"consentDigital.header.logoAlt",
	"consentDigital.header.navProcess",
	"consentDigital.header.navFaq",
	"consentDigital.header.ctaButton",

	// hero (10: title1, title2, subtitle, ctaPrimary, ctaSecondary, ctaWhatsApp,
	//        ctaWhatsAppAria, imageAlt, imageCaption1, imageCaption2)
	"consentDigital.hero.title1",
	"consentDigital.hero.title2",
	"consentDigital.hero.subtitle",
	"consentDigital.hero.ctaPrimary",
	"consentDigital.hero.ctaSecondary",
	"consentDigital.hero.ctaWhatsApp",
	"consentDigital.hero.ctaWhatsAppAria",
	"consentDigital.hero.imageAlt",
	"consentDigital.hero.imageCaption1",
	"consentDigital.hero.imageCaption2",

	// process (12: title, subtitle, step1-3.title/description/duration, requirementsTitle)
	"consentDigital.process.title",
	"consentDigital.process.subtitle",
	"consentDigital.process.step1.title",
	"consentDigital.process.step1.description",
	"consentDigital.process.step1.duration",
	"consentDigital.process.step2.title",
	"consentDigital.process.step2.description",
	"consentDigital.process.step2.duration",
	"consentDigital.process.step3.title",
	"consentDigital.process.step3.description",
	"consentDigital.process.step3.duration",
	"consentDigital.process.requirementsTitle",

	// requirements (8: item1-4, detail1-4)
	"consentDigital.requirements.item1",
	"consentDigital.requirements.item2",
	"consentDigital.requirements.item3",
	"consentDigital.requirements.item4",
	"consentDigital.requirements.detail1",
	"consentDigital.requirements.detail2",
	"consentDigital.requirements.detail3",
	"consentDigital.requirements.detail4",

	// benefits (8: title, subtitle, item1-3.title/description)
	"consentDigital.benefits.title",
	"consentDigital.benefits.subtitle",
	"consentDigital.benefits.item1.title",
	"consentDigital.benefits.item1.description",
	"consentDigital.benefits.item2.title",
	"consentDigital.benefits.item2.description",
	"consentDigital.benefits.item3.title",
	"consentDigital.benefits.item3.description",

	// faq (10: title, subtitle, q1-4.question/answer)
	"consentDigital.faq.title",
	"consentDigital.faq.subtitle",
	"consentDigital.faq.q1.question",
	"consentDigital.faq.q1.answer",
	"consentDigital.faq.q2.question",
	"consentDigital.faq.q2.answer",
	"consentDigital.faq.q3.question",
	"consentDigital.faq.q3.answer",
	"consentDigital.faq.q4.question",
	"consentDigital.faq.q4.answer",

	// about (2)
	"consentDigital.about.title",
	"consentDigital.about.description",

	// contact (4)
	"consentDigital.contact.title",
	"consentDigital.contact.callUs",
	"consentDigital.contact.followInstagramAria",
	"consentDigital.contact.followFacebookAria",

	// ctaFinal (6)
	"consentDigital.ctaFinal.title",
	"consentDigital.ctaFinal.subtitle",
	"consentDigital.ctaFinal.buttonPrimary",
	"consentDigital.ctaFinal.buttonWhatsApp",
	"consentDigital.ctaFinal.buttonWhatsAppAria",
	"consentDigital.ctaFinal.timeNote",

	// footer (11)
	"consentDigital.footer.logoAlt",
	"consentDigital.footer.tagline",
	"consentDigital.footer.quickLinks",
	"consentDigital.footer.linkStartRegistration",
	"consentDigital.footer.linkHowItWorks",
	"consentDigital.footer.linkFaq",
	"consentDigital.footer.contact",
	"consentDigital.footer.followUs",
	"consentDigital.footer.instagramAria",
	"consentDigital.footer.facebookAria",
	"consentDigital.footer.copyright",
];

// ============================================================================
// CYCLE 1 — Dictionary Keys
// ============================================================================

describe("CYCLE 1 — consentDigital dictionary keys exist", () => {
	for (const keyName of CONSENT_DIGITAL_KEYS) {
		it(`[RED 1a] key "${keyName}" exists in dictionary`, () => {
			expect(keyName in dictionary).toBe(true);
		});
	}

	for (const keyName of CONSENT_DIGITAL_KEYS) {
		it(`[RED 1b] key "${keyName}" has non-empty Spanish translation`, () => {
			const result = getTranslation(keyName as DictionaryKey, "es");
			expect(result).toBeString();
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe(keyName);
		});
	}

	for (const keyName of CONSENT_DIGITAL_KEYS) {
		it(`[RED 1c] key "${keyName}" has non-empty English translation`, () => {
			const result = getTranslation(keyName as DictionaryKey, "en");
			expect(result).toBeString();
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe(keyName);
		});
	}
});

// ============================================================================
// CYCLE 1 — Specific content assertions (spot checks)
// ============================================================================

describe("CYCLE 1 — consentDigital dictionary content spot checks", () => {
	it("[RED 1d] consentDigital.hero.title1 is 'Firma tu consentimiento' in es", () => {
		expect(
			getTranslation("consentDigital.hero.title1" as DictionaryKey, "es"),
		).toBe("Firma tu consentimiento");
	});

	it("[RED 1e] consentDigital.hero.title1 is 'Sign your consent' in en", () => {
		expect(
			getTranslation("consentDigital.hero.title1" as DictionaryKey, "en"),
		).toBe("Sign your consent");
	});

	it("[RED 1f] consentDigital.hero.title2 is 'antes de llegar' in es", () => {
		expect(
			getTranslation("consentDigital.hero.title2" as DictionaryKey, "es"),
		).toBe("antes de llegar");
	});

	it("[RED 1g] consentDigital.hero.title2 is 'before arriving' in en", () => {
		expect(
			getTranslation("consentDigital.hero.title2" as DictionaryKey, "en"),
		).toBe("before arriving");
	});

	it("[RED 1h] consentDigital.header.ctaButton is 'Iniciar registro' in es", () => {
		expect(
			getTranslation("consentDigital.header.ctaButton" as DictionaryKey, "es"),
		).toBe("Iniciar registro");
	});

	it("[RED 1i] consentDigital.header.ctaButton is 'Start registration' in en", () => {
		expect(
			getTranslation("consentDigital.header.ctaButton" as DictionaryKey, "en"),
		).toBe("Start registration");
	});

	it("[RED 1j] consentDigital.footer.copyright contains {appName} template", () => {
		const esResult = getTranslation(
			"consentDigital.footer.copyright" as DictionaryKey,
			"es",
		);
		expect(esResult).toContain("{appName}");
	});
});

// ============================================================================
// CYCLE 2 — Page uses createServerTranslator (RED phase)
// ============================================================================

describe("CYCLE 2 — page.tsx uses createServerTranslator", () => {
	it("[RED 2a] page.tsx imports createServerTranslator", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("createServerTranslator");
	});

	it("[RED 2b] page.tsx is an async function (Server Component)", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toMatch(/async\s+function\s+ConsentimientoDigitalPage/);
	});

	it("[RED 2c] page.tsx does NOT use 'use client'", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).not.toContain('"use client"');
	});

	it("[RED 2d] page.tsx imports LanguageProvider", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("LanguageProvider");
	});

	it("[RED 2e] page.tsx wraps content in LanguageProvider with initialLanguage", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("LanguageProvider");
		expect(source).toContain("initialLanguage");
	});

	it("[RED 2f] page.tsx uses t() for consentDigital keys (no hardcoded 'Firma tu consentimiento')", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		// The hardcoded H1 string should not appear as a raw string literal
		expect(source).not.toContain('"Firma tu consentimiento"');
		expect(source).not.toContain("'Firma tu consentimiento'");
	});

	it("[RED 2g] page.tsx uses t() for consentDigital keys (no hardcoded 'Como funciona')", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).not.toContain('"Como funciona"');
		expect(source).not.toContain("'Como funciona'");
	});

	it("[RED 2h] page.tsx uses t() for consentDigital keys (no hardcoded 'Preguntas')", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).not.toContain('"Preguntas"');
		expect(source).not.toContain("'Preguntas'");
	});

	it("[RED 2i] page.tsx uses consentDigital dictionary key references", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("consentDigital.hero.title1");
		expect(source).toContain("consentDigital.header.ctaButton");
	});
});

// ============================================================================
// CYCLE 3 — LanguageToggle in header (RED phase)
// ============================================================================

describe("CYCLE 3 — LanguageToggle in header", () => {
	it("[RED 3a] page.tsx imports LanguageToggle", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("LanguageToggle");
	});

	it("[RED 3b] page.tsx renders LanguageToggle in the header nav", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		// LanguageToggle should appear inside the header component
		expect(source).toContain("LanguageToggle");
	});

	it("[RED 3c] JSON-LD structured data is still present", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("application/ld+json");
		expect(source).toContain("buildPublicPageStructuredData");
	});

	it("[RED 3d] metadata export is still present", () => {
		const source = readSource(PAGE_SOURCE_PATH);
		expect(source).toContain("export const metadata");
	});
});
