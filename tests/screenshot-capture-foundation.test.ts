/**
 * Foundation regression coverage for the screenshot capture pipeline.
 *
 * Proves the foundation is wired correctly: Zod schema accepts the default
 * plan, rejects malformed input, and produces output paths that line up with
 * the optimize-screenshots input directory. Does NOT validate end-to-end
 * captures — that requires a live `bun dev` server and is intentionally out
 * of scope for this slice.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "bun:test";
import {
	CAPTURE_SURFACE,
	DEFAULT_CAPTURE_CONFIG,
	DEFAULT_CAPTURE_PLAN,
	captureJobSchema,
	screenshotCaptureConfigSchema,
} from "@/lib/schemas/screenshotCapture.schema";

const projectRoot = process.cwd();

type PackageJsonShape = {
	scripts?: Record<string, string>;
};

function readPackageJson(): PackageJsonShape {
	return JSON.parse(
		readFileSync(join(projectRoot, "package.json"), "utf8"),
	) as PackageJsonShape;
}

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
	expect(JSON.stringify(caught).includes(pattern)).toBe(true);
}

describe("screenshot capture foundation stays truthful", () => {
	it("registers both capture and optimize script entries", () => {
		const packageJson = readPackageJson();
		expect(packageJson.scripts?.["optimize:screenshots"]).toBe(
			"bun run scripts/optimize-screenshots.ts",
		);
		expect(packageJson.scripts?.["screenshot:capture"]).toBe(
			"bun run scripts/capture-screenshots.ts",
		);
		expect(existsSync(join(projectRoot, "scripts", "capture-screenshots.ts"))).toBe(
			true,
		);
	});

	it("accepts the default plan and rejects malformed configs", () => {
		const parsed = screenshotCaptureConfigSchema.parse(DEFAULT_CAPTURE_CONFIG);
		expect(parsed.jobs.length).toBe(DEFAULT_CAPTURE_PLAN.length);
		expect(parsed.outputDir).toBe("docs/portfolio/screenshots");
		expect(parsed.baseUrl).toBe("http://127.0.0.1:3000");

		expectThrows(
			() => screenshotCaptureConfigSchema.parse({ ...DEFAULT_CAPTURE_CONFIG, jobs: [] }),
			"jobs",
		);
		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "x",
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
					id: "x",
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
					id: "x",
					surface: CAPTURE_SURFACE.KIOSK,
					route: "/ingreso",
					viewport: { width: 10, height: 900 },
					fileName: "kiosk-ingreso",
				}),
			"width",
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

	it("aligns capture output paths with the optimizer input directory", async () => {
		const captureModule = await import("../scripts/capture-screenshots");
		const optimizerModule = await import("../scripts/optimize-screenshots");

		for (const job of DEFAULT_CAPTURE_PLAN) {
			const capturePath = captureModule.resolveOutputPath(
				DEFAULT_CAPTURE_CONFIG,
				job,
			);
			const rel = relative(optimizerModule.DEFAULT_INPUT_DIR, capturePath);
			expect(rel.startsWith("..")).toBe(false);
			expect(rel.endsWith(`${job.fileName}.png`)).toBe(true);
		}
	});

	it("runs in dry-run mode without launching a browser and prints a report", async () => {
		const captureModule = await import("../scripts/capture-screenshots");
		const summary = await captureModule.runCaptureScreenshots({ mode: "dry-run" });

		expect(summary.jobCount).toBe(DEFAULT_CAPTURE_PLAN.length);
		expect(summary.written.length).toBe(0);
		expect(summary.skipped.length).toBe(DEFAULT_CAPTURE_PLAN.length);

		const report = captureModule.formatDryRunReport(summary);
		expect(report).toContain("[screenshot:capture] dry-run");
		for (const job of DEFAULT_CAPTURE_PLAN) {
			expect(report).toContain(job.id);
			expect(report).toContain(job.route);
		}
	});

	it("CLI handles both supported and unsupported --mode values", () => {
		const okResult = spawnSync(
			"bun",
			["run", "scripts/capture-screenshots.ts", "--mode", "dry-run"],
			{ cwd: projectRoot, encoding: "utf8" },
		);
		expect(okResult.status).toBe(0);
		expect(okResult.stdout).toContain("[screenshot:capture] dry-run");
		expect(okResult.stdout).toContain("kiosk-ingreso");
		expect(okResult.stdout).toContain("admin-dashboard");

		const badResult = spawnSync(
			"bun",
			["run", "scripts/capture-screenshots.ts", "--mode", "explode"],
			{ cwd: projectRoot, encoding: "utf8" },
		);
		expect(badResult.status).toBe(1);
		expect(badResult.stderr).toContain("unsupported --mode value: explode");
	});
});
