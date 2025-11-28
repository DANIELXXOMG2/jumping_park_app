"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantStyles = {
  primary: "bg-gradient-to-r from-primary to-primary-contrast text-background font-semibold hover:opacity-90",
  secondary: "bg-surface-muted text-foreground border border-border hover:bg-surface",
  outline: "bg-transparent text-foreground border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground/70 hover:bg-surface-muted hover:text-foreground",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs min-h-8",
  md: "px-4 py-2 text-sm min-h-10",
  lg: "px-6 py-3 text-base min-h-12",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
