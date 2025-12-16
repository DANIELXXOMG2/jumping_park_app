"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

// Hook para detectar si estamos en el cliente (evita hydration mismatch)
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

/**
 * Botón discreto para alternar entre modos de tema.
 * Cicla: system → light → dark → system
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <button
        className="p-2 rounded-lg bg-surface-muted text-text-secondary"
        aria-label="Cargando tema"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-5 h-5" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="w-5 h-5" />;
    }
    return <Sun className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === "system") return "Tema del sistema";
    if (theme === "dark") return "Modo oscuro";
    return "Modo claro";
  };

  return (
    <button
      onClick={cycleTheme}
      className="
        p-2.5 rounded-xl
        bg-surface dark:bg-surface-muted
        border border-border dark:border-border-muted
        text-text-secondary dark:text-text-muted
        hover:bg-surface-muted dark:hover:bg-surface
        hover:text-text-primary dark:hover:text-text-primary
        transition-all duration-200
        shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-brand-blue/30
      "
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}

/**
 * Variante compacta para usar en navbars
 */
export function ThemeToggleCompact() {
  const { setTheme, resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <div className="w-9 h-9" />;
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg
        text-text-muted hover:text-text-primary
        hover:bg-surface-muted dark:hover:bg-surface
        transition-colors duration-150
      "
      aria-label={resolvedTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
