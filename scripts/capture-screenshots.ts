/**
 * capture-screenshots — Playwright-based screenshot capture foundation.
 *
 * This script is the source-of-truth orchestrator for the portfolio screenshot
 * pipeline. It pairs with `scripts/optimize-screenshots.ts`, which converts the
 * PNGs it writes into WebP.
 *
 * Pipeline contract:
 *
 *   capture-screenshots --mode=write
 *     -> writes PNGs to `config.outputDir` (default docs/portfolio/screenshots)
 *   optimize-screenshots --input-dir <config.outputDir>
 *     -> reads those PNGs and emits WebP into docs/assets/screenshots
 *
 * Both scripts share the file-naming convention `kebab-case`; the WebP produced
 * by the optimizer keeps the same stem (e.g. `kiosk-ingreso.png` becomes
 * `kiosk-ingreso.webp`).
 *
 * Truth gates (this slice):
 *
 * 1. Real captures are NOT committed in this slice. The foundation is wired
 *    and tested, but committing a real capture requires:
 *      - a running `bun dev` with demo data seeded;
 *      - an accessible Playwright Chromium browser (already installed by
 *        `bun run playwright:install`);
 *      - a manual review pass against the portfolio checklist in
 *        `docs/portfolio/screenshots/README.md`.
 * 2. The default mode is `--mode=dry-run`, which prints the resolved plan
 *    and exits 0. This keeps the script honest in environments where a live
 *    server is not available, and gives reviewers a single command to see
 *    what the foundation would do.
 * 3. When the environment cannot safely capture (e.g. CI without a dev
 *    server, blocked network for Playwright, missing demo seed), use
 *    `--mode=dry-run` and the test suite — do not invent captures.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import {
	buildAdminSessionCookieValue,
	createAdminSessionPayload,
} from "@/lib/adminAuth";
import {
	CAPTURE_SURFACE,
	DEFAULT_CAPTURE_CONFIG,
	screenshotCaptureConfigSchema,
	type CaptureJob,
	type CaptureRedaction,
	type ScreenshotCaptureConfig,
} from "@/lib/schemas/screenshotCapture.schema";
import { ADMIN_SESSION_COOKIE_NAME } from "@/types/auth";

const projectRoot = resolve(import.meta.dir, "..");

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type CaptureMode = "dry-run" | "write";

export type CaptureRunSummary = {
	config: ScreenshotCaptureConfig;
	jobCount: number;
	written: string[];
	skipped: string[];
};

/**
 * Dependency seam. The default implementation uses Playwright; tests inject a
 * fake launcher and writer so the foundation can be validated without
 * launching a real browser.
 */
export type CaptureExecutor = {
	launch: () => Promise<Browser>;
	writeCapture: (outputPath: string, body: Buffer) => Promise<void>;
};

/**
 * Minimal page seam needed by `applyRedactions`. Tests pass a fake object
 * cast to `Page` to drive the seam without booting a browser; the real
 * `runCaptureJob` calls the same function with the actual Playwright
 * `Page`. The payload is serialized as plain JSON so the redaction list
 * survives the Playwright boundary.
 */
export type ApplyRedactionsPage = Pick<Page, "evaluate">;

/**
 * Apply DOM-level redactions before a screenshot is taken. The action is
 * limited to the two ops captured in the schema: `hide` (visibility: hidden)
 * and `replace-text` (textContent = replacement ?? "[REDACTED]"). Empty or
 * undefined redaction lists are a no-op.
 */
export async function applyRedactions(
	page: ApplyRedactionsPage,
	redactions: readonly CaptureRedaction[] | undefined,
): Promise<void> {
	if (!redactions || redactions.length === 0) return;
	await page.evaluate(
		({ redactions: items }: { redactions: readonly CaptureRedaction[] }) => {
			for (const redaction of items) {
				const nodes = document.querySelectorAll(redaction.selector);
				nodes.forEach((node) => {
					if (redaction.action === "hide") {
						(node as HTMLElement).style.visibility = "hidden";
					} else {
						node.textContent = redaction.replacement ?? "[REDACTED]";
					}
				});
			}
		},
		{ redactions },
	);
}

export const defaultCaptureExecutor: CaptureExecutor = {
	async launch() {
		return chromium.launch({ headless: true });
	},
	async writeCapture(outputPath, body) {
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(outputPath, body);
	},
};

/**
 * Playwright-shaped cookie descriptor. Mirrors the subset of
 * `BrowserContext.addCookies()` arguments the script needs.
 */
export type AdminSessionCookieDescriptor = {
	name: string;
	value: string;
	domain: string;
	path: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: "Strict" | "Lax" | "None";
};

/**
 * Resolver seam: returns the cookies to inject into the Playwright context
 * for a given job. The default implementation signs an admin session cookie
 * from `ADMIN_JWT_SECRET` + `ADMIN_CAPTURE_UID` + `ADMIN_CAPTURE_EMAIL` for
 * `surface === "admin"` jobs, and returns an empty array otherwise. Tests
 * can inject a custom resolver to exercise the seam without env mutation.
 */
export type ResolveCookiesForJob = (
	job: CaptureJob,
	baseUrl: string,
) => AdminSessionCookieDescriptor[];

/**
 * Build a signed admin session cookie descriptor for a capture. Pure
 * function: no I/O, no env reads. Reuses the project's own HMAC-signed
 * cookie helpers so the captured admin routes see the same session shape
 * the proxy validates.
 */
export function buildAdminSessionCookieForCapture(params: {
	baseUrl: string;
	uid: string;
	email: string;
}): AdminSessionCookieDescriptor {
	const payload = createAdminSessionPayload({
		uid: params.uid,
		email: params.email,
		role: "admin",
	});
	const value = buildAdminSessionCookieValue(payload);
	const url = new URL(params.baseUrl);
	return {
		name: ADMIN_SESSION_COOKIE_NAME,
		value,
		domain: url.hostname,
		path: "/",
		httpOnly: true,
		secure: url.protocol === "https:",
		sameSite: "Lax",
	};
}

/**
 * Production capture guard. Refuses to run when the baseUrl resolves to
 * `jumpingpark.lat` (or any subdomain) unless the caller passes
 * `--allow-production`. Applied in both dry-run and write modes so a
 * reviewer can never accidentally preview a production plan.
 */
export function isProductionCaptureBaseUrl(baseUrl: string): boolean {
	try {
		const host = new URL(baseUrl).hostname.toLowerCase();
		return host === "jumpingpark.lat" || host.endsWith(".jumpingpark.lat");
	} catch {
		return false;
	}
}

export function assertCaptureBaseUrlAllowed(
	baseUrl: string,
	allowProduction: boolean,
): void {
	if (allowProduction) return;
	if (!isProductionCaptureBaseUrl(baseUrl)) return;
	throw new Error(
		`Refusing to capture from production baseUrl '${baseUrl}'. Pass --allow-production to override explicitly.`,
	);
}

/**
 * Default cookie resolver. Reads the env on every call so the CLI can
 * override the values via `--admin-uid` / `--admin-email` by mutating
 * `process.env` before invoking `runCaptureScreenshots`.
 */
export function defaultResolveCookiesForJob(
	job: CaptureJob,
	baseUrl: string,
): AdminSessionCookieDescriptor[] {
	if (job.surface !== CAPTURE_SURFACE.ADMIN) {
		return [];
	}
	const secret = process.env.ADMIN_JWT_SECRET;
	const uid = process.env.ADMIN_CAPTURE_UID;
	const email = process.env.ADMIN_CAPTURE_EMAIL;
	if (!secret || !uid || !email) {
		throw new Error(
			"admin captures require ADMIN_JWT_SECRET, ADMIN_CAPTURE_UID (or --admin-uid), and ADMIN_CAPTURE_EMAIL (or --admin-email).",
		);
	}
	return [
		buildAdminSessionCookieForCapture({
			baseUrl,
			uid,
			email,
		}),
	];
}

export function resolveOutputPath(
	config: ScreenshotCaptureConfig,
	job: CaptureJob,
): string {
	return join(projectRoot, config.outputDir, `${job.fileName}.png`);
}

/**
 * Drive a single capture job. Opens a new context per job so each capture
 * gets its own viewport and isolated cookies; closes everything in a
 * finally block so a failed job does not leak the browser process.
 *
 * `options.cookies` is the seam for auth injection: when present, the
 * descriptors are added to the context BEFORE navigation, so the first
 * request already carries the session cookie.
 */
export async function runCaptureJob(
	job: CaptureJob,
	config: ScreenshotCaptureConfig,
	executor: CaptureExecutor,
	options?: { cookies?: AdminSessionCookieDescriptor[] },
): Promise<{ jobId: string; outputPath: string }> {
	const outputPath = resolveOutputPath(config, job);
	const browser = await executor.launch();
	try {
		const context = await browser.newContext({
			viewport: job.viewport,
		});
		if (options?.cookies && options.cookies.length > 0) {
			await context.addCookies(options.cookies);
		}
		const page = await context.newPage();
		try {
			await page.goto(new URL(job.route, config.baseUrl).toString(), {
				waitUntil: "domcontentloaded",
				timeout: config.timeoutMs,
			});
			if (job.headingMatcher) {
				const heading = page
					.getByRole("heading")
					.filter({ hasText: new RegExp(escapeRegExp(job.headingMatcher), "i") })
					.first();
				await heading.waitFor({ state: "visible", timeout: config.timeoutMs });
			}
			// Redact visible PII (admin jobs only for now) before the still is
			// captured. No-op when `job.redactions` is missing or empty.
			await applyRedactions(page, job.redactions);
			const buffer = await page.screenshot({ fullPage: false });
			await executor.writeCapture(outputPath, Buffer.from(buffer));
		} finally {
			await page.close();
			await context.close();
		}
	} finally {
		await browser.close();
	}
	return { jobId: job.id, outputPath };
}

/**
 * Top-level orchestrator. In `dry-run` mode it returns a summary without
 * touching Playwright or the filesystem. In `write` mode it iterates the
 * jobs sequentially — captures share a single browser launch per job to
 * keep resource use predictable.
 *
 * The production guard runs in BOTH modes: dry-run is the default
 * entrypoint, and we want reviewers to fail fast if they accidentally
 * preview a production plan. Pass `allowProduction: true` (or the
 * `--allow-production` CLI flag) to opt in explicitly.
 */
export async function runCaptureScreenshots(options?: {
	config?: Partial<ScreenshotCaptureConfig>;
	mode?: CaptureMode;
	executor?: CaptureExecutor;
	resolveCookiesForJob?: ResolveCookiesForJob;
	allowProduction?: boolean;
}): Promise<CaptureRunSummary> {
	const config = screenshotCaptureConfigSchema.parse({
		...DEFAULT_CAPTURE_CONFIG,
		...(options?.config ?? {}),
	});
	const mode: CaptureMode = options?.mode ?? "dry-run";
	const allowProduction = options?.allowProduction ?? false;
	assertCaptureBaseUrlAllowed(config.baseUrl, allowProduction);

	if (mode === "dry-run") {
		return {
			config,
			jobCount: config.jobs.length,
			written: [],
			skipped: config.jobs.map((job) => resolveOutputPath(config, job)),
		};
	}

	const executor = options?.executor ?? defaultCaptureExecutor;
	const resolveCookies = options?.resolveCookiesForJob ?? defaultResolveCookiesForJob;
	const written: string[] = [];
	for (const job of config.jobs) {
		const cookies = resolveCookies(job, config.baseUrl);
		const { outputPath } = await runCaptureJob(job, config, executor, { cookies });
		written.push(outputPath);
	}
	return {
		config,
		jobCount: config.jobs.length,
		written,
		skipped: [],
	};
}

/**
 * Render a dry-run report as plain text. Reviewers can run this in PR
 * threads or in CI logs to confirm the plan.
 */
export function formatDryRunReport(summary: CaptureRunSummary): string {
	const lines: string[] = [];
	lines.push("[screenshot:capture] dry-run");
	lines.push(`  baseUrl:   ${summary.config.baseUrl}`);
	lines.push(`  outputDir: ${summary.config.outputDir}`);
	lines.push(`  timeoutMs: ${String(summary.config.timeoutMs)}`);
	lines.push(`  jobs:      ${String(summary.jobCount)}`);
	for (const job of summary.config.jobs) {
		const output = resolveOutputPath(summary.config, job);
		lines.push(
			`    - [${job.surface}] ${job.id} -> ${job.route} @ ${String(job.viewport.width)}x${String(job.viewport.height)} -> ${output}`,
		);
	}
	return lines.join("\n");
}

function readCliOption(
	optionName:
		| "--mode"
		| "--output-dir"
		| "--base-url"
		| "--admin-uid"
		| "--admin-email",
): string | undefined {
	const inlineArg = process.argv.find((argument) =>
		argument.startsWith(`${optionName}=`),
	);

	if (inlineArg) {
		const [, ...valueParts] = inlineArg.split("=");
		const inlineValue = valueParts.join("=");
		if (!inlineValue) {
			throw new Error(`Missing value for ${optionName}.`);
		}
		return inlineValue;
	}

	const optionIndex = process.argv.indexOf(optionName);
	if (optionIndex === -1) return undefined;
	const value = process.argv[optionIndex + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`Missing value for ${optionName}.`);
	}
	return value;
}

if (import.meta.main) {
	const modeRaw = readCliOption("--mode") ?? "dry-run";
	if (modeRaw !== "dry-run" && modeRaw !== "write") {
		console.error(
			`[screenshot:capture] unsupported --mode value: ${modeRaw}. Use dry-run or write.`,
		);
		process.exit(1);
	}
	const outputDir = readCliOption("--output-dir");
	const baseUrl = readCliOption("--base-url");
	const allowProduction = process.argv.includes("--allow-production");
	const adminUidOverride = readCliOption("--admin-uid");
	const adminEmailOverride = readCliOption("--admin-email");
	// CLI overrides are wired through env so the existing default
	// resolver picks them up without changing its signature.
	if (adminUidOverride) process.env.ADMIN_CAPTURE_UID = adminUidOverride;
	if (adminEmailOverride) process.env.ADMIN_CAPTURE_EMAIL = adminEmailOverride;
	const configOverride: Partial<ScreenshotCaptureConfig> = {};
	if (outputDir) configOverride.outputDir = outputDir;
	if (baseUrl) configOverride.baseUrl = baseUrl;

	runCaptureScreenshots({
		mode: modeRaw,
		config: configOverride,
		allowProduction,
	})
		.then((summary) => {
			if (summary.skipped.length > 0) {
				console.log(formatDryRunReport(summary));
				return;
			}
			console.log(
				`[screenshot:capture] wrote ${String(summary.written.length)} capture(s) to ${summary.config.outputDir}.`,
			);
			for (const path of summary.written) {
				console.log(`  - ${path}`);
			}
		})
		.catch((error: unknown) => {
			console.error(
				`[screenshot:capture] ${error instanceof Error ? error.message : String(error)}`,
			);
			process.exit(1);
		});
}
