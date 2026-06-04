# Short demo script

HyperFrames composition: `docs/portfolio/motion/composition/`
Total duration: 78.0s (7 sequential scenes plus a 4.5s closing slate).

## Timeline

| t (s)        | Track      | Clip                     | Notes |
| ------------ | ---------- | ------------------------ | ----- |
| 0.0 - 10.5   | 1 (img)    | `scene-kiosk`            | kiosk ingreso |
| 0.4 - 10.0   | 8 (title)  | `title-kiosk`            | title enters after scene |
| 10.5 - 21.0  | 2 (img)    | `scene-kiosk-otp`        | OTP verification crossfade |
| 10.9 - 20.5  | 9 (title)  | `title-kiosk-otp`        | title enters after scene |
| 21.0 - 31.5  | 3 (img)    | `scene-kiosk-consent`    | consent flow crossfade |
| 21.4 - 31.0  | 10 (title) | `title-kiosk-consent`    | title enters after scene |
| 31.5 - 42.0  | 4 (img)    | `scene-kiosk-offline`    | offline success crossfade |
| 31.9 - 41.5  | 11 (title) | `title-kiosk-offline`    | title enters after scene |
| 42.0 - 52.5  | 5 (img)    | `scene-admin-dash`       | admin dashboard crossfade |
| 42.4 - 52.0  | 12 (title) | `title-admin-dash`       | title enters after scene |
| 52.5 - 63.0  | 6 (img)    | `scene-admin-consents`   | consent records crossfade |
| 52.9 - 62.5  | 13 (title) | `title-admin-consents`   | title enters after scene |
| 63.0 - 73.5  | 7 (img)    | `scene-public`           | public consent crossfade |
| 63.4 - 73.0  | 14 (title) | `title-public`           | title enters after scene |
| 73.5 - 78.0  | 15 (slate) | `outro-card`             | honest closing slate |

Transitions use varied GSAP easing functions across scenes (expo.out, power3.out, power4.out, back.out, circ.out) to avoid identical crossfades. Every entering scene uses
`gsap.from({ opacity: 0 })`, every title enters with `y: -16` after a 0.4s offset, and only
the final scene plus its title use `gsap.to({ opacity: 0 })` before the slate appears.

## Captures used (source of truth)

- `docs/portfolio/screenshots/kiosk-ingreso.png`
- `docs/portfolio/screenshots/kiosk-otp.png`
- `docs/portfolio/screenshots/kiosk-consentimiento.png`
- `docs/portfolio/screenshots/kiosk-offline-success.png`
- `docs/portfolio/screenshots/admin-dashboard.png`
- `docs/portfolio/screenshots/admin-consents-list.png`
- `docs/portfolio/screenshots/public-consentimiento-digital.png`

These same images are copied into `composition/assets/` because the CLI serves the composition
root and does not resolve `..` paths above that root. The source of truth remains
`docs/portfolio/screenshots/`.

## Closing slate

- Heading: `Jumping Park - Product Tour`
- Description: `7 scenes from real screenshots`
- Badge: `Real product screenshots - Not a render`

## Narration cues

Generated TTS export: `composition/assets/voiceover.wav` (single combined WAV; not per-scene clips)
Source script: `composition/assets/narration-script.es.txt`
Voice: `ef_dora`
Language: `es`
Generated duration target from CLI: about 55.4s; the remainder of the 78.0s composition plays without narration over the last visual beats.

| t (s) | Cue |
| ----- | --- |
| 0.0 - 10.5 | Introduce kiosk intake and explain that the flow starts from the real ingreso screen. |
| 10.5 - 21.0 | Call out OTP verification as the identity/guardian checkpoint. |
| 21.0 - 31.5 | Describe the digital consent capture step and signature flow. |
| 31.5 - 42.0 | Explain the offline success path and resilience angle. |
| 42.0 - 52.5 | Summarize the admin dashboard view and operational visibility. |
| 52.5 - 63.0 | Highlight searchable consent records for follow-up and auditability. |
| 63.0 - 73.5 | Close on the public consent surface and external shareability. |
| 73.5 - 78.0 | Restate that the reel uses real screenshots, not speculative renders. |

## Audio bed cues

- Audio bed: none
- Reason: no licensed or reviewed music bed was created in this task, so the render remains narration-only by design.
- If licensing and mix review happen later, add the file explicitly and update the manifest instead of implying it exists.

## Render evidence checklist

1. Run `npx hyperframes render docs/portfolio/motion/composition --output docs/portfolio/renders/jumping-park-product-tour.mp4`.
2. Save the output filename, TTS source, audio-bed decision, and media stats in `docs/portfolio/artifact-manifest.md`.
3. Capture review evidence in the same change note or release artifact trail.
4. Do not commit generated MP4 by default.

## Local validation

```bash
npx hyperframes lint docs/portfolio/motion/composition
npx hyperframes validate docs/portfolio/motion/composition
npx hyperframes inspect docs/portfolio/motion/composition
```
