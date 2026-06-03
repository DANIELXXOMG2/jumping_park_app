import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const compositionPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/index.html",
);
const metaPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/composition/meta.json",
);
const demoScriptPath = path.join(
  process.cwd(),
  "docs/portfolio/motion/demo-script.md",
);
const readmePath = path.join(process.cwd(), "docs/portfolio/motion/README.md");

const composition = readFileSync(compositionPath, "utf8");
const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
  name: string;
  description: string;
};
const demoScript = readFileSync(demoScriptPath, "utf8");
const readme = readFileSync(readmePath, "utf8");

const SCENE_IDS = [
  "scene-kiosk",
  "scene-kiosk-otp",
  "scene-kiosk-consent",
  "scene-kiosk-offline",
  "scene-admin-dash",
  "scene-admin-consents",
  "scene-public",
] as const;

const TITLE_IDS = [
  "title-kiosk",
  "title-kiosk-otp",
  "title-kiosk-consent",
  "title-kiosk-offline",
  "title-admin-dash",
  "title-admin-consents",
  "title-public",
] as const;

function getAttributeBlock(id: string): string {
  const startToken = `id="${id}"`;
  const startIndex = composition.indexOf(startToken);

  if (startIndex === -1) {
    throw new Error(`Block not found for ${id}`);
  }

  const tagStart = composition.lastIndexOf("<", startIndex);
  const tagEnd = composition.indexOf(">", startIndex,
  );

  return composition.slice(tagStart, tagEnd + 1);
}

function getAttributeValue(block: string, attribute: string): string {
  const match = block.match(new RegExp(`${attribute}="([^"]+)"`));

  if (!match) {
    throw new Error(`Attribute ${attribute} not found in block: ${block}`);
  }

  return match[1];
}

describe("portfolio HyperFrames complete scenes", () => {
  test("references all seven scenes in the required order with 10.5s timing", () => {
    const orderedIds = SCENE_IDS.map((id) => composition.indexOf(`id="${id}"`));

    expect(orderedIds.every((index) => index !== -1)).toBe(true);
    expect([...orderedIds].sort((a, b) => a - b)).toEqual(orderedIds);

    const expectedStarts = ["0", "10.5", "21.0", "31.5", "42.0", "52.5", "63.0"];

    for (const [index, id] of SCENE_IDS.entries()) {
      const block = getAttributeBlock(id);

      expect(getAttributeValue(block, "data-track-index")).toBe(String(index + 1));
      expect(getAttributeValue(block, "data-start")).toBe(expectedStarts[index]);
      expect(getAttributeValue(block, "data-duration")).toBe("10.5");
    }
  });

  test("uses sequential title tracks and an honest closing slate", () => {
    for (const [index, id] of TITLE_IDS.entries()) {
      const block = getAttributeBlock(id);
      expect(getAttributeValue(block, "data-track-index")).toBe(String(index + 8));
    }

    const outroBlock = getAttributeBlock("outro-card");

    expect(getAttributeValue(outroBlock, "data-track-index")).toBe("15");
    expect(getAttributeValue(outroBlock, "data-start")).toBe("73.5");
    expect(getAttributeValue(outroBlock, "data-duration")).toBe("4.5");
    expect(composition).toContain("Jumping Park &middot; Product Tour");
    expect(composition).toContain("7 scenes from real screenshots");
    expect(composition).toContain("Real product screenshots &middot; Not a render");
    expect(composition).not.toContain("portfolio en construccion");
    expect(composition).not.toContain("Slice 1 / N");
  });

  test("updates root metadata and documentation to match the complete tour", () => {
    expect(composition).toContain("<title>");
    expect(composition).toContain("Jumping Park");
    expect(composition).toContain("Product Tour");
    expect(composition).toContain('data-composition-id="jp-tour"');
    expect(composition).toContain('data-duration="78"');
    expect(meta.name).toContain("Jumping Park");
    expect(meta.name).toContain("Product Tour");
    expect(meta.description).toContain("Seven-scene product tour");
    expect(demoScript).toContain("Total duration: 78.0s");
    expect(demoScript).toContain("scene-kiosk-offline");
    expect(readme).toContain("7 real product screenshots");
    expect(readme).toContain("One root composition (`jp-tour`)"
    );
  });
});


