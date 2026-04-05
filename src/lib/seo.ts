import type { Metadata } from 'next'

export const APP_NAME = 'Jumping Park'
export const APP_DESCRIPTION =
	'Sistema de registro y consentimiento informado para visitantes de Jumping Park. Firma digital segura y gestion de menores.'
export const APP_URL = 'https://www.jumpingpark.lat'

export const PUBLIC_PATHS = ['/consentimiento-digital'] as const

export const NON_INDEXABLE_ROBOTS: NonNullable<Metadata['robots']> = {
	index: false,
	follow: false,
	googleBot: {
		index: false,
		follow: false,
		'noimageindex': true,
		'notranslate': true,
	},
}

export const INDEXABLE_ROBOTS: NonNullable<Metadata['robots']> = {
	index: true,
	follow: true,
	googleBot: {
		index: true,
		follow: true,
		'max-image-preview': 'large',
		'max-snippet': -1,
		'max-video-preview': -1,
	},
}

export function createCanonicalUrl(pathname = '/'): string {
	return new URL(pathname, APP_URL).toString()
}
