/**
 * Tests for the kiosk capture seeder decoder and the redaction contract
 * between the screenshot capture schema and the kiosk pages it captures.
 *
 * `decodeCaptureSeed` is a pure function: it takes a base64-encoded JSON
 * payload (the value of the `?captureSeed=...` query param that the
 * Playwright capture pipeline injects) and returns the visitor profile the
 * kiosk store should hydrate before the screenshot is taken.
 *
 * The static assertions in this file act as a contract test: the
 * `redactions` array in `DEFAULT_CAPTURE_PLAN` targets
 * `[data-pii='kiosk-consent-name']` and `[data-pii='kiosk-consent-uid']`;
 * the consent page must render those exact attributes, and the layout
 * shell must mount the seeder BEFORE the restorer so the seed lands
 * before the restorer's mount-time redirect check.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { decodeCaptureSeed } from "@/components/kiosk/KioskCaptureSeeder";

const SAMPLE_VISITOR = {
	uid: "V-12345678",
	email: "demo@example.com",
	fullName: "Demo Visitor",
} as const;

function encodeVisitor(value: typeof SAMPLE_VISITOR): string {
	return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

describe("decodeCaptureSeed", () => {
	it("round-trips a visitor profile through base64-encoded JSON", () => {
		const encoded = encodeVisitor(SAMPLE_VISITOR);

		const decoded = decodeCaptureSeed(encoded);

		expect(decoded).toEqual({
			uid: "V-12345678",
			email: "demo@example.com",
			fullName: "Demo Visitor",
		});
	});

	it("returns null for null or empty input (no capture seed present)", () => {
		expect(decodeCaptureSeed(null)).toBeNull();
		expect(decodeCaptureSeed("")).toBeNull();
	});

	it("rejects malformed base64 input", () => {
		expect(decodeCaptureSeed("not-valid-base64!!!")).toBeNull();
	});

	it("rejects valid base64 whose payload is not valid JSON", () => {
		const garbage = Buffer.from("not json { just text", "utf8").toString(
			"base64",
		);
		expect(decodeCaptureSeed(garbage)).toBeNull();
	});

	it("rejects payloads missing required fields", () => {
		const missingEmail = Buffer.from(
			JSON.stringify({ uid: "V-1", fullName: "Demo" }),
			"utf8",
		).toString("base64");
		const missingUid = Buffer.from(
			JSON.stringify({ email: "demo@example.com", fullName: "Demo" }),
			"utf8",
		).toString("base64");
		const missingFullName = Buffer.from(
			JSON.stringify({ uid: "V-1", email: "demo@example.com" }),
			"utf8",
		).toString("base64");
		const wrongShape = Buffer.from(JSON.stringify(["not", "an", "object"]), "utf8")
			.toString("base64");

		expect(decodeCaptureSeed(missingEmail)).toBeNull();
		expect(decodeCaptureSeed(missingUid)).toBeNull();
		expect(decodeCaptureSeed(missingFullName)).toBeNull();
		expect(decodeCaptureSeed(wrongShape)).toBeNull();
	});

	it("rejects payloads with non-string field values", () => {
		const numericUid = Buffer.from(
			JSON.stringify({ uid: 123, email: "demo@example.com", fullName: "Demo" }),
			"utf8",
		).toString("base64");

		expect(decodeCaptureSeed(numericUid)).toBeNull();
	});

	it("trims surrounding whitespace before decoding", () => {
		const encoded = `   ${encodeVisitor(SAMPLE_VISITOR)}   `;

		const decoded = decodeCaptureSeed(encoded);

		expect(decoded).toEqual({
			uid: "V-12345678",
			email: "demo@example.com",
			fullName: "Demo Visitor",
		});
	});
});

describe("kiosk capture seeder wiring", () => {
	const projectRoot = process.cwd();

	function readSource(relativePath: string): string {
		return readFileSync(join(projectRoot, relativePath), "utf8");
	}

	it("mounts the seeder in the kiosk layout shell", () => {
		const layout = readSource("src/components/layouts/KioskLayoutShell.tsx");
		expect(layout).toContain("KioskCaptureSeeder");
		expect(layout).toContain(
			'import { KioskCaptureSeeder } from "@/components/kiosk/KioskCaptureSeeder"',
		);
	});

	it("mounts the seeder BEFORE the KioskSessionRestorer (ordering contract)", () => {
		const layout = readSource("src/components/layouts/KioskLayoutShell.tsx");
		const seederIndex = layout.indexOf("<KioskCaptureSeeder");
		const restorerIndex = layout.indexOf("<KioskSessionRestorer");
		expect(seederIndex).toBeGreaterThan(-1);
		expect(restorerIndex).toBeGreaterThan(-1);
		expect(seederIndex).toBeLessThan(restorerIndex);
	});

	it("guards the seeder behind a non-production flag", () => {
		const seeder = readSource("src/components/kiosk/KioskCaptureSeeder.tsx");
		expect(seeder).toContain(
			'const ALLOW_CAPTURE_SEED = process.env.NODE_ENV !== "production"',
		);
		expect(seeder).toContain("if (!ALLOW_CAPTURE_SEED) return;");
	});

	it("renders data-pii spans the capture schema targets in the consent page", () => {
		const consentPage = readSource("src/app/(kiosk)/consentimiento/page.tsx");
		expect(consentPage).toContain('data-pii="kiosk-consent-name"');
		expect(consentPage).toContain('data-pii="kiosk-consent-uid"');
	});
});
