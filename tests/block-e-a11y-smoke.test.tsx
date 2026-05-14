import { describe, expect, it } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { Modal } from '@/components/ui/Modal'
import { getDialogFocusLoopTarget } from '@/lib/a11y/dialog'

const { default: ConsentimientoDigitalPage } = await import(
	'@/app/(public)/consentimiento-digital/page'
)

function collectCriticalA11ySmokeViolations(
	markup: string,
	options: { requireMainLandmark?: boolean; requirePrimaryHeading?: boolean } = {},
): string[] {
	const violations: string[] = []
	const requireMainLandmark = options.requireMainLandmark ?? true
	const requirePrimaryHeading = options.requirePrimaryHeading ?? true

	if (requireMainLandmark && !markup.includes('<main')) {
		violations.push('missing-main-landmark')
	}

	if (requirePrimaryHeading && !markup.includes('<h1')) {
		violations.push('missing-primary-heading')
	}

	if (markup.includes('role="dialog"')) {
		if (!markup.includes('aria-modal="true"')) {
			violations.push('dialog-missing-aria-modal')
		}

		if (!(markup.includes('aria-labelledby=') || markup.includes('aria-label='))) {
			violations.push('dialog-missing-accessible-name')
		}
	}

	return violations
}

describe('block e accessibility smoke coverage', () => {
	it('keeps the public consentimiento digital page free of critical smoke violations', () => {
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)

		expect(markup).toContain('<main')
		expect(markup).toContain('<h1')
		expect(markup).toContain('Resumen operativo publico')
		expect(collectCriticalA11ySmokeViolations(markup)).toEqual([])
	})

	it('covers the kiosk consent dialog surface with landmarks and dialog semantics', () => {
		const markup = renderToStaticMarkup(
			<Modal
				variant="fullscreen"
				isOpen
				onClose={() => undefined}
				title="Lee el consentimiento"
				footerAction={<button type="button">Cerrar lectura</button>}
			>
				<p>Contenido del consentimiento</p>
			</Modal>,
		)

		expect(markup).toContain('role="dialog"')
		expect(markup).toContain('aria-modal="true"')
		expect(markup).toContain('aria-labelledby=')
		expect(markup).toContain('role="document"')
		expect(markup).toContain('Cerrar lectura')
		expect(
			collectCriticalA11ySmokeViolations(markup, {
				requireMainLandmark: false,
				requirePrimaryHeading: false,
			}),
		).toEqual([])
	})

	it('covers the keyboard focus-loop baseline used by kiosk dialogs', () => {
		const firstElement = { id: 'first' } as HTMLElement
		const lastElement = { id: 'last' } as HTMLElement

		expect(
			getDialogFocusLoopTarget({
				activeElement: lastElement,
				firstElement,
				lastElement,
				shiftKey: false,
			}),
		).toBe(firstElement)
		expect(
			getDialogFocusLoopTarget({
				activeElement: firstElement,
				firstElement,
				lastElement,
				shiftKey: true,
			}),
		).toBe(lastElement)
		expect(
			getDialogFocusLoopTarget({
				activeElement: null,
				firstElement,
				lastElement,
				shiftKey: false,
			}),
		).toBe(firstElement)
		expect(
			getDialogFocusLoopTarget({
				activeElement: null,
				firstElement,
				lastElement,
				shiftKey: true,
			}),
		).toBe(lastElement)
	})
})
