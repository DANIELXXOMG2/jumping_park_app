"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/admin/login");
    } catch {
      // Error silencioso
    }
  };

  const getInitials = () => {
    if (!user?.email) return "AD";
    const parts = user.email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo (visible en mobile, en desktop se muestra en el Sidebar) */}
        <div className="lg:hidden">
          <Image
            src="/assets/jumping-park-logo.png"
            alt="Jumping Park"
            width={100}
            height={30}
            className="h-7 w-auto"
          />
        </div>

        {/* Spacer para mantener el layout en desktop */}
        <div className="hidden lg:block" />

        {/* Controles de usuario (derecha) */}
        <div className="flex items-center gap-3">
          {/* Email del usuario */}
          <div className="hidden sm:flex items-center">
            <span className="text-sm text-text-secondary max-w-[180px] truncate">
              {user?.email}
            </span>
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-soft-sm">
            <span className="text-xs font-bold text-white">{getInitials()}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors min-h-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
