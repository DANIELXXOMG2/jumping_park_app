# Screenshot capture config schema

> **Status**: current
> **Diátaxis**: Reference
> **Audit date**: 2026-06-01

The Zod schema `screenshotCaptureConfigSchema` (in
`src/lib/schemas/screenshotCapture.schema.ts`) is the single source of truth for
the screenshot capture plan. The orchestrator parses every user override
through this schema before any browser is launched, so the shape below is
the contract between the config, the script, and the optimizer.

## Shape

```text
type CaptureSurface = "kiosk" | "admin" | "public";

type CaptureJob = {
	id: string;            // 1..64 chars, unique across the plan
	surface: CaptureSurface;
	route: string;         // must start with "/"
	headingMatcher?: string;
	viewport: { width: 320..3840, height: 240..2160 };
	fileName: string;      // lowercase kebab-case, e.g. "kiosk-ingreso"
};

type ScreenshotCaptureConfig = {
  outputDir: string;
  baseUrl: string;       // must be a valid URL
  timeoutMs?: 1000..120000; // default 15_000
  jobs: CaptureJob[];    // 1..64 entries
};
```

`fileName` is the PNG stem the optimizer (`scripts/optimize-screenshots.ts`)
reuses for the WebP asset (e.g. `kiosk-ingreso` →
`kiosk-ingreso.png` → `kiosk-ingreso.webp`).

## Default plan

`DEFAULT_CAPTURE_PLAN` mirrors every currently required still in
[`README.md`](./README.md), excluding the optional `kiosk-offline-success`
capture that only lands when that runtime exists:

| id | surface | route |
| --- | --- | --- |
| `kiosk-ingreso` | kiosk | `/ingreso` |
| `kiosk-otp` | kiosk | `/otp` |
| `kiosk-consentimiento` | kiosk | `/consentimiento` |
| `admin-dashboard` | admin | `/admin` |
| `admin-consents-list` | admin | `/admin/consentimientos` |
| `public-consentimiento-digital` | public | `/consentimiento-digital` |

`DEFAULT_CAPTURE_CONFIG` writes to `docs/portfolio/screenshots` and points
at `http://127.0.0.1:3000`. Viewport defaults are `1280x900` for kiosk and
public, `1440x900` for admin.

## What this slice does NOT do

- It does not run any capture. The orchestrator and CLI are a follow-up
  slice (`_deferred/slice-5.2-orchestrator/`).
- It does not commit real PNGs. Captures only land when the orchestrator
  lands.
- It does not add a `screenshot:capture` script entry. That wiring lands
  with the orchestrator so a non-existent script is never exposed.
