import type { MetadataRoute } from 'next'
import { APP_URL, PUBLIC_PATHS } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
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
