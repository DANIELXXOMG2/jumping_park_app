"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebaseClient";
import type { UserRole } from "@/types/auth";
import { canAccessAdmin } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Obtiene el rol del usuario desde la colección admin_users en Firestore.
 * Esta colección es separada de 'users' (visitantes del kiosco).
 */
async function fetchUserRole(uid: string): Promise<UserRole | null> {
  try {
    const adminUserRef = doc(firestore, "admin_users", uid);
    const adminUserSnap = await getDoc(adminUserRef);
    
    if (adminUserSnap.exists()) {
      const data = adminUserSnap.data();
      return (data.role as UserRole) || null;
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

  // isAdmin ahora se deriva del rol
  const isAdmin = role !== null && canAccessAdmin(role);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Primero verificar custom claims (legacy)
        const tokenResult = await firebaseUser.getIdTokenResult();
        if (tokenResult.claims.admin === true) {
          setRole('admin');
        } else {
          // Buscar rol en Firestore
          const userRole = await fetchUserRole(firebaseUser.uid);
          setRole(userRole);
        }
      } else {
        setRole(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verificar rol después del login
    const userRole = await fetchUserRole(userCredential.user.uid);
    const tokenResult = await userCredential.user.getIdTokenResult();
    
    const hasAccess = tokenResult.claims.admin === true || 
                      (userRole && canAccessAdmin(userRole));
    
    if (!hasAccess) {
      await firebaseSignOut(auth);
      throw new Error("No tienes permisos de administrador");
    }
    
    setRole(userRole || (tokenResult.claims.admin === true ? 'admin' : null));
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Verificar rol después del login
    const userRole = await fetchUserRole(userCredential.user.uid);
    const tokenResult = await userCredential.user.getIdTokenResult();
    
    const hasAccess = tokenResult.claims.admin === true || 
                      (userRole && canAccessAdmin(userRole));
    
    if (!hasAccess) {
      await firebaseSignOut(auth);
      throw new Error("No tienes permisos de administrador");
    }
    
    setRole(userRole || (tokenResult.claims.admin === true ? 'admin' : null));
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
