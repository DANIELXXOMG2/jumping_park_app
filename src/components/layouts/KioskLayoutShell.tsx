'use client'

import { signOut } from 'firebase/auth'
import { Home, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { KioskSessionRestorer } from '@/components/kiosk/KioskSessionRestorer'
import { LanguageToggle } from '@/components/kiosk/LanguageToggle'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { auth } from '@/lib/firebaseClient'
import { useKioskStore } from '@/store/kioskStore'

interface KioskLayoutShellProps {
	children: ReactNode
}

function KioskLayoutContent({ children }: { children: ReactNode }) {
	const { t } = useLanguage()
	const router = useRouter()
	const clearSession = useKioskStore((state) => state.clearSession)

	const handleGoHome = async () => {
		clearSession()

		try {
			await signOut(auth)
		} catch (error) {
			console.debug('[KioskLayout] signOut ignored:', error)
		}

		router.push('/')
	}

	return (
		<div className="kiosk-bg min-h-screen text-white">
			<KioskSessionRestorer />

			<div className="fixed bottom-4 left-4 z-50">
				<LanguageToggle />
			</div>

			<div className="kiosk-content flex min-h-screen flex-col">
				<header className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
					<button
						type="button"
						onClick={handleGoHome}
						className="group relative flex items-center gap-2 overflow-hidden rounded-full border-2 border-white/20 bg-linear-to-r from-white/10 via-white/5 to-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_6px_25px_rgba(46,204,113,0.3)] active:scale-[0.98] dark:border-zinc-300/30 dark:from-white dark:via-zinc-50 dark:to-white dark:text-black"
						aria-label={t('layout.homeButton') || 'Volver al inicio'}
					>
						<span
							className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
							aria-hidden="true"
						/>

						<Home
							className="relative h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110 dark:text-black"
							strokeWidth={2.5}
						/>

						<span className="relative text-primary dark:text-black">Jumping</span>
						<span className="relative dark:text-black">{t('layout.brand')}</span>

						<Sparkles
							className="relative h-3 w-3 text-primary/60 transition-all duration-300 group-hover:rotate-12 group-hover:text-primary dark:text-black/60 dark:group-hover:text-black"
							strokeWidth={2}
						/>
					</button>
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-white/60">
							{t('layout.subtitle')}
						</span>
						<ThemeToggle />
					</div>
				</header>
				<main className="flex flex-1 flex-col px-4 sm:px-8">{children}</main>
			</div>
		</div>
	)
}

export function KioskLayoutShell({ children }: KioskLayoutShellProps) {
	return (
		<AuthProvider>
			<LanguageProvider>
				<KioskLayoutContent>{children}</KioskLayoutContent>
			</LanguageProvider>
		</AuthProvider>
	)
}
