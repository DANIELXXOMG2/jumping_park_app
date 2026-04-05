import type { Metadata } from 'next'
import { INDEXABLE_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
	robots: INDEXABLE_ROBOTS,
}

export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return children
}
