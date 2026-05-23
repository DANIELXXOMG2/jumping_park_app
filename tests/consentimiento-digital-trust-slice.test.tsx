import { describe, expect, it } from 'bun:test'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { default: ConsentimientoDigitalPage } = await import(
	'@/app/(public)/consentimiento-digital/page'
)
const { CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES } = await import('@/lib/seo')

interface TreeNodeLike {
	props?: {
		children?: ReactNode
		id?: string
	}
}

function findElementIds(node: ReactNode, ids: string[] = []): string[] {
	if (!node) {
		return ids
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			findElementIds(child, ids)
		}

		return ids
	}

	if (typeof node !== 'object') {
		return ids
	}

	const treeNode = node as TreeNodeLike

	if (treeNode.props?.id) {
		ids.push(treeNode.props.id)
	}

	findElementIds(treeNode.props?.children, ids)

	return ids
}

describe('consentimiento digital trust slice', () => {
	it('renders the trust narrative, faq content, and CTA in SSR markup', () => {
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)

		expect(markup).toContain('Lo que cambia para tu visita y para la operacion.')
		expect(markup).toContain('Preguntas frecuentes antes de tu visita')
		expect(markup).toContain('Si queres llegar con el consentimiento resuelto, este es el momento.')
		expect(markup).toContain('Resolver dudas primero')
	})

	it('keeps the FAQ entries visible in markup and faq json-ld output', () => {
		const pageTree = ConsentimientoDigitalPage()
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)
		const firstEntry = CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES[0]
		const lastEntry = CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.at(-1)
		const elementIds = findElementIds(pageTree)

		expect(firstEntry).toBeDefined()
		expect(lastEntry).toBeDefined()
		expect(elementIds).toContain('faqpage-jsonld')
		expect(markup).toContain(firstEntry?.question ?? '')
		expect(markup).toContain(firstEntry?.answer ?? '')
		expect(markup).toContain(lastEntry?.question ?? '')
		expect(markup).toContain(lastEntry?.answer ?? '')
	})
})
