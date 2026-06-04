import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Portfolio Homepage Optimization — E2E", () => {
	test("StartActionButton navigates to /ingreso on click", async ({ page }) => {
		await page.goto("/");

		const startLink = page.locator('a[href="/ingreso"]');
		await expect(startLink).toBeVisible();

		await startLink.click();

		const ingresoHeading = page.getByRole("heading", { name: /ingreso/i });
		await expect(ingresoHeading).toBeVisible({ timeout: 10000 });

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test("SpaceBackground canvas loads after hydration", async ({ page }) => {
		await page.goto("/");

		const canvas = page.locator("canvas");
		await expect(canvas).toBeAttached({ timeout: 15000 });

		const box = await canvas.boundingBox();
		expect(box).not.toBeNull();
		if (box) {
			expect(box.width).toBeGreaterThan(0);
			expect(box.height).toBeGreaterThan(0);
		}

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test("homepage passes Axe accessibility check", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("canvas")).toBeAttached({ timeout: 15000 });

		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});
});
