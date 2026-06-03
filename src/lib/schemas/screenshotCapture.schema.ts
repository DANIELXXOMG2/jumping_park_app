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

export const REDACTION_ACTION = {
	HIDE: "hide",
	REPLACE_TEXT: "replace-text",
} as const;

export type RedactionAction =
	(typeof REDACTION_ACTION)[keyof typeof REDACTION_ACTION];

const REDACTION_ACTION_VALUES = [
	REDACTION_ACTION.HIDE,
	REDACTION_ACTION.REPLACE_TEXT,
] as const;

/**
 * DOM-level redaction instruction applied after the heading wait and before
 * the screenshot is taken. This is CLIENT-SIDE visual redaction only; it
 * does not mutate any backing data. Keep selectors narrow and reviewable;
 * they should match real PII cells, not whole pages.
 */
export const captureRedactionSchema = z.object({
	selector: z.string().min(1).max(512),
	action: z.enum(REDACTION_ACTION_VALUES),
	replacement: z.string().min(1).max(256).optional(),
});

export type CaptureRedaction = z.infer<typeof captureRedactionSchema>;

export const captureSeedPayloadSchema = z.object({
	uid: z.string().min(1),
	email: z.string().min(1),
	fullName: z.string().min(1),
});

export type CaptureSeedPayload = z.infer<typeof captureSeedPayloadSchema>;

/**
 * A single capture job. The `route` is the in-app path the Playwright harness
 * will open; `viewport` is a literal pixel size so captures stay deterministic
 * across runs; `fileName` is the PNG stem the optimizer will reuse for the
 * WebP asset (e.g. `kiosk-ingreso` -> `kiosk-ingreso.png` -> `kiosk-ingreso.webp`).
 * `redactions` (admin-only for now) hide or replace visible PII before the
 * screenshot is taken.
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
	redactions: z.array(captureRedactionSchema).max(32).optional(),
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
		// `?captureSeed=...` is consumed by `KioskCaptureSeeder` (see
		// `src/components/kiosk/KioskCaptureSeeder.tsx`). The base64 payload
		// decodes to `{uid, email, fullName}` and hydrates `useKioskStore`
		// before the OTP page renders, so the screenshot shows the
		// truthful 6-digit input + masked email instead of the "no data"
		// fallback. The seeder is a no-op when this param is absent, so
		// the route remains safe to navigate in production traffic.
		route:
			"/otp?captureSeed=eyJ1aWQiOiJWLTEyMzQ1Njc4IiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiZnVsbE5hbWUiOiJEZW1vIFZpc2l0b3IifQ==",
		headingMatcher: "otp",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-otp",
	},
	{
		id: "kiosk-consentimiento",
		surface: CAPTURE_SURFACE.KIOSK,
		// Same `?captureSeed=...` contract as `kiosk-otp`: the seeder
		// hydrates the store so the page renders the form (not the
		// "redirect to /ingreso" branch) and the DOM redactions below
		// can swap the signer name + UID for `[REDACTED]` before the
		// screenshot.
		route:
			"/consentimiento?captureSeed=eyJ1aWQiOiJWLTEyMzQ1Njc4IiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiZnVsbE5hbWUiOiJEZW1vIFZpc2l0b3IifQ==",
		headingMatcher: "consentimiento",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-consentimiento",
		// DOM-level redactions applied before screenshot. The kiosk page renders
		// the signer's name and UID inside `data-pii` spans in the form header
		// card; `replace-text` swaps the cell contents for `[REDACTED]` while
		// keeping the surrounding layout intact. The signature pad and
		// policy box stay visible for reviewer sanity.
		redactions: [
			{
				selector: "[data-pii='kiosk-consent-name']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
			{
				selector: "[data-pii='kiosk-consent-uid']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
		],
	},
	{
		id: "kiosk-offline-success",
		surface: CAPTURE_SURFACE.KIOSK,
		route: "/exito?offline=1&nombre=Demo",
		headingMatcher: "exito",
		viewport: { width: 1280, height: 900 },
		fileName: "kiosk-offline-success",
	},
	{
		id: "admin-dashboard",
		surface: CAPTURE_SURFACE.ADMIN,
		route: "/admin",
		headingMatcher: "dashboard",
		viewport: { width: 1440, height: 900 },
		fileName: "admin-dashboard",
		// DOM-level redactions applied before screenshot. Selectors point at
		// `data-pii` hooks the admin components render; the list is reviewable
		// and limited to the admin header email + the transient search-result
		// card. Kiosk consentimiento redaction is intentionally deferred.
		redactions: [
			{ selector: "[data-pii='admin-header-email']", action: "hide" },
			{
				selector: "[data-pii='admin-search-result']",
				action: "hide",
			},
		],
	},
	{
		id: "admin-consents-list",
		surface: CAPTURE_SURFACE.ADMIN,
		route: "/admin/consentimientos",
		headingMatcher: "consentimientos",
		viewport: { width: 1440, height: 900 },
		fileName: "admin-consents-list",
		// DOM-level redactions for the consents list: hide the admin header
		// email and replace the obvious PII cell text (adult name, user id,
		// adult email, adult phone) with [REDACTED] so reviewers can still
		// see the table structure.
		redactions: [
			{ selector: "[data-pii='admin-header-email']", action: "hide" },
			{
				selector: "[data-pii='admin-consent-adult-name']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
			{
				selector: "[data-pii='admin-consent-adult-userid']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
			{
				selector: "[data-pii='admin-consent-adult-email']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
			{
				selector: "[data-pii='admin-consent-adult-phone']",
				action: "replace-text",
				replacement: "[REDACTED]",
			},
		],
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
