/**
 * Foundation regression coverage for the screenshot capture pipeline.
 *
 * Proves the foundation is wired correctly: Zod schema accepts the default
 * plan, rejects malformed input, and produces output paths that line up with
 * the optimize-screenshots input directory. Does NOT validate end-to-end
 * captures — that requires a live `bun dev` server and is intentionally out
 * of scope for this slice.
 *
 * The auth-capture slice (task 5.3) adds three more concerns on top of the
 * foundation: (1) admin jobs get a signed session cookie via the resolver
 * seam, (2) non-admin jobs are unaffected, and (3) the production guard
 * aborts dry-run and write modes unless `--allow-production` is set.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "bun:test";
import type { Browser } from "@playwright/test";
import {
	CAPTURE_SURFACE,
	DEFAULT_CAPTURE_CONFIG,
	DEFAULT_CAPTURE_PLAN,
	captureJobSchema,
	screenshotCaptureConfigSchema,
	type CaptureRedaction,
} from "@/lib/schemas/screenshotCapture.schema";

// `buildAdminSessionCookieForCapture` calls into `createAdminSessionPayload`
// which asserts `ADMIN_JWT_SECRET` is set. Seed it for the whole file so
// the cookie builder and the seam-driven tests can sign cookies.
process.env.ADMIN_JWT_SECRET ??= "test-admin-session-secret";

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
	"kiosk-offline-success",
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
	const rendered =
		caught instanceof Error
			? `${caught.name}: ${caught.message}`
			: String(caught);
	expect(rendered.includes(pattern)).toBe(true);
}

describe("screenshot capture foundation stays truthful", () => {
	it("registers capture and optimize script files (scripts removed from package.json surface per Slice 5)", () => {
		const packageJson = readPackageJson();
		// Scripts are no longer top-level package.json entries but remain
		// runnable via: bun run scripts/capture-screenshots.ts / optimize-screenshots.ts
		expect(existsSync(join(projectRoot, "scripts", "capture-screenshots.ts"))).toBe(
			true,
		);
		expect(existsSync(join(projectRoot, "scripts", "optimize-screenshots.ts"))).toBe(
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

	it("builds an admin session cookie descriptor for admin captures", async () => {
		const captureModule = await import("../scripts/capture-screenshots");
		const previousSecret = process.env.ADMIN_JWT_SECRET;
		process.env.ADMIN_JWT_SECRET = "test-admin-secret";

		try {
			const cookie = captureModule.buildAdminSessionCookieForCapture({
				baseUrl: "https://www.jumpingpark.lat",
				uid: "admin-uid",
				email: "jumpingadmin@gmail.com",
			});

			expect(cookie.name).toBe("jp_admin_session");
			expect(cookie.domain).toBe("www.jumpingpark.lat");
			expect(cookie.path).toBe("/");
			expect(cookie.httpOnly).toBe(true);
			expect(cookie.secure).toBe(true);
			expect(cookie.sameSite).toBe("Lax");
			expect(cookie.value.includes(".")).toBe(true);
		} finally {
			if (previousSecret === undefined) {
				delete process.env.ADMIN_JWT_SECRET;
			} else {
				process.env.ADMIN_JWT_SECRET = previousSecret;
			}
		}
	});

	it("guards production baseUrl unless --allow-production is present", async () => {
		const captureModule = await import("../scripts/capture-screenshots");

		captureModule.assertCaptureBaseUrlAllowed("http://127.0.0.1:3000", false);
		captureModule.assertCaptureBaseUrlAllowed(
			"https://www.jumpingpark.lat",
			true,
		);

		expectThrows(
			() =>
				captureModule.assertCaptureBaseUrlAllowed(
					"https://www.jumpingpark.lat",
					false,
				),
			"Refusing to capture from production baseUrl",
		);
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

	it("CLI rejects production dry-run unless --allow-production is passed", () => {
		const blocked = spawnSync(
			"bun",
			[
				"run",
				"scripts/capture-screenshots.ts",
				"--base-url",
				"https://www.jumpingpark.lat",
			],
			{ cwd: projectRoot, encoding: "utf8" },
		);
		expect(blocked.status).toBe(1);
		expect(blocked.stderr).toContain("Refusing to capture from production baseUrl");

		const allowed = spawnSync(
			"bun",
			[
				"run",
				"scripts/capture-screenshots.ts",
				"--base-url",
				"https://www.jumpingpark.lat",
				"--allow-production",
			],
			{ cwd: projectRoot, encoding: "utf8" },
		);
		expect(allowed.status).toBe(0);
		expect(allowed.stdout).toContain("[screenshot:capture] dry-run");
	});

	it("parses capture jobs with redactions and rejects malformed ones", () => {
		const parsed = captureJobSchema.parse({
			id: "admin-dashboard",
			surface: CAPTURE_SURFACE.ADMIN,
			route: "/admin",
			viewport: { width: 1440, height: 900 },
			fileName: "admin-dashboard",
			redactions: [
				{ selector: "[data-pii='admin-header-email']", action: "hide" },
				{
					selector: "[data-pii='admin-consent-adult-email']",
					action: "replace-text",
					replacement: "[REDACTED]",
				},
			],
		});
		expect(parsed.redactions).toHaveLength(2);
		expect(parsed.redactions?.[0]?.action).toBe("hide");
		expect(parsed.redactions?.[1]?.action).toBe("replace-text");

		expectThrows(
			() =>
				captureJobSchema.parse({
					id: "x",
					surface: CAPTURE_SURFACE.ADMIN,
					route: "/admin",
					viewport: { width: 1440, height: 900 },
					fileName: "admin-dashboard",
					redactions: [{ selector: "[data-pii]", action: "blur" }],
				}),
			"action",
		);
	});

	it("ships redactions on the admin jobs in the default plan", () => {
		const adminJobs = DEFAULT_CAPTURE_PLAN.filter(
			(job) => job.surface === CAPTURE_SURFACE.ADMIN,
		);
		expect(adminJobs).toHaveLength(2);
		for (const job of adminJobs) {
			expect(job.redactions && job.redactions.length).toBeGreaterThan(0);
			const targets = (job.redactions ?? []).map((r) => r.selector);
			expect(targets).toContain("[data-pii='admin-header-email']");
		}
		const consentJob = adminJobs.find((j) => j.id === "admin-consents-list");
		expect(consentJob?.redactions?.some((r) => r.action === "replace-text")).toBe(
			true,
		);
	});

	it("keeps redactions off public jobs in the default plan", () => {
		for (const job of DEFAULT_CAPTURE_PLAN) {
			if (job.surface === CAPTURE_SURFACE.PUBLIC) {
				expect(job.redactions).toBeUndefined();
			}
		}
	});

	it("redacts the kiosk-consentimiento signer header via data-pii spans", () => {
		const job = DEFAULT_CAPTURE_PLAN.find(
			(candidate) => candidate.id === "kiosk-consentimiento",
		);
		expect(job).toBeDefined();
		const redactions = job?.redactions ?? [];
		const selectors = redactions.map((redaction) => redaction.selector);
		expect(selectors).toContain("[data-pii='kiosk-consent-name']");
		expect(selectors).toContain("[data-pii='kiosk-consent-uid']");
		for (const redaction of redactions) {
			expect(redaction.action).toBe("replace-text");
			expect(redaction.replacement).toBe("[REDACTED]");
		}
	});

	it("applyRedactions forwards the configured redactions to the page", async () => {
		const captureModule = await import("../scripts/capture-screenshots");
		const calls: unknown[] = [];
		const fakePage = {
			evaluate: async (fn: unknown, arg: unknown): Promise<unknown> => {
				calls.push(arg);
				return undefined;
			},
		} as unknown as Parameters<typeof captureModule.applyRedactions>[0];
		const redactions: CaptureRedaction[] = [
			{ selector: "[data-pii='admin-header-email']", action: "hide" },
			{
				selector: "[data-pii='admin-consent-adult-email']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
		];

		await captureModule.applyRedactions(fakePage, redactions);

		expect(calls).toHaveLength(1);
		const payload = calls[0] as { redactions: CaptureRedaction[] };
		expect(payload.redactions).toEqual(redactions);

		// Empty / undefined redactions are a no-op: no page.evaluate call.
		const noopCalls: unknown[] = [];
		const noopPage = {
			evaluate: async (_fn: unknown, arg: unknown): Promise<unknown> => {
				noopCalls.push(arg);
				return undefined;
			},
		} as unknown as Parameters<typeof captureModule.applyRedactions>[0];
		await captureModule.applyRedactions(noopPage, []);
		expect(noopCalls).toHaveLength(0);
		await captureModule.applyRedactions(noopPage, undefined);
		expect(noopCalls).toHaveLength(0);
	});
});
