import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import {
	collectHydrationSignals,
	expectNoAxeViolations,
	readViewportOverflow,
	seedAuthenticatedKioskSession,
} from './helpers'

test.describe('Accessibility evidence', () => {
	test('public consentimiento digital passes Axe and reflows at 200 percent equivalent width', async ({
		page,
	}) => {
		await page.setViewportSize({ width: 640, height: 900 })
		await page.goto('/consentimiento-digital')

		await expect(
			page.getByRole('heading', {
				level: 1,
				name: /consentimiento digital rapido, claro y listo antes de saltar/i,
			}),
		).toBeVisible()

		const axe = await new AxeBuilder({ page }).analyze()
		await expectNoAxeViolations(axe.violations)

		const overflow = await readViewportOverflow(page)
		expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1)
		expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1)
	})

	test('kiosk consent dialog supports keyboard flow and passes Axe', async ({ page }) => {
		const hydrationSignals = await collectHydrationSignals(page)
		await seedAuthenticatedKioskSession(page)
		await page.goto('/consentimiento')
		await expect(page.getByText('Ada Lovelace')).toBeVisible()

		const openDialogButton = page.getByRole('button', {
			name: /full screen|pantalla completa/i,
		})
		await expect(openDialogButton).toBeVisible()
		await openDialogButton.click()

		const dialog = page.getByRole('dialog', {
			name: /full consent|consentimiento completo/i,
		})
		await expect(dialog).toBeVisible()

		const closeButton = dialog.getByRole('button', {
			name: /^close$|^cerrar$/i,
		})
		await expect(closeButton).toBeFocused()

		await page.keyboard.press('Tab')
		expect(
			await dialog.evaluate((node) => node.contains(document.activeElement)),
		).toBe(true)
		await page.keyboard.press('Shift+Tab')
		await expect(closeButton).toBeFocused()

		const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze()
		await expectNoAxeViolations(axe.violations)
		expect(hydrationSignals.read()).toEqual([])

		await page.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
		await expect(openDialogButton).toBeVisible()
	})

	test('kiosk ingreso loads without hydration warnings', async ({ page }) => {
		const hydrationSignals = await collectHydrationSignals(page)
		await page.goto('/ingreso')

		await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
		await expect(
			page.getByRole('textbox', { name: /documento|cédula|cedula|document/i }),
		).toBeVisible()
		expect(hydrationSignals.read()).toEqual([])
	})
})
