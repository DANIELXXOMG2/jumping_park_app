import type { Metadata, MetadataRoute } from 'next'
import { evaluateHardeningFlag, HARDENING_FLAG } from '@/lib/hardeningPolicy'

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

export function buildPublicRobotsMetadata(): NonNullable<Metadata['robots']> {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: 'public-metadata',
		route: '/(public)',
	})

	return policy.enabled ? INDEXABLE_ROBOTS : NON_INDEXABLE_ROBOTS
}

export function buildPublicRobotsManifest(): MetadataRoute.Robots {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: 'robots',
		route: '/robots.txt',
	})

	if (!policy.enabled) {
		return {
			rules: {
				userAgent: '*',
				disallow: ['/'],
			},
			host: APP_URL,
		}
	}

	return {
		rules: {
			userAgent: '*',
			allow: [...PUBLIC_PATHS],
			disallow: [
				'/admin/',
				'/ingreso/',
				'/otp/',
				'/registro/',
				'/consentimiento/',
				'/exito/',
			],
		},
		sitemap: `${APP_URL}/sitemap.xml`,
		host: APP_URL,
	}
}

export function buildPublicSitemap(): MetadataRoute.Sitemap {
	const policy = evaluateHardeningFlag({
		featureName: HARDENING_FLAG.PUBLIC_SEO,
		source: 'sitemap',
		route: '/sitemap.xml',
	})

	if (!policy.enabled) {
		return []
	}

	const now = new Date()

	return PUBLIC_PATHS.map((pathname) => ({
		url: createCanonicalUrl(pathname),
		lastModified: now,
		changeFrequency: 'monthly',
		priority: 0.7,
	}))
}
