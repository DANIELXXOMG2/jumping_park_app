"use client";

import {
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { auth, firestore } from "@/lib/firebaseClient";
import type { Permission, UserRole } from "@/types/auth";
import {
	canAccessAdmin,
	getEffectivePermissions,
	hasPermission as checkPermission,
} from "@/types/auth";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAdmin: boolean;
	role: UserRole | null;
	/** Permisos efectivos del usuario (rol + customPermissions) */
	permissions: Permission[];
	/** Verifica si el usuario tiene un permiso específico */
	hasPermission: (permission: Permission | string) => boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
	getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Email del Super Admin que siempre tiene todos los permisos.
 */
export const SUPER_ADMIN_EMAIL = "jumpingadmin@gmail.com";

/**
 * Verifica si un email corresponde al Super Admin.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

interface AdminUserData {
	role?: UserRole;
	customPermissions?: string[];
}

/**
 * Obtiene el rol y permisos personalizados del usuario desde admin_users.
 */
async function fetchUserRoleAndPermissions(
	uid: string
): Promise<AdminUserData | null> {
	try {
		const adminUserRef = doc(firestore, "admin_users", uid);
		const adminUserSnap = await getDoc(adminUserRef);

		if (adminUserSnap.exists()) {
			const data = adminUserSnap.data();
			return {
				role: data.role as UserRole | undefined,
				customPermissions: (data.customPermissions || []) as string[],
			};
		}

		return null;
	} catch (error) {
		console.error("Error fetching user role:", error);
		return null;
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole | null>(null);
	const [customPermissions, setCustomPermissions] = useState<string[]>([]);

	// isAdmin ahora se deriva del rol
	const isAdmin = role !== null && canAccessAdmin(role);

	// Calcular permisos efectivos (rol + customPermissions)
	const permissions: Permission[] = role
		? getEffectivePermissions(role, customPermissions)
		: [];

	// Función memoizada para verificar permisos
	const hasPermission = useCallback(
		(permission: Permission | string): boolean => {
			// Super Admin siempre tiene todos los permisos
			if (user?.email && isSuperAdmin(user.email)) {
				return true;
			}

			if (!role) return false;
			return checkPermission(role, permission, customPermissions);
		},
		[role, customPermissions, user?.email]
	);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);

			if (firebaseUser) {
				// Primero verificar custom claims (legacy)
				const tokenResult = await firebaseUser.getIdTokenResult();
				if (tokenResult.claims.admin === true) {
					setRole("admin");
					setCustomPermissions([]);
				} else {
					// Buscar rol y permisos en Firestore
					const userData = await fetchUserRoleAndPermissions(firebaseUser.uid);
					setRole(userData?.role || null);
					setCustomPermissions(userData?.customPermissions || []);
				}
			} else {
				setRole(null);
				setCustomPermissions([]);
			}

			setIsLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const signIn = async (email: string, password: string) => {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password,
		);

		// Verificar rol después del login
		const userData = await fetchUserRoleAndPermissions(userCredential.user.uid);
		const tokenResult = await userCredential.user.getIdTokenResult();

		const hasAccess =
			tokenResult.claims.admin === true ||
			(userData?.role && canAccessAdmin(userData.role));

		if (!hasAccess) {
			await firebaseSignOut(auth);
			throw new Error("No tienes permisos de administrador");
		}

		setRole(userData?.role || (tokenResult.claims.admin === true ? "admin" : null));
		setCustomPermissions(userData?.customPermissions || []);
	};

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		const userCredential = await signInWithPopup(auth, provider);

		// Verificar rol después del login
		const userData = await fetchUserRoleAndPermissions(userCredential.user.uid);
		const tokenResult = await userCredential.user.getIdTokenResult();

		const hasAccess =
			tokenResult.claims.admin === true ||
			(userData?.role && canAccessAdmin(userData.role));

		if (!hasAccess) {
			await firebaseSignOut(auth);
			throw new Error("No tienes permisos de administrador");
		}

		setRole(userData?.role || (tokenResult.claims.admin === true ? "admin" : null));
		setCustomPermissions(userData?.customPermissions || []);
	};

	const signOut = async () => {
		await firebaseSignOut(auth);
		setRole(null);
		setCustomPermissions([]);
	};

	const getIdToken = async (): Promise<string | null> => {
		if (!user) return null;
		return user.getIdToken();
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAdmin,
				role,
				permissions,
				hasPermission,
				signIn,
				signInWithGoogle,
				signOut,
				getIdToken,
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
