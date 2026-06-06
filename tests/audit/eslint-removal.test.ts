/**
 * ESLint Removal — Slice 4 TDD tests.
 *
 * Safety evidence (pre-deletion): eslint.config.mjs used ONLY stock
 * eslint-config-next presets (core-web-vitals + typescript) with ZERO custom
 * rules, plugins, or overrides. Biome covers all active lint rules.
 *
 * These tests verify the COMPLETENESS of ESLint removal.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
}

// ─── Task 4.1: Safety verification documented + post-removal clean ────────────

describe("4.1 — ESLint removal safety verified", () => {
  test("eslint.config.mjs is gone (safety check passed pre-deletion)", () => {
    // Pre-deletion evidence: file used stock presets only (core-web-vitals +
    // typescript), zero custom rules, zero plugins. Safety confirmed.
    const exists = existsSync(resolve(ROOT, "eslint.config.mjs"));
    expect(exists).toBe(false);
  });

  test("no fallback .eslintrc.* files exist (belt-and-suspenders)", () => {
    // Ensure no legacy ESLint config formats remain
    const legacyFormats = [
      ".eslintrc",
      ".eslintrc.js",
      ".eslintrc.cjs",
      ".eslintrc.json",
      ".eslintrc.yaml",
      ".eslintrc.yml",
    ];
    for (const fmt of legacyFormats) {
      expect(existsSync(resolve(ROOT, fmt))).toBe(false);
    }
  });
});

// ─── Task 4.2: eslint.config.mjs removed ──────────────────────────────────────

describe("4.2 — eslint.config.mjs removed", () => {
  test("eslint.config.mjs should NOT exist in project root", () => {
    const exists = existsSync(resolve(ROOT, "eslint.config.mjs"));
    expect(exists).toBe(false);
  });
});

// ─── Task 4.3: ESLint devDependencies removed ─────────────────────────────────

describe("4.3 — ESLint devDependencies removed", () => {
  test('"eslint" is NOT in package.json devDependencies', () => {
    const pkg = readPackageJson();
    const deps = pkg.devDependencies as Record<string, string> | undefined;
    const hasEslint = deps ? "eslint" in deps : false;
    expect(hasEslint).toBe(false);
  });

  test('"eslint-config-next" is NOT in package.json devDependencies', () => {
    const pkg = readPackageJson();
    const deps = pkg.devDependencies as Record<string, string> | undefined;
    const hasEslintConfigNext = deps ? "eslint-config-next" in deps : false;
    expect(hasEslintConfigNext).toBe(false);
  });

  // Triangulation edge case: entire package.json should have zero eslint mentions
  test("package.json has zero eslint-related strings anywhere", () => {
    const raw = readFileSync(resolve(ROOT, "package.json"), "utf-8");
    expect(raw).not.toMatch(/eslint/i);
  });
});

// ─── AGENTS.md update — no stale ESLint reference ──────────────────────────────

describe("AGENTS.md — Biome is sole linter", () => {
  test("does NOT reference eslintrc or eslint as a duplicate/second linter", () => {
    const content = readFileSync(resolve(ROOT, "AGENTS.md"), "utf-8");

    // The old line referenced `.eslintrc` as a duplicate lint config.
    // After ESLint removal, this stale reference must be gone.
    expect(content).not.toMatch(/eslintrc/i);
    expect(content).not.toMatch(/duplicate lint config/i);

    // Informational mention of ESLint removal is fine (e.g. "ESLint removed as redundant")
    // but there must be no suggestion eslint is still active.
    expect(content).toContain("ESLint removed");

    // Should explicitly affirm Biome as the sole linter
    expect(content).toContain("Biome is the sole linter");
  });

  // Triangulation: verify the Biome section still has key rules listed
  test("Biome section still lists key lint rules", () => {
    const content = readFileSync(resolve(ROOT, "AGENTS.md"), "utf-8");
    expect(content).toContain("noUnusedImports");
    expect(content).toContain("noUnusedVariables");
    expect(content).toContain("useExhaustiveDependencies");
  });
});

// ─── dependency-risk-note.md — ESLint removed from transitive tooling ──────────

describe("dependency-risk-note.md — ESLint removed from transitive tooling", () => {
  test("does NOT list eslint in transitive tooling section", () => {
    const content = readFileSync(
      resolve(ROOT, "docs/runbooks/dependency-risk-note.md"),
      "utf-8",
    );

    // The old entries listing eslint and eslint-config-next as transitive tooling
    // must be removed.
    expect(content).not.toMatch(/via `eslint`/);
    expect(content).not.toMatch(/`eslint-config-next`/);
  });

  // Triangulation: the file should still document other transitive tooling
  test("still documents other transitive tooling (knip, jscpd, depcruiser)", () => {
    const content = readFileSync(
      resolve(ROOT, "docs/runbooks/dependency-risk-note.md"),
      "utf-8",
    );
    // picomatch is still documented via these tools
    expect(content).toContain("picomatch");
    // knip and jscpd should still be referenced
    expect(content).toMatch(/knip/);
    expect(content).toMatch(/jscpd/);
    expect(content).toMatch(/dependency-cruiser/);
  });
});

// ─── Check chain — no eslint in daily gate ────────────────────────────────────

describe("check chain — no eslint in daily gate", () => {
  test('"check" script does not reference eslint', () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string> | undefined;
    const checkScript = scripts?.["check"] ?? "";
    expect(checkScript).not.toMatch(/eslint/i);
  });

  test("no eslint-related scripts remain in package.json", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    const eslintScripts = Object.keys(scripts).filter((k) =>
      /eslint/i.test(k),
    );
    expect(eslintScripts).toEqual([]);
  });
});
