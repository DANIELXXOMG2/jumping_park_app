import type { Metadata } from 'next'
import { buildPublicRobotsMetadata } from '@/lib/seo'

export function generateMetadata(): Metadata {
	return {
		robots: buildPublicRobotsMetadata(),
	}
}

export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return children
}
