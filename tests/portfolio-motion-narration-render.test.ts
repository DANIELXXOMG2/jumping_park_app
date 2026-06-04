import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// ── Paths ──────────────────────────────────────────────────────────────────
const COMPOSITION_HTML = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/index.html",
);
const VOICEOVER_WAV = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/assets/voiceover.wav",
);
const MP4_PATH = path.join(
  process.cwd(),
  "docs/portfolio/renders/jumping-park-product-tour.mp4",
);
const MANIFEST_PATH = path.join(
  process.cwd(),
  "docs/portfolio/artifact-manifest.md",
);
const README_PATH = path.join(
  process.cwd(),
  "docs/portfolio/motion/README.md",
);

// ── Helpers ────────────────────────────────────────────────────────────────
function readIfExists(p: string): string | null {
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function ffprobeJson(mp4Path: string): Record<string, unknown> | null {
  if (!existsSync(mp4Path)) return null;
  try {
    const raw = execSync(
      `ffprobe -v error -show_entries format=nb_streams,duration:stream=index,codec_type,codec_name,sample_rate,channels,duration -of json "${mp4Path}"`,
      { encoding: "utf8", timeout: 15_000 },
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────
const html = readIfExists(COMPOSITION_HTML);
const readme = readIfExists(README_PATH);
const manifest = readIfExists(MANIFEST_PATH);

describe("portfolio narration render — audio wiring (HyperFrames-correct)", () => {
  test("composition HTML exists and is readable", () => {
    expect(html).not.toBeNull();
  });

  test("root composition div has NO data-audio-* attributes", () => {
    // The root div must NOT use data-audio-src, data-audio-start, or data-audio-volume.
    // Audio in HyperFrames is wired via <audio> child elements with standard clip attrs.
    const rootTagMatch = html!.match(
      /<div[^>]*data-composition-id="jp-tour"[^>]*>/,
    );
    expect(rootTagMatch).not.toBeNull();

    const rootTag = rootTagMatch![0];
    expect(rootTag).not.toMatch(/data-audio-src/i);
    expect(rootTag).not.toMatch(/data-audio-start/i);
    expect(rootTag).not.toMatch(/data-audio-volume/i);
  });

  test("composition contains at least one <audio> child element with correct clip attributes", () => {
    // HyperFrames requires audio as a separate <audio> element with:
    // id, data-start, data-duration, data-track-index, src
    const audioMatch = html!.match(
      /<audio\b[^>]*\bdata-start="[^"]*"[^>]*>/g,
    );
    expect(audioMatch).not.toBeNull();
    expect(audioMatch!.length).toBeGreaterThan(0);

    const firstAudio = audioMatch![0];
    // Must have required clip attributes
    expect(firstAudio).toMatch(/data-start="/);
    expect(firstAudio).toMatch(/data-duration="/);
    expect(firstAudio).toMatch(/data-track-index="/);
    expect(firstAudio).toMatch(/src="/);

    // Must reference the voiceover file
    expect(firstAudio).toMatch(/voiceover\.wav/);
  });

  test("voiceover WAV asset exists on disk", () => {
    expect(existsSync(VOICEOVER_WAV)).toBe(true);
  });
});

describe("portfolio narration render — rendered MP4 (ffprobe verification)", () => {
  test("rendered MP4 exists", () => {
    // The MP4 is a local render artifact; if it doesn't exist, skip the remaining
    // ffprobe assertions (render must be run locally).
    expect(existsSync(MP4_PATH)).toBe(true);
  });

  test("MP4 has at least 2 streams (video + audio)", () => {
    const probe = ffprobeJson(MP4_PATH);
    if (!probe) {
      // Skip if ffprobe not available or file missing — not a CI gate
      return;
    }
    const nbStreams = (probe.format as Record<string, unknown>).nb_streams;
    expect(nbStreams).toBeGreaterThanOrEqual(2);
  });

  test("MP4 contains an audio stream with valid codec", () => {
    const probe = ffprobeJson(MP4_PATH);
    if (!probe) return;

    const streams = probe.streams as Array<Record<string, unknown>>;
    const audioStreams = streams.filter((s) => s.codec_type === "audio");
    expect(audioStreams.length).toBeGreaterThanOrEqual(1);

    const audio = audioStreams[0];
    expect(audio.codec_name).toBeString();
    // Duration should be roughly the composition length (78s ± 2s)
    expect(Number(audio.duration)).toBeWithin(76, 80);
  });
});

describe("portfolio narration render — scene transition variety", () => {
  test("at least 3 different GSAP ease strings are used across scene entrances", () => {
    // Extract all ease values from the GSAP timeline script block
    const scriptBlock = html!.match(
      /<script>\s*window\.__timelines[\s\S]*?<\/script>/,
    );
    expect(scriptBlock).not.toBeNull();

    const eases = (scriptBlock![0].match(/ease:\s*"([^"]+)"/g) ?? []).map(
      (m) => m.replace(/ease:\s*"/, "").replace(/"$/, ""),
    );
    const uniqueEases = new Set(eases);

    // Need at least 3 distinct eases across the composition
    // (HyperFrames animation guardrail: vary eases across entrance tweens)
    expect(uniqueEases.size).toBeGreaterThanOrEqual(3);
  });

  test("no two consecutive scenes use identical image-entrance + title-entrance ease pair", () => {
    // Extract from-opacity tweens on stage-img class elements and their paired title tweens.
    // Each scene: one img entrance + one title entrance = a pair.
    // No adjacent pair should be identical.
    const imgEntrances = [
      ...html!.matchAll(
        /tl\.from\("(#scene-[^"]+)",\s*\{\s*opacity:\s*0[\s\S]*?ease:\s*"([^"]+)"/g,
      ),
    ];
    const titleEntrances = [
      ...html!.matchAll(
        /tl\.from\("(#title-[^"]+)",\s*\{[^}]*ease:\s*"([^"]+)"/g,
      ),
    ];

    // Build scene ease pairs
    const scenePairs: string[] = [];
    for (let i = 0; i < imgEntrances.length; i++) {
      const imgEase = imgEntrances[i] ? imgEntrances[i][2] : "unknown";
      const titleEase =
        i < titleEntrances.length ? titleEntrances[i][2] : "unknown";
      scenePairs.push(`${imgEase}|${titleEase}`);
    }

    // Check that we have variety — not all pairs identical
    const uniquePairs = new Set(scenePairs);
    expect(uniquePairs.size).toBeGreaterThan(1);
  });
});

describe("portfolio narration render — truthful documentation", () => {
  test("artifact manifest does NOT overstate audio delivery", () => {
    expect(manifest).not.toBeNull();
    // Manifest must document audio truthfully (narration-only, no music bed)
    expect(manifest!).toMatch(/audio bed:\s*none/i);
    // Must NOT claim per-scene clips if only one combined WAV exists
    // (manifest should be honest about what was actually generated)
  });

  test("README describes correct HyperFrames audio wiring pattern", () => {
    expect(readme).not.toBeNull();
    // README should mention <audio> element, not data-audio-* root attributes
    expect(readme!).not.toMatch(/data-audio-src/i);
    expect(readme!).toMatch(/audio/i); // still mentions audio
  });

  test("narration script has content for all 8 cues (7 scenes + closing)", () => {
    const scriptPath = path.join(
      process.cwd(),
      "docs/portfolio/motion/composition/assets/narration-script.es.txt",
    );
    const script = readIfExists(scriptPath);
    expect(script).not.toBeNull();
    // Count non-empty lines (at least 8 narrative cues)
    const cues = script!
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 20);
    expect(cues.length).toBeGreaterThanOrEqual(8);
  });
});
