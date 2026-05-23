import type { Metadata } from 'next'
import { APP_NAME, buildPageFreshnessMetadata, createCanonicalUrl } from '@/lib/seo'

export const CONSENTIMIENTO_DIGITAL_PAGE_PATH = '/consentimiento-digital'
export const CONSENTIMIENTO_DIGITAL_PAGE_TITLE =
	'Consentimiento digital para visitantes'
export const CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION =
	'Conoce como funciona el consentimiento digital de Jumping Park antes de llegar al parque: registro agil, validacion por OTP y firma segura para adultos y menores.'
export const CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_PATH = '/opengraph-image'
export const CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL = createCanonicalUrl(
	CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_PATH,
)
export const CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_ALT =
	`${APP_NAME} | Consentimiento digital premium`

export function buildConsentimientoDigitalMetadata(): Metadata {
	return {
		title: CONSENTIMIENTO_DIGITAL_PAGE_TITLE,
		description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
		alternates: {
			canonical: CONSENTIMIENTO_DIGITAL_PAGE_PATH,
		},
		openGraph: {
			title: `${CONSENTIMIENTO_DIGITAL_PAGE_TITLE} | ${APP_NAME}`,
			description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
			url: createCanonicalUrl(CONSENTIMIENTO_DIGITAL_PAGE_PATH),
			type: 'article',
			...buildPageFreshnessMetadata(),
			images: [
				{
					url: CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL,
					width: 1200,
					height: 630,
					alt: CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_ALT,
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: `${CONSENTIMIENTO_DIGITAL_PAGE_TITLE} | ${APP_NAME}`,
			description: CONSENTIMIENTO_DIGITAL_PAGE_DESCRIPTION,
			images: [CONSENTIMIENTO_DIGITAL_OPEN_GRAPH_IMAGE_URL],
		},
	}
}
