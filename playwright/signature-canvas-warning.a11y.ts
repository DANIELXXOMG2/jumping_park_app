import { expect, test } from '@playwright/test'
import { seedAuthenticatedKioskSession } from './helpers'

test.describe('Signature canvas willReadFrequently fix', () => {
	test('submits a drawn kiosk signature without the Canvas2D warning', async ({
		page,
	}) => {
		test.setTimeout(120_000)

		const willReadFrequentlyWarnings: string[] = []
		let submittedPayload: Record<string, unknown> | null = null

		page.on('console', (message) => {
			const text = message.text()
			if (
				/willReadFrequently|Multiple readback operations using getImageData/i.test(
					text,
				)
			) {
				willReadFrequentlyWarnings.push(text)
			}
		})

		await page.route('**/api/consentimientos', async (route) => {
			submittedPayload = route.request().postDataJSON() as Record<string, unknown>

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ consecutivo: 'SIG-001' }),
			})
		})

		await seedAuthenticatedKioskSession(page)
		await page.goto('/consentimiento')
		await expect(page.getByText('Ada Lovelace')).toBeVisible()

		await page.locator('#inlineFirstName').fill('Luna')
		await page.locator('#inlineLastName').fill('Lopez')
		await page.locator('#inlineBirthDate').fill('2018-05-12')
		await page.locator('#inlineEps').fill('Sura')
		await page.locator('#inlineIdNumber').fill('RC12345')
		await page.getByRole('button', { name: /save/i }).click()

		const canvas = page.locator('canvas.cursor-crosshair').first()
		await expect(canvas).toBeVisible()

		await canvas.evaluate((element) => {
			const signatureCanvas = element as HTMLCanvasElement
			const rect = signatureCanvas.getBoundingClientRect()
			const points = [
				{ x: 24, y: rect.height / 2 },
				{ x: rect.width / 2, y: 28 },
				{ x: rect.width - 24, y: rect.height - 28 },
			]

			const createMouseEvent = (
				type: 'mousedown' | 'mousemove' | 'mouseup',
				x: number,
				y: number,
				buttons: number,
			) =>
				new MouseEvent(type, {
					bubbles: true,
					cancelable: true,
					composed: true,
					button: 0,
					buttons,
					clientX: rect.left + x,
					clientY: rect.top + y,
				})

			signatureCanvas.dispatchEvent(
				createMouseEvent('mousedown', points[0].x, points[0].y, 1),
			)

			for (const point of points.slice(1)) {
				signatureCanvas.dispatchEvent(
					createMouseEvent('mousemove', point.x, point.y, 1),
				)
			}

			document.dispatchEvent(
				createMouseEvent(
					'mouseup',
					points[points.length - 1].x,
					points[points.length - 1].y,
					0,
				),
			)
		})
		await page.waitForTimeout(100)
		expect(willReadFrequentlyWarnings).toEqual([])

		await page.locator('#acceptedPolicy').check()

		await Promise.all([
			page.waitForRequest('**/api/consentimientos'),
			page.waitForURL(/\/exito\?/),
			page.locator('button[type="submit"]').click(),
		])

		await page.waitForTimeout(250)

		expect(willReadFrequentlyWarnings).toEqual([])
		if (!submittedPayload) {
			throw new Error('Consent submission payload was not captured')
		}

		const signatureBase64 = submittedPayload!['signature']
		expect(typeof signatureBase64).toBe('string')
		expect(signatureBase64 as string).toContain('data:image/png;base64,')
	})
})
