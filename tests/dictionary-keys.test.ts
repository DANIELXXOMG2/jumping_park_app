import { describe, expect, it } from "bun:test";
import {
	dictionary,
	getTranslation,
	type DictionaryKey,
} from "@/lib/i18n/dictionary";

/**
 * Assert that every new homepage key exists, has both languages,
 * and returns a non-empty, non-key string from getTranslation().
 */

const NEW_HOMEPAGE_KEYS: string[] = [
	"home.attractions.title",
	"home.attractions.trampolines",
	"home.attractions.trampolinesDesc",
	"home.attractions.kids",
	"home.attractions.kidsDesc",
	"home.attractions.ballPit",
	"home.attractions.ballPitDesc",
	"home.business.address",
	"home.business.phone",
	"home.business.instagram",
	"home.business.instagramLabel",
	"home.business.hours.weekday",
	"home.business.hours.weekend",
	"home.footer.copyright",
	"home.hero.astronautAlt",
	"home.hero.solarSystemAlt",
	"home.hero.logoAlt",
	"home.toggle.switchToEs",
	"home.toggle.switchToEn",
];

describe("homepage dictionary keys", () => {
	for (const keyName of NEW_HOMEPAGE_KEYS) {
		it(`key "${keyName}" exists in dictionary`, () => {
			expect(keyName in dictionary).toBe(true);
		});
	}

	for (const keyName of NEW_HOMEPAGE_KEYS) {
		it(`key "${keyName}" has non-empty Spanish translation`, () => {
			const result = getTranslation(keyName as DictionaryKey, "es");
			expect(result).toBeString();
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe(keyName);
		});
	}

	for (const keyName of NEW_HOMEPAGE_KEYS) {
		it(`key "${keyName}" has non-empty English translation`, () => {
			const result = getTranslation(keyName as DictionaryKey, "en");
			expect(result).toBeString();
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe(keyName);
		});
	}
});

describe("homepage dictionary content assertions", () => {
	it("home.attractions.title is 'Atracciones' in Spanish", () => {
		expect(getTranslation("home.attractions.title" as DictionaryKey, "es")).toBe(
			"Atracciones",
		);
	});

	it("home.attractions.title is 'Attractions' in English", () => {
		expect(getTranslation("home.attractions.title" as DictionaryKey, "en")).toBe(
			"Attractions",
		);
	});

	it("home.toggle.switchToEs describes switching to Spanish", () => {
		expect(getTranslation("home.toggle.switchToEs" as DictionaryKey, "es")).toBe(
			"Cambiar a Español",
		);
	});

	it("home.toggle.switchToEn describes switching to English", () => {
		expect(getTranslation("home.toggle.switchToEn" as DictionaryKey, "en")).toBe(
			"Switch to English",
		);
	});
});
