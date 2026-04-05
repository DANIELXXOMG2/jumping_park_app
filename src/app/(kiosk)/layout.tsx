import type { Metadata } from 'next'
import { KioskLayoutShell } from '@/components/layouts/KioskLayoutShell'
import { NON_INDEXABLE_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
	robots: NON_INDEXABLE_ROBOTS,
}

export default function KioskLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <KioskLayoutShell>{children}</KioskLayoutShell>
}
