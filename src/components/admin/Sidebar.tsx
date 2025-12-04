"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Baby,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/admin/usuarios",
    icon: Users,
    label: "Usuarios",
  },
  {
    href: "/admin/consentimientos",
    icon: FileCheck,
    label: "Consentimientos",
  },
  {
    href: "/admin/menores",
    icon: Baby,
    label: "Menores",
  },
  {
    href: "/admin/configuracion",
    icon: Settings,
    label: "Configuración",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40 hidden" />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-surface border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "hidden lg:flex flex-col"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b border-border">
          <div className="flex-1 flex justify-center">
            <Image
              src="/assets/jumping-park-logo.png"
              alt="Jumping Park"
              width={collapsed ? 40 : 160}
              height={collapsed ? 40 : 45}
              className={collapsed ? "h-9 w-9 object-contain" : "h-10 w-auto"}
            />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-surface-muted transition-colors min-h-0 shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-foreground/60" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-foreground/60" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group min-h-0",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-foreground/70 hover:bg-surface-muted hover:text-foreground border border-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-foreground/60 group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-xs text-foreground/40 text-center">
              Panel de Administración
            </p>
          </div>
        )}
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
        <div className="flex items-center justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-h-0",
                  isActive ? "text-primary" : "text-foreground/60"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
