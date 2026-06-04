import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const compositionPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/index.html",
);
const scriptPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/assets/narration-script.es.txt",
);
const voiceoverPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/assets/voiceover.wav",
);
const manifestPath = path.join(
  process.cwd(),
  "docs/portfolio/artifact-manifest.md",
);
const readmePath = path.join(process.cwd(), "docs/portfolio/motion/README.md");
const demoScriptPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/demo-script.md",
);

const composition = readFileSync(compositionPath, "utf8");
const script = readFileSync(scriptPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const demoScript = readFileSync(demoScriptPath, "utf8");
const manifest = existsSync(manifestPath)
  ? readFileSync(manifestPath, "utf8")
  : "";

describe("portfolio narration render output", () => {
  test("documents the real Spanish narration source and composition audio asset", () => {
    expect(script).toContain("Bienvenidos al recorrido real de Jumping Park.");
    expect(script).toContain("La primera escena muestra el ingreso del kiosco");
    expect(script).toContain("Este video usa siete escenas tomadas de capturas reales del producto");
    expect(existsSync(voiceoverPath)).toBe(true);
    // Audio must be wired via <audio> child element, NOT data-audio-* root attributes
    expect(composition).toMatch(/<audio\b[^>]*\bsrc="assets\/voiceover\.wav"/);
    expect(composition).toContain('data-start="0"');
    expect(composition).toContain('data-track-index="16"');
  });

  test("records truthful render evidence and no-bed decision", () => {
    expect(manifest).toContain("TTS voice: `ef_dora`");
    expect(manifest).toContain("Language: `es`");
    expect(manifest).toContain("Audio bed: none");
    expect(manifest).toContain("Render status: generated locally");
    expect(readme).toContain("voiceover.wav");
    expect(readme).toContain("Audio bed: none unless a licensed file is explicitly added later");
    expect(demoScript).toContain("Generated TTS export: `composition/assets/voiceover.wav`");
  });
});
