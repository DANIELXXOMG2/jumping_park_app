'use client'

import {
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	type User,
} from 'firebase/auth'
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'
import { auth } from '@/lib/firebaseClient'
import type { CustomClaims, Permission, UserRole } from '@/types/auth'
import { canAccessAdmin, getRoleFromClaims, hasPermission } from '@/types/auth'

interface AdminSessionState {
	role: UserRole
	expiresAt: string
}

interface AuthContextType {
	user: User | null
	isLoading: boolean
	isAdmin: boolean
	role: UserRole | null
	session: AdminSessionState | null
	isSessionExpired: boolean
	checkPermission: (permission: Permission) => boolean
	signIn: (email: string, password: string) => Promise<void>
	signInWithGoogle: () => Promise<void>
	signOut: () => Promise<void>
	getIdToken: () => Promise<string | null>
	refreshToken: () => Promise<void>
	refreshSessionStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface PerformClientSignOutOptions {
	preserveExpiration?: boolean
}

async function fetchRoleFromClaims(user: User): Promise<UserRole | null> {
	try {
		const tokenResult = await user.getIdTokenResult(true)
		const claims = tokenResult.claims as CustomClaims
		return getRoleFromClaims(claims)
	} catch {
		return null
	}
}

async function exchangeAdminSession(user: User): Promise<AdminSessionState> {
	const idToken = await user.getIdToken(true)
	const response = await fetch('/api/admin/session', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({ idToken }),
	})

	const data = (await response.json().catch(() => null)) as {
		error?: string
		session?: AdminSessionState
	} | null

	if (!response.ok || !data?.session) {
		throw new Error(
			data?.error ?? 'No se pudo iniciar la sesion de administrador',
		)
	}

	return data.session
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [role, setRole] = useState<UserRole | null>(null)
	const [session, setSession] = useState<AdminSessionState | null>(null)
	const [isSessionExpired, setIsSessionExpired] = useState(false)

	const isAdmin = role !== null && canAccessAdmin(role) && session !== null

	const checkPermission = (permission: Permission): boolean => {
		if (!role || !session) {
			return false
		}

		return hasPermission(role, permission)
	}

	const clearSessionState = useCallback((preserveExpiration = false) => {
		setSession(null)
		setIsSessionExpired(preserveExpiration)
	}, [])

	const performClientSignOut = useCallback(
		async (options?: PerformClientSignOutOptions) => {
			try {
				await fetch('/api/admin/session', {
					method: 'DELETE',
					credentials: 'include',
				})
			} catch {
				// Nada: queremos continuar con el sign out local.
			}

			await firebaseSignOut(auth)
			setRole(null)
			clearSessionState(options?.preserveExpiration)
		},
		[clearSessionState],
	)

	const refreshToken = async () => {
		if (!user) {
			setRole(null)
			return
		}

		const newRole = await fetchRoleFromClaims(user)
		setRole(newRole)
	}

	const refreshSessionStatus = useCallback(async (): Promise<boolean> => {
		if (!user) {
			clearSessionState()
			return false
		}

		try {
			const response = await fetch('/api/admin/session', {
				method: 'GET',
				credentials: 'include',
				cache: 'no-store',
			})

			const data = (await response.json().catch(() => null)) as {
				error?: string
				session?: AdminSessionState
			} | null

			if (!response.ok || !data?.session) {
				setSession(null)
				setIsSessionExpired(true)
				await performClientSignOut({ preserveExpiration: true })
				return false
			}

			setSession(data.session)
			setIsSessionExpired(false)
			return true
		} catch {
			return session !== null
		}
	}, [clearSessionState, performClientSignOut, session, user])

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser)

			if (!firebaseUser) {
				setRole(null)
				clearSessionState()
				setIsLoading(false)
				return
			}

			const userRole = await fetchRoleFromClaims(firebaseUser)

			if (!userRole || !canAccessAdmin(userRole)) {
				await performClientSignOut()
				setIsLoading(false)
				return
			}

			setRole(userRole)
			await refreshSessionStatus()
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [clearSessionState, performClientSignOut, refreshSessionStatus])

	const signIn = async (email: string, password: string) => {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password,
		)
		const userRole = await fetchRoleFromClaims(userCredential.user)

		if (!userRole || !canAccessAdmin(userRole)) {
			await performClientSignOut()
			throw new Error('No tienes permisos de administrador')
		}

		let nextSession: AdminSessionState

		try {
			nextSession = await exchangeAdminSession(userCredential.user)
		} catch (error) {
			await performClientSignOut()
			throw error
		}

		setRole(userRole)
		setSession(nextSession)
		setIsSessionExpired(false)
	}

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider()
		const userCredential = await signInWithPopup(auth, provider)
		const userRole = await fetchRoleFromClaims(userCredential.user)

		if (!userRole || !canAccessAdmin(userRole)) {
			await performClientSignOut()
			throw new Error('No tienes permisos de administrador')
		}

		let nextSession: AdminSessionState

		try {
			nextSession = await exchangeAdminSession(userCredential.user)
		} catch (error) {
			await performClientSignOut()
			throw error
		}

		setRole(userRole)
		setSession(nextSession)
		setIsSessionExpired(false)
	}

	const signOut = async () => {
		await performClientSignOut()
	}

	const getIdToken = async (): Promise<string | null> => {
		if (!user) {
			return null
		}

		return user.getIdToken()
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAdmin,
				role,
				session,
				isSessionExpired,
				checkPermission,
				signIn,
				signInWithGoogle,
				signOut,
				getIdToken,
				refreshToken,
				refreshSessionStatus,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuth debe usarse dentro de un AuthProvider')
	}

	return context
}
