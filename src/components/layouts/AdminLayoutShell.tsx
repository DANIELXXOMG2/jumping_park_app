'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'

const AuthProvider = dynamic(
	() => import('@/contexts/AuthContext').then((mod) => mod.AuthProvider),
	{ ssr: false },
)

const swrConfig = {
	revalidateOnFocus: false,
	revalidateOnReconnect: true,
	dedupingInterval: 60000,
	focusThrottleInterval: 120000,
	errorRetryCount: 3,
	keepPreviousData: true,
}

interface AdminLayoutShellProps {
	children: ReactNode
}

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
	return (
		<SWRConfig value={swrConfig}>
			<AuthProvider>{children}</AuthProvider>
		</SWRConfig>
	)
}
