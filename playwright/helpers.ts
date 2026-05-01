import { expect, type Page } from '@playwright/test'

export async function expectNoAxeViolations(violations: { id: string }[]) {
	expect(violations.map((violation) => violation.id)).toEqual([])
}

export async function seedAuthenticatedKioskSession(page: Page) {
	await page.addInitScript(() => {
		window.localStorage.setItem(
			'kiosk_session',
			JSON.stringify({
				uid: '1032456789',
				visitorData: {
					uid: '1032456789',
					fullName: 'Ada Lovelace',
					email: 'ada@jumpingpark.test',
					phone: '3000000000',
				},
				consent: {
					acceptedPolicy: false,
				},
				step: 3,
				isAuthenticated: true,
				expiresAt: Date.now() + 15 * 60 * 1000,
			}),
		)
	})
}

export async function readViewportOverflow(page: Page) {
	return page.evaluate(() => ({
		innerWidth: window.innerWidth,
		scrollWidth: document.documentElement.scrollWidth,
		bodyScrollWidth: document.body.scrollWidth,
	}))
}

export async function collectHydrationSignals(page: Page) {
	const consoleSignals: string[] = []
	const pageErrors: string[] = []

	page.on('console', (message) => {
		if (message.type() !== 'error' && message.type() !== 'warning') {
			return
		}

		const text = message.text()
		if (/hydration|didn't match the client/i.test(text)) {
			consoleSignals.push(text)
		}
	})

	page.on('pageerror', (error) => {
		if (/hydration|didn't match the client/i.test(error.message)) {
			pageErrors.push(error.message)
		}
	})

	return {
		read: () => [...consoleSignals, ...pageErrors],
	}
}
