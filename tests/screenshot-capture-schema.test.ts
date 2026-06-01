/**
 * Screenshot capture config schema — minimal validation.
 *
 * Proves the Zod schema accepts the default plan, rejects malformed input,
 * and that the default plan covers every portfolio checklist id with a
 * unique file name. The capture orchestrator, CLI, and integration
 * behaviour live in follow-up slices and stay in
 * `_deferred/slice-5.2-orchestrator/screenshot-capture-foundation.test.ts.deferred`.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import {
	CAPTURE_SURFACE,
	DEFAULT_CAPTURE_CONFIG,
	DEFAULT_CAPTURE_PLAN,
	captureJobSchema,
	screenshotCaptureConfigSchema,
} from "@/lib/schemas/screenshotCapture.schema";

const PORTFOLIO_SCREENSHOT_IDS = [
	"kiosk-ingreso",
	"kiosk-otp",
	"kiosk-consentimiento",
	"admin-dashboard",
	"admin-consents-list",
	"public-consentimiento-digital",
] as const;

function expectThrows(fn: () => unknown, pattern: string): void {
	let caught: unknown = null;
	try {
		fn();
	} catch (error) {
		caught = error;
	}
	expect(caught !== null && caught !== undefined).toBe(true);
	const errorMessage = caught instanceof Error ? caught.message : JSON.stringify(caught);
	expect(errorMessage.includes(pattern)).toBe(true);
}

describe("screenshot capture schema", () => {
	it("lives at the shared schema path", () => {
		expect(
			existsSync(join(process.cwd(), "src/lib/schemas/screenshotCapture.schema.ts")),
		).toBe(true);
	});

	it("accepts the default plan and rejects malformed configs", () => {
		const parsed = screenshotCaptureConfigSchema.parse(DEFAULT_CAPTURE_CONFIG);
		expect(parsed.jobs.length).toBe(DEFAULT_CAPTURE_PLAN.length);
		expect(parsed.outputDir).toBe("docs/portfolio/screenshots");
		expect(parsed.baseUrl).toBe("http://127.0.0.1:3000");

		expectThrows(
			() =>
				screenshotCaptureConfigSchema.parse({
					...DEFAULT_CAPTURE_CONFIG,
					jobs: [],
				}),
			"jobs",
		);
		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "job-01",
					surface: CAPTURE_SURFACE.KIOSK,
					route: "/ingreso",
					viewport: { width: 1280, height: 900 },
					fileName: "Bad-Case",
				}),
			"fileName",
		);
		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "job-01",
					surface: CAPTURE_SURFACE.KIOSK,
					route: "no-leading-slash",
					viewport: { width: 1280, height: 900 },
					fileName: "kiosk-ingreso",
				}),
			"route",
		);
		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "job-01",
					surface: CAPTURE_SURFACE.KIOSK,
					route: "/ingreso",
					viewport: { width: 10, height: 900 },
					fileName: "kiosk-ingreso",
				}),
			"width",
		);
		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "job-01",
					surface: CAPTURE_SURFACE.KIOSK,
					route: "/ingreso",
					viewport: { width: 1280, height: 900 },
					fileName: "a",
				}),
			"fileName",
		);

		expectThrows(
			() =>
				screenshotCaptureConfigSchema.parse({
					...DEFAULT_CAPTURE_CONFIG,
					jobs: [DEFAULT_CAPTURE_PLAN[0], DEFAULT_CAPTURE_PLAN[0]],
				}),
			"unique",
		);
	});

	it("covers every portfolio checklist id with a unique file name", () => {
		const planIds = new Set(DEFAULT_CAPTURE_PLAN.map((job) => job.id));
		const fileNames = new Set(DEFAULT_CAPTURE_PLAN.map((job) => job.fileName));
		for (const id of PORTFOLIO_SCREENSHOT_IDS) {
			expect(planIds.has(id)).toBe(true);
		}
		expect(planIds.size).toBe(PORTFOLIO_SCREENSHOT_IDS.length);
		expect(fileNames.size).toBe(DEFAULT_CAPTURE_PLAN.length);
	});
});
