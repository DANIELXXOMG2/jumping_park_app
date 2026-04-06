import type { MetadataRoute } from 'next'
import { buildPublicRobotsManifest } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
	return buildPublicRobotsManifest()
}
