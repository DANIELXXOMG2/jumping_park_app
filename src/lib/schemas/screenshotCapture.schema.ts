/**
 * Screenshot capture configuration schema.
 *
 * Shared between the future screenshot capture orchestrator and any
 * tooling that needs to validate a capture plan. Each job describes one still
 * capture: which surface to open, what viewport to use, and where to write the
 * resulting PNG.
 *
 * The optimizer (`scripts/optimize-screenshots.ts`) consumes the same
 * `outputDir` to convert PNGs into WebP, so the two scripts stay coordinated
 * through this schema instead of magic strings.
 */

import { z } from "zod";

export const CAPTURE_SURFACE = {
	KIOSK: "kiosk",
	ADMIN: "admin",
	PUBLIC: "public",
} as const;

export type CaptureSurface =
	(typeof CAPTURE_SURFACE)[keyof typeof CAPTURE_SURFACE];

const SURFACE_VALUES = [
	CAPTURE_SURFACE.KIOSK,
	CAPTURE_SURFACE.ADMIN,
	CAPTURE_SURFACE.PUBLIC,
] as const;

const FILE_NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * A single capture job. The `route` is the in-app path the Playwright harness
 * will open; `viewport` is a literal pixel size so captures stay deterministic
 * across runs; `fileName` is the PNG stem the optimizer will reuse for the
 * WebP asset (e.g. `kiosk-ingreso` -> `kiosk-ingreso.png` -> `kiosk-ingreso.webp`).
 */
export const captureJobSchema = z.object({
	id: z.string().min(1).max(64),
	surface: z.enum(SURFACE_VALUES),
	route: z.string().min(1).max(2048).startsWith("/"),
	headingMatcher: z.string().min(1).max(256).optional(),
	viewport: z.object({
		width: z.number().int().min(320).max(3840),
		height: z.number().int().min(240).max(2160),
	}),
	fileName: z.string().regex(FILE_NAME_REGEX, {
		message:
			"fileName must be lowercase, dash-separated, and start/end with alphanumeric",
	}),
});

export type CaptureJob = z.infer<typeof captureJobSchema>;

/**
 * Top-level capture configuration. `outputDir` is the directory the capture
 * script writes PNGs to; it is the same directory the optimizer reads from.
 */
export const screenshotCaptureConfigSchema = z
	.object({
		outputDir: z.string().min(1),
		baseUrl: z.string().url(),
		timeoutMs: z.number().int().min(1000).max(120_000).default(15_000),
		jobs: z.array(captureJobSchema).min(1).max(64),
	})
	.superRefine((config, context) => {
		const seenIds = new Set<string>();
		const seenFileNames = new Set<string>();

		for (const [index, job] of config.jobs.entries()) {
			if (seenIds.has(job.id)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: "jobs must use unique id values",
					path: ["jobs", index, "id"],
				});
			}
			seenIds.add(job.id);

			if (seenFileNames.has(job.fileName)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: "jobs must use unique fileName values",
					path: ["jobs", index, "fileName"],
				});
			}
			seenFileNames.add(job.fileName);
		}
	});

export type ScreenshotCaptureConfig = z.infer<
	typeof screenshotCaptureConfigSchema
>;

/**
 * Default capture plan derived from `docs/portfolio/screenshots/README.md`.
 *
 * The plan is intentionally hand-curated: the goal is to produce a small set
 * of truthful stills, not to enumerate every possible screen. Each entry
 * mirrors a row in the portfolio checklist so the manifest and the plan can
 * be diffed without guessing.
 */
export const DEFAULT_CAPTURE_PLAN: CaptureJob[] = [
	{
		id: "kiosk-ingreso",
		surface: CAPTURE_SURFACE.KIOSK,
		route: "/ingreso",
		headingMatcher: "ingreso",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-ingreso",
	},
	{
		id: "kiosk-otp",
		surface: CAPTURE_SURFACE.KIOSK,
		route: "/otp",
		headingMatcher: "otp",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-otp",
	},
	{
		id: "kiosk-consentimiento",
		surface: CAPTURE_SURFACE.KIOSK,
		route: "/consentimiento",
		headingMatcher: "consentimiento",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-consentimiento",
	},
	{
		id: "admin-dashboard",
		surface: CAPTURE_SURFACE.ADMIN,
		route: "/admin",
		headingMatcher: "dashboard",
		viewport: { width: 1440, height: 900 },
		fileName: "admin-dashboard",
	},
	{
		id: "admin-consents-list",
		surface: CAPTURE_SURFACE.ADMIN,
		route: "/admin/consentimientos",
		headingMatcher: "consentimientos",
		viewport: { width: 1440, height: 900 },
		fileName: "admin-consents-list",
	},
	{
		id: "public-consentimiento-digital",
		surface: CAPTURE_SURFACE.PUBLIC,
		route: "/consentimiento-digital",
		headingMatcher: "consentimiento digital",
		viewport: { width: 1280, height: 900 },
		fileName: "public-consentimiento-digital",
	},
];

export const DEFAULT_CAPTURE_CONFIG: ScreenshotCaptureConfig = {
	outputDir: "docs/portfolio/screenshots",
	baseUrl: "http://127.0.0.1:3000",
	timeoutMs: 15_000,
	jobs: DEFAULT_CAPTURE_PLAN,
};
