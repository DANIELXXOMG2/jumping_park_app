"use client";

import {
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	type User,
} from "firebase/auth";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { auth } from "@/lib/firebaseClient";
import type { CustomClaims, Permission, UserRole } from "@/types/auth";
import { canAccessAdmin, getRoleFromClaims, hasPermission } from "@/types/auth";

interface AdminSessionState {
	role: UserRole;
	expiresAt: string;
}

interface RefreshSessionStatusOptions {
	force?: boolean;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAdmin: boolean;
	role: UserRole | null;
	session: AdminSessionState | null;
	isSessionExpired: boolean;
	checkPermission: (permission: Permission) => boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
	getIdToken: () => Promise<string | null>;
	refreshToken: () => Promise<void>;
	refreshSessionStatus: (
		options?: RefreshSessionStatusOptions,
	) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface PerformClientSignOutOptions {
	preserveExpiration?: boolean;
}

const SESSION_STATUS_MIN_INTERVAL_MS = 15_000;

async function fetchRoleFromClaims(user: User): Promise<UserRole | null> {
	try {
		const tokenResult = await user.getIdTokenResult(true);
		const claims = tokenResult.claims as CustomClaims;
		return getRoleFromClaims(claims);
	} catch {
		return null;
	}
}

async function exchangeAdminSession(user: User): Promise<AdminSessionState> {
	const idToken = await user.getIdToken(true);
	const response = await fetch("/api/admin/session", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify({ idToken }),
	});

	const data = (await response.json().catch(() => null)) as {
		error?: string;
		code?: string;
		session?: AdminSessionState;
	} | null;

	if (!response.ok || !data?.session) {
		const codeSuffix = data?.code ? ` [${data.code}]` : "";
		throw new Error(
			`${data?.error ?? "No se pudo iniciar la sesion de administrador"}${codeSuffix}`,
		);
	}

	return data.session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole | null>(null);
	const [session, setSession] = useState<AdminSessionState | null>(null);
	const [isSessionExpired, setIsSessionExpired] = useState(false);
	const isEstablishingSessionRef = useRef(false);
	const sessionRef = useRef<AdminSessionState | null>(null);
	const refreshSessionRequestRef = useRef<Promise<boolean> | null>(null);
	const signOutRequestRef = useRef<Promise<void> | null>(null);
	const lastSessionStatusCheckAtRef = useRef(0);

	const isAdmin = role !== null && canAccessAdmin(role) && session !== null;

	const checkPermission = (permission: Permission): boolean => {
		if (!role || !session) {
			return false;
		}

		return hasPermission(role, permission);
	};

	const clearSessionState = useCallback((preserveExpiration = false) => {
		sessionRef.current = null;
		setSession(null);
		setIsSessionExpired(preserveExpiration);
	}, []);

	const performClientSignOut = useCallback(
		async (options?: PerformClientSignOutOptions) => {
			if (signOutRequestRef.current) {
				return signOutRequestRef.current;
			}

			const signOutRequest = (async () => {
				try {
					await fetch("/api/admin/session", {
						method: "DELETE",
						credentials: "include",
					});
				} catch {
					// Nada: queremos continuar con el sign out local.
				}

				await firebaseSignOut(auth);
				setRole(null);
				clearSessionState(options?.preserveExpiration);
			})();

			signOutRequestRef.current = signOutRequest;

			try {
				await signOutRequest;
			} finally {
				signOutRequestRef.current = null;
			}
		},
		[clearSessionState],
	);

	useEffect(() => {
		sessionRef.current = session;
	}, [session]);

	const refreshToken = async () => {
		if (!user) {
			setRole(null);
			return;
		}

		const newRole = await fetchRoleFromClaims(user);
		setRole(newRole);
	};

	const refreshSessionStatus = useCallback(
		async (options?: RefreshSessionStatusOptions): Promise<boolean> => {
			const activeUser = auth.currentUser;
			if (!activeUser) {
				clearSessionState();
				return false;
			}

			if (signOutRequestRef.current) {
				await signOutRequestRef.current;
				return false;
			}

			if (refreshSessionRequestRef.current) {
				return refreshSessionRequestRef.current;
			}

			if (
				!options?.force &&
				sessionRef.current !== null &&
				Date.now() - lastSessionStatusCheckAtRef.current <
					SESSION_STATUS_MIN_INTERVAL_MS
			) {
				return true;
			}

			const refreshRequest = (async () => {
				try {
					const response = await fetch("/api/admin/session", {
						method: "GET",
						credentials: "include",
						cache: "no-store",
					});

					const data = (await response.json().catch(() => null)) as {
						error?: string;
						session?: AdminSessionState;
					} | null;

					if (!response.ok || !data?.session) {
						if (response.status === 401) {
							// Si el usuario Firebase sigue activo, intentamos re-establecer
							// la cookie de sesion admin (caso tipico: refresh y cookie ausente).
							try {
								const nextSession = await exchangeAdminSession(activeUser);
								lastSessionStatusCheckAtRef.current = Date.now();
								sessionRef.current = nextSession;
								setSession(nextSession);
								setIsSessionExpired(false);
								return true;
							} catch {
								await performClientSignOut({ preserveExpiration: true });
								return false;
							}
						}

						return sessionRef.current !== null;
					}

					lastSessionStatusCheckAtRef.current = Date.now();
					sessionRef.current = data.session;
					setSession(data.session);
					setIsSessionExpired(false);
					return true;
				} catch {
					return sessionRef.current !== null;
				} finally {
					refreshSessionRequestRef.current = null;
				}
			})();

			refreshSessionRequestRef.current = refreshRequest;
			return refreshRequest;
		},
		[clearSessionState, performClientSignOut, user],
	);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);

			if (!firebaseUser) {
				isEstablishingSessionRef.current = false;
				setRole(null);
				clearSessionState();
				setIsLoading(false);
				return;
			}

			const userRole = await fetchRoleFromClaims(firebaseUser);

			if (!userRole || !canAccessAdmin(userRole)) {
				isEstablishingSessionRef.current = false;
				await performClientSignOut();
				setIsLoading(false);
				return;
			}

			setRole(userRole);

			if (isEstablishingSessionRef.current) {
				setIsLoading(false);
				return;
			}

			await refreshSessionStatus();
			setIsLoading(false);
		});

		return () => unsubscribe();
	}, [clearSessionState, performClientSignOut, refreshSessionStatus]);

	const signIn = async (email: string, password: string) => {
		isEstablishingSessionRef.current = true;

		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password,
			);
			const userRole = await fetchRoleFromClaims(userCredential.user);

			if (!userRole || !canAccessAdmin(userRole)) {
				await performClientSignOut();
				throw new Error("No tienes permisos de administrador");
			}

			const nextSession = await exchangeAdminSession(userCredential.user);

			setRole(userRole);
			setSession(nextSession);
			setIsSessionExpired(false);
		} catch (error) {
			await performClientSignOut();
			throw error;
		} finally {
			isEstablishingSessionRef.current = false;
		}
	};

	const signInWithGoogle = async () => {
		isEstablishingSessionRef.current = true;

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const userRole = await fetchRoleFromClaims(userCredential.user);

			if (!userRole || !canAccessAdmin(userRole)) {
				await performClientSignOut();
				throw new Error("No tienes permisos de administrador");
			}

			const nextSession = await exchangeAdminSession(userCredential.user);

			setRole(userRole);
			setSession(nextSession);
			setIsSessionExpired(false);
		} catch (error) {
			await performClientSignOut();
			throw error;
		} finally {
			isEstablishingSessionRef.current = false;
		}
	};

	const signOut = async () => {
		await performClientSignOut();
	};

	const getIdToken = async (): Promise<string | null> => {
		if (!user) {
			return null;
		}

		return user.getIdToken();
	};

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
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider");
	}

	return context;
}
