'use client'

import { Lock, ShieldAlert } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { canAccessAdmin, canAccessRoute } from '@/types/auth'

function UnauthorizedView() {
	const router = useRouter()

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-md">
				<div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<ShieldAlert className="w-8 h-8 text-destructive" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						Acceso denegado
					</h1>
					<p className="text-foreground/60">
						No tenes permisos para acceder a esta seccion.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push('/admin/login')}
					className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
				>
					Volver al login
				</button>
			</div>
		</div>
	)
}

function RestrictedRouteView() {
	const router = useRouter()

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-4">
			<div className="flex flex-col items-center gap-6 text-center max-w-md">
				<div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
					<Lock className="w-8 h-8 text-yellow-600" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						Seccion restringida
					</h1>
					<p className="text-foreground/60">
						Tu rol no tiene acceso a esta seccion.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push('/admin')}
					className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
				>
					Ir al dashboard
				</button>
			</div>
		</div>
	)
}

interface AdminGuardProps {
	children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
	const {
		isLoading,
		role,
		session,
		user,
		isSessionExpired,
		refreshSessionStatus,
	} = useAuth()
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		if (!user || !pathname) {
			return
		}

		void refreshSessionStatus()
	}, [pathname, refreshSessionStatus, user])

	useEffect(() => {
		const onFocus = () => {
			if (user) {
				void refreshSessionStatus()
			}
		}

		window.addEventListener('focus', onFocus)
		return () => window.removeEventListener('focus', onFocus)
	}, [refreshSessionStatus, user])

	useEffect(() => {
		if (isLoading) {
			return
		}

		if (!user || isSessionExpired || !session) {
			router.replace('/admin/login?reason=session-expired')
		}
	}, [isLoading, isSessionExpired, router, session, user])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-foreground/60">Verificando acceso...</p>
				</div>
			</div>
		)
	}

	if (!user || !session) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-foreground/60">Redirigiendo...</p>
				</div>
			</div>
		)
	}

	const hasAdminAccess = role && canAccessAdmin(role)

	if (!hasAdminAccess) {
		return <UnauthorizedView />
	}

	const canAccessCurrentRoute = canAccessRoute(role, pathname)

	if (!canAccessCurrentRoute) {
		return <RestrictedRouteView />
	}

	return <>{children}</>
}
