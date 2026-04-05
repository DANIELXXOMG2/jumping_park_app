import type { Metadata } from 'next'
import { AdminLayoutShell } from '@/components/layouts/AdminLayoutShell'
import { NON_INDEXABLE_ROBOTS } from '@/lib/seo'

export const metadata: Metadata = {
	robots: NON_INDEXABLE_ROBOTS,
}

export default function AdminLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <AdminLayoutShell>{children}</AdminLayoutShell>
}
