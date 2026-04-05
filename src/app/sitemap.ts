import type { MetadataRoute } from 'next'
import { createCanonicalUrl, PUBLIC_PATHS } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date()

	return PUBLIC_PATHS.map((pathname) => ({
		url: createCanonicalUrl(pathname),
		lastModified: now,
		changeFrequency: 'monthly',
		priority: 0.7,
	}))
}
