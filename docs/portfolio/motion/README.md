# Motion / HyperFrames compositions

HTML-first video composition for the Jumping Park portfolio.
This folder stays truthful to the product: no fake renders, no invented screens,
and no marketing assets disconnected from the real application.

## What this composition includes

`composition/` is a minimal HyperFrames project with a single root composition based on
7 real product screenshots:

1. **Kiosco &middot; Ingreso** - `screenshots/kiosk-ingreso.png`
2. **OTP Verification** - `screenshots/kiosk-otp.png`
3. **Digital Consent** - `screenshots/kiosk-consentimiento.png`
4. **Offline Success** - `screenshots/kiosk-offline-success.png`
5. **Admin Dashboard** - `screenshots/admin-dashboard.png`
6. **Consent Records** - `screenshots/admin-consents-list.png`
7. **Public Consent** - `screenshots/public-consentimiento-digital.png`

The composition ends with an honest text-only closing slate:
- `Jumping Park &middot; Product Tour`
- `7 scenes from real screenshots`
- `Real product screenshots &middot; Not a render`

Total duration: 78.0s. Narration, music, and MP4 rendering remain out of scope.

## Still out of scope

This composition still does **not** include:

- narration / TTS
- music or sound bed
- final MP4 render (`hyperframes render`)
- deploy or publication workflow
- `robots.txt` / `llms.txt` closing evidence scenes

## Local validation

From the repo root:

```bash
npx hyperframes lint docs/portfolio/motion/composition
npx hyperframes validate docs/portfolio/motion/composition
npx hyperframes inspect docs/portfolio/motion/composition
```

Expected current state:

- `lint` ? 0 errors, 0 warnings
- `validate` ? 0 errors, WCAG AA contrast clean
- `inspect` ? 0 layout issues on sampled timestamps

## Why this stays in lint / validate / preview mode

Final rendering (`hyperframes render`) depends on FFmpeg and a managed Chrome instance.
This change focuses on validating structure, timing, and accessibility of the composition.
Preview in the browser (`hyperframes preview`) is enough to review the tour interactively
without creating an MP4 that would become stale after copy or screenshot updates.

## File structure

```
docs/portfolio/motion/
+-- README.md            (this file)
+-- demo-script.md       (timeline and narrative notes)
+-- composition/
    +-- index.html       (root composition: 7 scenes + closing slate)
    +-- hyperframes.json (registry paths)
    +-- meta.json        (id, dimensions, fps)
    +-- assets/          (local copy of the 7 PNGs used by the composition)
```

## Why the images live in `composition/assets/`

The CLI serves `composition/` as the project root and browsers normalize any `..` path that
tries to escape that root, which would result in 404s for `../../screenshots/...`.
The screenshot source of truth remains `docs/portfolio/screenshots/`. If a screenshot changes,
copy the updated file into `composition/assets/` so the composition can load it.

## Composition conventions

- One root composition (`jp-tour`), no sub-compositions.
- Each image clip has its own `data-track-index` (1-7) so crossfades work by overlap.
- Each title has its own track (8-14). The closing slate lives on track 15.
- Explicit `z-index` values control layering; `data-track-index` stays a sequencing contract.
- Entrances use `gsap.from(...)`. The only `gsap.to(opacity: 0)` is the final image/title fade-out.
- No `Math.random`, no `Date.now`, no fetches. Deterministic behavior only.
- No custom `@font-face`; the composition uses generic sans-serif for portability.
