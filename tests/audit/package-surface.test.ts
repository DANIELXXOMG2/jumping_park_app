/**
 * Package.json Surface Reduction — Slice 5 TDD tests.
 *
 * These tests verify the package.json scripts section has been reduced to
 * ≤12 daily commands and that low-frequency commands are documented in
 * the archive README.
 *
 * RED phase: tests reference the final expected state that does NOT exist yet.
 * Current package.json has 28 top-level scripts; these tests will FAIL
 * until the GREEN phase reduces them.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
}

function readArchiveReadme(): string {
  return readFileSync(resolve(ROOT, "scripts", "archive", "README.md"), "utf-8");
}

function getScriptKeys(): string[] {
  const pkg = readPackageJson();
  const scripts = pkg.scripts as Record<string, string> | undefined;
  if (!scripts) return [];
  return Object.keys(scripts);
}

// ─── Task 5.1: Script count ≤12 ───────────────────────────────────────────────

describe("5.1 — Package.json scripts surface ≤12", () => {
  test("has at most 12 top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys.length).toBeLessThanOrEqual(12);
  });

  test("daily scripts are present", () => {
    const keys = getScriptKeys();
    const required = [
      "dev",
      "build",
      "start",
      "test",
      "check",
      "fix:format",
      "fix:lint",
      "audit",
      "seed",
      "backup",
      "set-admin",
      "diagram:render",
    ];
    for (const script of required) {
      expect(keys).toContain(script);
    }
  });
});

// ─── Task 5.1: Removed scripts are absent ──────────────────────────────────────

describe("5.1 — Low-frequency scripts removed from surface", () => {
  test("individual audit sub-commands are NOT top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys).not.toContain("audit:dead");
    expect(keys).not.toContain("audit:dupe");
    expect(keys).not.toContain("audit:circ");
  });

  test("check sub-scripts are NOT top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys).not.toContain("check:format");
    expect(keys).not.toContain("check:lint");
    expect(keys).not.toContain("check:types");
    expect(keys).not.toContain("check:docs");
  });

  test("docs sub-phase entry points are NOT top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys).not.toContain("check:docs:lint");
    expect(keys).not.toContain("check:docs:links");
    expect(keys).not.toContain("check:docs:redact");
    expect(keys).not.toContain("check:docs:drift");
  });

  test("optimization and validation scripts are NOT top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys).not.toContain("optimize:images");
    expect(keys).not.toContain("optimize:screenshots");
    expect(keys).not.toContain("validate:evidence");
    expect(keys).not.toContain("screenshot:capture");
  });

  test("playwright and E2E scripts are NOT top-level scripts", () => {
    const keys = getScriptKeys();
    expect(keys).not.toContain("playwright:install");
    expect(keys).not.toContain("test:a11y:e2e");
  });
});

// ─── Task 5.1: check script is self-contained ──────────────────────────────────

describe("5.1 — check script is self-contained", () => {
  test("check script does NOT reference removed sub-scripts", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    const checkCmd = scripts["check"] || "";
    // check should NOT use bun run check:format, check:lint, etc.
    expect(checkCmd).not.toContain("check:format");
    expect(checkCmd).not.toContain("check:lint");
    expect(checkCmd).not.toContain("check:types");
    expect(checkCmd).not.toContain("check:docs");
  });

  test("check script references the actual tools directly", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    const checkCmd = scripts["check"] || "";
    // check should call biome, tsc, and the script files directly
    expect(checkCmd).toContain("biome");
    expect(checkCmd).toContain("tsc");
    expect(checkCmd).toContain("scripts/check-docs.ts");
    expect(checkCmd).toContain("scripts/audit.ts");
  });
});

// ─── Task 5.2: Archive README documents removed commands ───────────────────────

describe("5.2 — Archive README documents removed commands", () => {
  test("README includes direct execution equivalents for archived scripts", () => {
    const readme = readArchiveReadme();
    // Low-frequency commands should be documented with their direct run command
    expect(readme).toMatch(/playwright:install/);
    expect(readme).toMatch(/optimize:images/);
    expect(readme).toMatch(/optimize:screenshots/);
    expect(readme).toMatch(/validate:evidence/);
  });

  test("README includes audit sub-command equivalents", () => {
    const readme = readArchiveReadme();
    expect(readme).toMatch(/audit:dead/);
    expect(readme).toMatch(/audit:dupe/);
    expect(readme).toMatch(/audit:circ/);
  });

  test("README includes check sub-script equivalents", () => {
    const readme = readArchiveReadme();
    expect(readme).toMatch(/check:docs:lint/);
    expect(readme).toMatch(/check:docs:drift/);
  });

  test("README includes check pipeline reference (check:format, check:lint, check:types, check:docs)", () => {
    const readme = readArchiveReadme();
    // check sub-commands that are no longer top-level
    expect(readme).toMatch(/check:format/);
    expect(readme).toMatch(/check:lint/);
    expect(readme).toMatch(/check:types/);
    expect(readme).toMatch(/check:docs\b/);
  });
});

// ─── Task 5.3: bun run reports ≤12 top-level scripts ───────────────────────────

describe("5.3 — bun run surface verification", () => {
  test("exactly 12 scripts match the target set", () => {
    const keys = getScriptKeys();
    const target = [
      "dev",
      "build",
      "start",
      "test",
      "check",
      "fix:format",
      "fix:lint",
      "audit",
      "seed",
      "backup",
      "set-admin",
      "diagram:render",
    ];
    // Every key must be in target
    for (const key of keys) {
      expect(target).toContain(key);
    }
    // Every target must be a key
    for (const t of target) {
      expect(keys).toContain(t);
    }
    // Exact count matches
    expect(keys.length).toBe(target.length);
  });
});

// ─── Triangulation: cross-cutting integrity ────────────────────────────────────

describe("Triangulation — cross-cutting integrity checks", () => {
  test("fix:format and fix:lint reference biome directly, not removed sub-scripts", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["fix:format"]).toContain("biome");
    expect(scripts["fix:format"]).not.toContain("check:format");
    expect(scripts["fix:lint"]).toContain("biome");
    expect(scripts["fix:lint"]).not.toContain("check:lint");
  });

  test("seed, backup, and set-admin reference scripts/ paths directly", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["seed"]).toContain("scripts/seed-database.ts");
    expect(scripts["backup"]).toContain("scripts/backup.ts");
    expect(scripts["set-admin"]).toContain("scripts/set-admin-role.ts");
  });

  test("no removed script key appears anywhere in package.json as a JSON key", () => {
    const raw = readFileSync(resolve(ROOT, "package.json"), "utf-8");
    const removed = [
      "audit:dead",
      "audit:dupe",
      "audit:circ",
      "check:docs:lint",
      "check:docs:links",
      "check:docs:redact",
      "check:docs:drift",
      "check:format",
      "check:lint",
      "check:types",
      "check:docs",
      "optimize:images",
      "optimize:screenshots",
      "validate:evidence",
      "screenshot:capture",
      "playwright:install",
      "test:a11y:e2e",
    ];
    // A JSON script key appears as `"key":` in the file
    for (const key of removed) {
      const pattern = new RegExp(`"${key}"\\s*:`);
      expect(raw).not.toMatch(pattern);
    }
  });

  test("dev, build, start are pinned to next commands", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["dev"]).toBe("next dev");
    expect(scripts["build"]).toBe("next build");
    expect(scripts["start"]).toBe("next start");
  });

  test("test script correctly points to bun test", () => {
    const pkg = readPackageJson();
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts["test"]).toBe("bun test");
  });
});
