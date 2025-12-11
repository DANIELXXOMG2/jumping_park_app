"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { WifiOff } from "lucide-react";

// ============================================================================
// HOOK: useOnlineStatus
// ============================================================================

/**
 * Hook para detectar estado de conexión a internet.
 * Usa useSyncExternalStore para evitar hydration mismatch.
 */
function useOnlineStatus(): boolean {
  const getSnapshot = () => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  };

  const getServerSnapshot = () => true; // SSR siempre asume online

  const subscribe = (callback: () => void) => {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
      window.removeEventListener("online", callback);
      window.removeEventListener("offline", callback);
    };
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================================================
// COMPONENTE: OfflineBadge
// ============================================================================

function OfflineBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-yellow-500/90 text-yellow-950 px-3 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>Modo Offline</span>
    </div>
  );
}

// ============================================================================
// COMPONENTE: AdminGuard
// ============================================================================

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  
  // Estado para manejar claims cacheados en offline
  const [cachedIsAdmin, setCachedIsAdmin] = useState<boolean | null>(null);

  // Guardar estado de admin en memoria cuando está online
  useEffect(() => {
    if (isAdmin && isOnline) {
      setCachedIsAdmin(true);
      // También guardar en sessionStorage para persistencia durante la sesión
      try {
        sessionStorage.setItem("jp_admin_cached", "true");
      } catch {
        // sessionStorage no disponible
      }
    }
  }, [isAdmin, isOnline]);

  // Recuperar estado cacheado al montar
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("jp_admin_cached");
      if (cached === "true") {
        setCachedIsAdmin(true);
      }
    } catch {
      // sessionStorage no disponible
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Si no hay usuario, redirigir a login
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    // Si estamos offline y tenemos cache de admin, permitir acceso
    if (!isOnline && cachedIsAdmin) {
      return; // Permitir acceso con datos cacheados
    }

    // Si estamos online y no es admin, redirigir
    if (isOnline && !isAdmin) {
      router.replace("/admin/login");
      return;
    }

    // Si estamos offline sin cache y sin confirmación de admin, esperar
    // Firebase Auth cachea el token internamente, confiamos en él
  }, [user, isLoading, isAdmin, isOnline, cachedIsAdmin, router, pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Sin usuario
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Determinar si permitir acceso
  const allowAccess = isAdmin || (!isOnline && cachedIsAdmin);

  if (!allowAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Indicador de Modo Offline */}
      {!isOnline && <OfflineBadge />}
    </>
  );
}
