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
		type?: string
	}
}

interface JsonLdScript {
	children: string
	id: string
	type: 'application/ld+json'
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

function findJsonLdScripts(node: ReactNode, scripts: JsonLdScript[] = []): JsonLdScript[] {
	if (!node) {
		return scripts
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			findJsonLdScripts(child, scripts)
		}

		return scripts
	}

	if (typeof node !== 'object') {
		return scripts
	}

	const treeNode = node as TreeNodeLike
	const children = treeNode.props?.children

	if (
		treeNode.props?.id &&
		treeNode.props.type === 'application/ld+json' &&
		typeof children === 'string'
	) {
		scripts.push({
			children,
			id: treeNode.props.id,
			type: treeNode.props.type,
		})
	}

	findJsonLdScripts(children, scripts)

	return scripts
}

function isFaqPageSchema(value: unknown): value is {
	'@type': 'FAQPage'
	mainEntity: Array<{
		name: string
		acceptedAnswer: { text: string }
	}>
} {
	return (
		typeof value === 'object' &&
		value !== null &&
		'@type' in value &&
		value['@type'] === 'FAQPage' &&
		'mainEntity' in value &&
		Array.isArray(value.mainEntity)
	)
}

describe('consentimiento digital trust slice', () => {
	it('renders the trust narrative, faq content, and CTA in SSR markup', () => {
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)

		expect(markup).toContain(
			'Firma tu consentimiento',
		)
		expect(markup).toContain('Preguntas frecuentes')
		expect(markup).toContain(
			'Completar registro ahora',
		)
		expect(markup).toContain('No pierdas mas tiempo en filas')
	})

	it('keeps the FAQ entries visible in markup and faq json-ld output', () => {
		const pageTree = ConsentimientoDigitalPage()
		const markup = renderToStaticMarkup(<ConsentimientoDigitalPage />)
		const firstEntry = CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES[0]
		const lastEntry = CONSENTIMIENTO_DIGITAL_FAQ_ENTRIES.at(-1)
		const elementIds = findElementIds(pageTree)
		const faqScript = findJsonLdScripts(pageTree).find(
			(script) => script.id === 'faq-schema',
		)
		const faqJsonLd = faqScript ? JSON.parse(faqScript.children) : undefined

		expect(firstEntry).toBeDefined()
		expect(lastEntry).toBeDefined()
		expect(elementIds).toContain('faq-schema')
		expect(isFaqPageSchema(faqJsonLd)).toBe(true)

		if (!isFaqPageSchema(faqJsonLd)) {
			throw new Error('Expected FAQPage JSON-LD schema')
		}

		expect(faqJsonLd.mainEntity[0]?.name).toBe(firstEntry?.question)
		expect(faqJsonLd.mainEntity[0]?.acceptedAnswer.text).toBe(firstEntry?.answer)
		expect(markup).toContain(firstEntry?.question ?? '')
		expect(markup).toContain(firstEntry?.answer ?? '')
		expect(markup).toContain(lastEntry?.question ?? '')
		expect(markup).toContain(lastEntry?.answer ?? '')
	})
})
