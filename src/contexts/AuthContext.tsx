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
	useContext,
	useEffect,
	useState,
} from "react";
import { auth } from "@/lib/firebaseClient";
import type { UserRole, CustomClaims, Permission } from "@/types/auth";
import { canAccessAdmin, getRoleFromClaims, hasPermission, ROLE_PERMISSIONS } from "@/types/auth";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAdmin: boolean;
	role: UserRole | null;
	/** Verifica si el usuario tiene un permiso específico */
	checkPermission: (permission: Permission) => boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
	getIdToken: () => Promise<string | null>;
	/** Fuerza la recarga del token para obtener nuevos claims */
	refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Obtiene el rol del usuario desde los Custom Claims del token JWT.
 * Esta es la fuente de verdad para los roles - NO Firestore.
 */
async function fetchRoleFromClaims(user: User): Promise<UserRole | null> {
	try {
		// Forzar refresh del token para obtener claims actualizados
		const tokenResult = await user.getIdTokenResult(true);
		const claims = tokenResult.claims as CustomClaims;
		return getRoleFromClaims(claims);
	} catch (error) {
		console.error("Error fetching role from claims:", error);
		return null;
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [role, setRole] = useState<UserRole | null>(null);

	// isAdmin ahora se deriva del rol
	const isAdmin = role !== null && canAccessAdmin(role);

	// Función para verificar permisos
	const checkPermission = (permission: Permission): boolean => {
		if (!role) return false;
		return hasPermission(role, permission);
	};

	// Función para refrescar el token y obtener nuevos claims
	const refreshToken = async () => {
		if (user) {
			const newRole = await fetchRoleFromClaims(user);
			setRole(newRole);
		}
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			setUser(firebaseUser);

			if (firebaseUser) {
				// Obtener rol desde Custom Claims (fuente de verdad)
				const userRole = await fetchRoleFromClaims(firebaseUser);
				setRole(userRole);
			} else {
				setRole(null);
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

		// Obtener rol desde Custom Claims
		const userRole = await fetchRoleFromClaims(userCredential.user);

		if (!userRole || !canAccessAdmin(userRole)) {
			await firebaseSignOut(auth);
			throw new Error("No tienes permisos para acceder al panel de administración");
		}

		setRole(userRole);
	};

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		const userCredential = await signInWithPopup(auth, provider);

		// Obtener rol desde Custom Claims
		const userRole = await fetchRoleFromClaims(userCredential.user);

		if (!userRole || !canAccessAdmin(userRole)) {
			await firebaseSignOut(auth);
			throw new Error("No tienes permisos para acceder al panel de administración");
		}

		setRole(userRole);
	};

	const signOut = async () => {
		await firebaseSignOut(auth);
		setRole(null);
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
				checkPermission,
				signIn,
				signInWithGoogle,
				signOut,
				getIdToken,
				refreshToken,
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
