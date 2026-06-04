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

Total duration: 78.0s. The composition now includes a real Spanish TTS narration export wired into the root composition and a documented local render artifact trail.

## Narration and render workflow

The composition keeps the visuals honest and now uses a real local narration asset:

- `composition/assets/narration-script.es.txt` is the committed Spanish narration source used for TTS
- `composition/assets/voiceover.wav` is the generated narration audio from HyperFrames CLI using voice `ef_dora` and lang `es` (the previous planning name was `voiceover.mp3`, but the real generated artifact is WAV)
- audio is wired via a dedicated `<audio>` child element inside the root composition with standard HyperFrames clip attributes (`data-start`, `data-duration`, `data-track-index`, `src`)
- Optional planning path remains `composition/assets/music-bed.mp3`, but no such file exists in this task
- Audio bed: none unless a licensed file is explicitly added later
- final render is generated locally and recorded in `docs/portfolio/artifact-manifest.md`

Render commands:

```bash
bun x hyperframes render docs/portfolio/motion/composition
npx hyperframes render docs/portfolio/motion/composition --output docs/portfolio/renders/jumping-park-product-tour.mp4
```

After a real render/export pass:

1. Save the reviewed manifest as `docs/portfolio/artifact-manifest.md`.
2. Record narrator/TTS source, audio-bed decision, output filename, size, and duration.
3. Keep generated MP4 untracked unless the repository explicitly adopts a binary-artifact policy.

The repo now includes the small reproducible narration source and WAV asset because the composition depends on them for a truthful render.

Do not commit generated MP4 or WAV artifacts unless the repository explicitly adopts a binary-artifact policy for portfolio deliverables.
For this task, the WAV is committed as a small reproducible dependency of the composition; the MP4 remains local and untracked.

## Still out of scope

This composition still does **not** include:

- a committed music or sound bed
- deploy or publication workflow
- `robots.txt` / `llms.txt` closing evidence scenes

## Local validation

From the repo root:

```bash
npx hyperframes lint docs/portfolio/motion/composition
npx hyperframes validate docs/portfolio/motion/composition
npx hyperframes inspect docs/portfolio/motion/composition
bun test tests/portfolio-hyperframes-complete-scenes.test.ts tests/portfolio-hyperframes-render-output.test.ts
```

Expected current state:

- `lint` -> 0 errors, 0 warnings
- `validate` -> 0 errors, WCAG AA contrast clean
- `inspect` -> 0 layout issues on sampled timestamps
- targeted Bun tests -> passing

## File structure

```
docs/portfolio/motion/
+-- README.md                      (this file)
+-- demo-script.md                 (timeline and narrative notes)
+-- composition/
    +-- index.html                 (root composition: 7 scenes + closing slate + voiceover)
    +-- hyperframes.json           (registry paths)
    +-- meta.json                  (id, dimensions, fps)
    +-- assets/
        +-- narration-script.es.txt
        +-- voiceover.wav
        +-- *.png                  (local copy of the 7 PNGs used by the composition)
```

## Why the images live in `composition/assets/`

The CLI serves `composition/` as the project root and browsers normalize any `..` path that
tries to escape that root, which would result in 404s for `../../screenshots/...`.
The screenshot source of truth remains `docs/portfolio/screenshots/`. If a screenshot changes,
copy the updated file into `composition/assets/` so the composition can load it.

## Composition conventions

- One root composition (`jp-tour`), no sub-compositions.
- Root composition audio is the real generated narration WAV.
- Each image clip has its own `data-track-index` (1-7) so crossfades work by overlap.
- Each title has its own track (8-14). The closing slate lives on track 15.
- Explicit `z-index` values control layering; `data-track-index` stays a sequencing contract.
- Entrances use `gsap.from(...)`. The only `gsap.to(opacity: 0)` is the final image/title fade-out.
- No `Math.random`, no `Date.now`, no fetches. Deterministic behavior only.
- No custom `@font-face`; the composition uses generic sans-serif for portability.
