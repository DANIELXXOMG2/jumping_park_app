# Portfolio artifact manifest

## Motion render

- Change: `portfolio-motion-narration-render`
- Composition: `docs/portfolio/motion/composition`
- Render status: generated locally (corrective re-render after audio wiring fix)
- Render command: `npx hyperframes render docs/portfolio/motion/composition --output docs/portfolio/renders/jumping-park-product-tour.mp4`
- Output file: `docs/portfolio/renders/jumping-park-product-tour.mp4`
- TTS script: `docs/portfolio/motion/composition/assets/narration-script.es.txt`
- TTS voice: `ef_dora`
- Language: `es`
- Audio file: `docs/portfolio/motion/composition/assets/voiceover.wav`
- Audio duration: `55.445s` (single combined WAV; not per-scene clips)
- Audio size: `2,661,420 bytes`
- Audio wiring: `<audio>` child element with standard HyperFrames clip attributes (`data-start`, `data-duration`, `data-track-index`, `src`). Previously used undocumented root-level `data-audio-*` attributes — corrected.
- Audio bed: none
- Audio bed rationale: no licensed or sourced bed was created in this change, so the render stays narration-only.
- MP4 verification: ffprobe confirms `nb_streams=2` (h264 video + aac 48kHz stereo audio), duration 78.0s
- MP4 size: 3.8 MB
- Scene transitions: varied GSAP eases across all 7 scenes (expo.out, power3.out, power4.out, back.out, circ.out) replacing identical power2.out crossfades
- Truthfulness note: visuals come from 7 real product screenshots; narration is a generated local TTS export; the MP4 is a local render artifact and should remain untracked unless binary artifact policy changes.
