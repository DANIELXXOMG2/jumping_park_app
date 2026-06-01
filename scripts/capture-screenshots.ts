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
import { chromium, type Browser } from "@playwright/test";
import {
	DEFAULT_CAPTURE_CONFIG,
	screenshotCaptureConfigSchema,
	type CaptureJob,
	type ScreenshotCaptureConfig,
} from "@/lib/schemas/screenshotCapture.schema";

const projectRoot = resolve(import.meta.dir, "..");

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

export const defaultCaptureExecutor: CaptureExecutor = {
	async launch() {
		return chromium.launch({ headless: true });
	},
	async writeCapture(outputPath, body) {
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(outputPath, body);
	},
};

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
 */
export async function runCaptureJob(
	job: CaptureJob,
	config: ScreenshotCaptureConfig,
	executor: CaptureExecutor,
): Promise<{ jobId: string; outputPath: string }> {
	const outputPath = resolveOutputPath(config, job);
	const browser = await executor.launch();
	try {
		const context = await browser.newContext({
			viewport: job.viewport,
		});
		const page = await context.newPage();
		try {
			await page.goto(new URL(job.route, config.baseUrl).toString(), {
				waitUntil: "domcontentloaded",
				timeout: config.timeoutMs,
			});
			if (job.headingMatcher) {
				const heading = page
					.getByRole("heading")
					.filter({ hasText: new RegExp(job.headingMatcher, "i") })
					.first();
				await heading.waitFor({ state: "visible", timeout: config.timeoutMs });
			}
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
 */
export async function runCaptureScreenshots(options?: {
	config?: Partial<ScreenshotCaptureConfig>;
	mode?: CaptureMode;
	executor?: CaptureExecutor;
}): Promise<CaptureRunSummary> {
	const config = screenshotCaptureConfigSchema.parse({
		...DEFAULT_CAPTURE_CONFIG,
		...(options?.config ?? {}),
	});
	const mode: CaptureMode = options?.mode ?? "dry-run";

	if (mode === "dry-run") {
		return {
			config,
			jobCount: config.jobs.length,
			written: [],
			skipped: config.jobs.map((job) => resolveOutputPath(config, job)),
		};
	}

	const executor = options?.executor ?? defaultCaptureExecutor;
	const written: string[] = [];
	for (const job of config.jobs) {
		const { outputPath } = await runCaptureJob(job, config, executor);
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
	optionName: "--mode" | "--output-dir" | "--base-url",
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
	const configOverride: Partial<ScreenshotCaptureConfig> = {};
	if (outputDir) configOverride.outputDir = outputDir;
	if (baseUrl) configOverride.baseUrl = baseUrl;

	runCaptureScreenshots({ mode: modeRaw, config: configOverride })
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
