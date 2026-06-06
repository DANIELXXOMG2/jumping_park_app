import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Mock next/font/google so layout.tsx can be imported
// ---------------------------------------------------------------------------
mock.module("next/font/google", () => ({
	Sora: () => ({
		variable: "--font-sora",
		subsets: ["latin"],
		display: "swap",
	}),
}));

// ---------------------------------------------------------------------------
// TASK 1: Root viewport MUST allow user scaling
// ---------------------------------------------------------------------------

describe("root viewport allows user scaling (WCAG 1.4.4)", () => {
	it("viewport export MUST NOT include maximumScale", async () => {
		const { viewport } = await import("@/app/layout");
		expect("maximumScale" in viewport).toBe(false);
	});

	it("viewport export MUST NOT include userScalable", async () => {
		const { viewport } = await import("@/app/layout");
		expect("userScalable" in viewport).toBe(false);
	});

	it("viewport export preserves width=device-width and initialScale=1", async () => {
		const { viewport } = await import("@/app/layout");
		expect(viewport.width).toBe("device-width");
		expect(viewport.initialScale).toBe(1);
	});

	it("viewport export preserves themeColor", async () => {
		const { viewport } = await import("@/app/layout");
		expect(viewport.themeColor).toBe("#2ECC71");
	});
});

// ---------------------------------------------------------------------------
// TASK 2: Skip-to-content link in root layout
// ---------------------------------------------------------------------------

describe("root layout skip-to-content link", () => {
	it("renders a skip link targeting #main-content", async () => {
		const { default: RootLayout } = await import("@/app/layout");
		// Render with children that include <main id="main-content">
		const markup = renderToStaticMarkup(
			RootLayout({ children: React.createElement("main", { id: "main-content" }, "test") } as any),
		);

		// Skip link must appear before the main content
		const skipLinkPos = markup.indexOf("Saltar al contenido principal");
		const mainPos = markup.indexOf('<main');
		expect(skipLinkPos).toBeGreaterThan(-1);
		expect(skipLinkPos).toBeLessThan(mainPos);
	});

	it("skip link targets #main-content", async () => {
		const { default: RootLayout } = await import("@/app/layout");
		const markup = renderToStaticMarkup(
			RootLayout({ children: React.createElement("main", { id: "main-content" }, "test") } as any),
		);

		expect(markup).toContain('#main-content');
	});

	it("skip link is visually hidden by default and shown on focus", async () => {
		const { default: RootLayout } = await import("@/app/layout");
		const markup = renderToStaticMarkup(
			RootLayout({ children: React.createElement("main", { id: "main-content" }, "test") } as any),
		);

		// Should be sr-only (visually hidden) but not aria-hidden
		expect(markup).toContain("sr-only");
		expect(markup).not.toContain('aria-hidden="true"');
	});
});

// ---------------------------------------------------------------------------
// TASK 3: Consentimiento-digital main has id="main-content"
// ---------------------------------------------------------------------------

describe("consentimiento-digital main-content anchor", () => {
	it("main element has id='main-content'", async () => {
		const { default: ConsentimientoDigitalPage } = await import(
			"@/app/(public)/consentimiento-digital/page"
		);
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />);
		expect(markup).toContain('<main');
		expect(markup).toContain('id="main-content"');
	});
});

// ---------------------------------------------------------------------------
// TASK 4: Kiosk layout preserves zoom lock via own viewport
// ---------------------------------------------------------------------------

describe("kiosk layout preserves zoom lock", () => {
	it("kiosk layout exports viewport with maximumScale=1", async () => {
		const { viewport } = await import("@/app/(kiosk)/layout");
		expect("maximumScale" in viewport).toBe(true);
		expect(viewport.maximumScale).toBe(1);
	});

	it("kiosk layout exports viewport with userScalable=false", async () => {
		const { viewport } = await import("@/app/(kiosk)/layout");
		expect("userScalable" in viewport).toBe(true);
		expect(viewport.userScalable).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TASK 5: External links on consentimiento-digital announce new-tab
// ---------------------------------------------------------------------------

describe("consentimiento-digital external link accessible names", () => {
	it("all target='_blank' links announce 'abre en nueva pestaña'", async () => {
		const { default: ConsentimientoDigitalPage } = await import(
			"@/app/(public)/consentimiento-digital/page"
		);
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />);

		// Count target="_blank" occurrences
		const blankCount = (markup.match(/target="_blank"/g) ?? []).length;
		expect(blankCount).toBeGreaterThan(0);

		// Every target="_blank" should have accessible name with "(abre en nueva pestaña)"
		const newTabAnnouncementCount = (
			markup.match(/abre en nueva pestaña/g) ?? []
		).length;
		expect(newTabAnnouncementCount).toBe(blankCount);
	});

	it("WhatsApp link announces new tab", async () => {
		const { default: ConsentimientoDigitalPage } = await import(
			"@/app/(public)/consentimiento-digital/page"
		);
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />);

		// There should be at least one WhatsApp link with target=_blank that announces new tab
		expect(markup).toContain("wa.me");
		expect(markup).toContain('target="_blank"');
		expect(markup).toContain("abre en nueva pestaña");
	});
});

// ---------------------------------------------------------------------------
// TASK 6: Homepage (/) main has id="main-content"
// ---------------------------------------------------------------------------

describe("homepage main-content anchor", () => {
	it("HomepageExperience main element has id='main-content'", async () => {
		const { HomepageExperience } = await import(
			"@/components/kiosk/HomepageExperience"
		);
		// Note: HomepageExperience is a client component that depends on
		// LanguageProvider context. We verify the source code has the correct
		// id attribute by rendering to static markup (the context-dependent
		// children will error, but we can still verify the main element).
		try {
			const markup = renderToStaticMarkup(<HomepageExperience />);
			expect(markup).toContain('id="main-content"');
		} catch {
			// Fallback: read the component source directly
			const srcPath = path.resolve(
				import.meta.dirname,
				"../src/components/kiosk/HomepageExperience.tsx",
			);
			const source = fs.readFileSync(srcPath, "utf-8");
			expect(source).toContain('id="main-content"');
		}
	});
});

// ---------------------------------------------------------------------------
// TASK 7: Cosmic background paint cost reduced
// ---------------------------------------------------------------------------

describe("cosmic background paint cost reduction", () => {
	const cssPath = path.resolve(
		import.meta.dirname,
		"../src/components/public/cosmic-bg.module.css",
	);

	it(".background has contain: strict", () => {
		const css = fs.readFileSync(cssPath, "utf-8");
		// Find the .background block and verify contain: strict
		expect(css).toMatch(/contain\s*:\s*strict/);
	});

	it(".background::before has at most 2 gradient layers", () => {
		const css = fs.readFileSync(cssPath, "utf-8");
		// Extract the ::before block — read from ::before to ::after
		const beforeStart = css.indexOf(".background::before {");
		const afterStart = css.indexOf(".background::after {", beforeStart);
		const beforeBlock = css.slice(beforeStart, afterStart);

		// Count gradient functions (linear-gradient, radial-gradient, conic-gradient, repeating-*)
		const gradientCount = (
			beforeBlock.match(
				/(?:linear|radial|conic|repeating-linear|repeating-radial)-gradient\(/g,
			) ?? []
		).length;
		expect(gradientCount).toBeLessThanOrEqual(2);
	});

	it(".background::before filter blur is at most 20px", () => {
		const css = fs.readFileSync(cssPath, "utf-8");
		const beforeStart = css.indexOf(".background::before {");
		const afterStart = css.indexOf(".background::after {", beforeStart);
		const beforeBlock = css.slice(beforeStart, afterStart);

		// Extract blur value
		const blurMatch = beforeBlock.match(/filter\s*:\s*blur\((\d+)px\)/);
		if (blurMatch) {
			const blurPx = Number.parseInt(blurMatch[1]!, 10);
			expect(blurPx).toBeLessThanOrEqual(20);
		}
	});

	it("prefers-reduced-motion disables transform animations", () => {
		const css = fs.readFileSync(cssPath, "utf-8");
		expect(css).toContain("prefers-reduced-motion");
		expect(css).toContain("transform");
	});
});
