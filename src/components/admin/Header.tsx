"use client";

import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
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
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 rounded-lg hover:bg-surface-muted transition-colors min-h-0">
          <Menu className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Buscar usuarios, consentimientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-muted border-border rounded-lg focus:border-primary min-h-0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-surface-muted transition-colors min-h-0">
            <Bell className="w-5 h-5 text-foreground/70" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-foreground/70 max-w-[150px] truncate">
              {user?.email}
            </span>
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-contrast flex items-center justify-center">
            <span className="text-xs font-bold text-background">{getInitials()}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/70 hover:text-red-500 transition-colors min-h-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
