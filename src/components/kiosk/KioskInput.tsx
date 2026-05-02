"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface KioskInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
	/** Variante del input */
	variant?: "default" | "premium" | "glass";
	/** Tamaño del input */
	inputSize?: "sm" | "md" | "lg";
	/** Estado de error */
	hasError?: boolean;
	/** Icono izquierdo */
	leftIcon?: React.ReactNode;
	/** Icono derecho */
	rightIcon?: React.ReactNode;
	/** Contenedor adicional className */
	containerClassName?: string;
}

/**
 * KioskInput - Input profesional y moderno para el ecosistema kiosk
 *
 * Características:
 * - Diseño glassmorphism premium
 * - Estados táctiles optimizados para móviles
 * - Animaciones suaves y micro-interacciones
 * - Soporte para íconos
 * - Dark mode nativo
 */
export const KioskInput = forwardRef<HTMLInputElement, KioskInputProps>(
	(
		{
			className,
			variant = "default",
			inputSize = "md",
			hasError = false,
			leftIcon,
			rightIcon,
			containerClassName,
			disabled,
			...props
		},
		ref,
	) => {
		// Estilos base compartidos
		const baseStyles = cn(
			// Reset
			"w-full appearance-none outline-none",
			// Tipografía
			"font-medium text-foreground placeholder:text-foreground/40",
			// Transiciones suaves
			"transition-all duration-300 ease-out",
			// Deshabilitado
			disabled && "opacity-50 cursor-not-allowed pointer-events-none",
		);

		// Estilos por tamaño
		const sizeStyles = {
			sm: cn(
				"text-sm px-3 py-2.5 rounded-lg",
				leftIcon && "pl-9",
				rightIcon && "pr-9",
			),
			md: cn(
				"text-base px-4 py-3.5 rounded-xl",
				leftIcon && "pl-11",
				rightIcon && "pr-11",
			),
			lg: cn(
				"text-lg px-5 py-4 rounded-2xl",
				leftIcon && "pl-14",
				rightIcon && "pr-14",
			),
		};

		// Estilos por variante
		const variantStyles = {
			default: cn(
				// Fondo
				"bg-white/5 dark:bg-zinc-900/60",
				// Borde
				"border-2 border-white/10 dark:border-zinc-700/50",
				// Sombra interna sutil
				"shadow-inner shadow-black/5 dark:shadow-black/20",
				// Hover
				"hover:border-primary/30 hover:bg-white/10 dark:hover:bg-zinc-800/60",
				"hover:shadow-[0_0_20px_rgba(46,204,113,0.1)]",
				// Focus
				"focus:border-primary/50 focus:bg-white/15 dark:focus:bg-zinc-800/80",
				"focus:ring-4 focus:ring-primary/20",
				"focus:shadow-[0_0_30px_rgba(46,204,113,0.15)]",
				// Active/Pressed (móvil)
				"active:scale-[0.99] active:border-primary/60",
			),
			premium: cn(
				// Fondo con gradiente
				"bg-gradient-to-br from-white/10 via-white/5 to-white/10",
				"dark:from-zinc-800/80 dark:via-zinc-900/60 dark:to-zinc-800/80",
				// Borde con gradiente simulado
				"border-2 border-white/20 dark:border-zinc-600/50",
				// Sombra profunda
				"shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
				// Hover premium
				"hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(46,204,113,0.2)]",
				"hover:bg-gradient-to-br hover:from-primary/10 hover:via-white/10 hover:to-primary/10",
				"dark:hover:from-primary/10 dark:hover:via-zinc-800/80 dark:hover:to-primary/10",
				// Focus premium
				"focus:border-primary/60 focus:ring-4 focus:ring-primary/30",
				"focus:shadow-[0_12px_40px_rgba(46,204,113,0.25)]",
				"focus:bg-gradient-to-br focus:from-primary/15 focus:via-white/10 focus:to-primary/15",
				"dark:focus:from-primary/15 dark:focus:via-zinc-800/80 dark:focus:to-primary/15",
				// Active/Pressed (móvil)
				"active:scale-[0.98] active:shadow-[0_4px_15px_rgba(46,204,113,0.3)]",
			),
			glass: cn(
				// Glassmorphism
				"bg-white/10 backdrop-blur-xl",
				"dark:bg-zinc-900/40 dark:backdrop-blur-xl",
				// Borde con brillo
				"border border-white/30 dark:border-white/10",
				// Sombra de cristal
				"shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]",
				"dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
				// Hover glass
				"hover:bg-white/15 hover:border-white/40 dark:hover:bg-zinc-800/50",
				"hover:shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.25)]",
				// Focus glass
				"focus:bg-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/20",
				"focus:shadow-[0_16px_50px_rgba(46,204,113,0.15),inset_0_1px_0_rgba(255,255,255,0.3)]",
				// Active/Pressed (móvil)
				"active:scale-[0.99] active:bg-white/25",
			),
		};

		// Estilos de error
		const errorStyles = hasError
			? cn(
					"border-red-500/60 dark:border-red-400/50",
					"bg-red-500/5 dark:bg-red-500/10",
					"ring-2 ring-red-500/20",
					"focus:border-red-500/80 focus:ring-red-500/30",
					"hover:border-red-500/70",
				)
			: "";

		// Estilos de íconos
		const iconSizeStyles = {
			sm: "w-4 h-4",
			md: "w-5 h-5",
			lg: "w-6 h-6",
		};

		const iconPositionStyles = {
			sm: { left: "left-3", right: "right-3" },
			md: { left: "left-3.5", right: "right-3.5" },
			lg: { left: "left-4", right: "right-4" },
		};

		return (
			<div className={cn("relative group", containerClassName)}>
				{/* Icono izquierdo */}
				{leftIcon && (
					<span
						className={cn(
							"absolute top-1/2 -translate-y-1/2 pointer-events-none",
							"text-foreground/40 group-hover:text-foreground/60 group-focus-within:text-primary/80",
							"transition-colors duration-300",
							iconPositionStyles[inputSize].left,
							iconSizeStyles[inputSize],
						)}
					>
						{leftIcon}
					</span>
				)}

				{/* Input */}
				<input
					ref={ref}
					disabled={disabled}
					className={cn(
						baseStyles,
						sizeStyles[inputSize],
						variantStyles[variant],
						errorStyles,
						className,
					)}
					{...props}
				/>

				{/* Icono derecho */}
				{rightIcon && (
					<span
						className={cn(
							"absolute top-1/2 -translate-y-1/2 pointer-events-none",
							"text-foreground/40 group-hover:text-foreground/60 group-focus-within:text-primary/80",
							"transition-colors duration-300",
							iconPositionStyles[inputSize].right,
							iconSizeStyles[inputSize],
						)}
					>
						{rightIcon}
					</span>
				)}

				{/* Efecto de glow sutil en focus (solo variante premium) */}
				{variant === "premium" && (
					<div
						className="absolute inset-0 rounded-inherit opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500"
						style={{
							background:
								"radial-gradient(ellipse at center, rgba(46,204,113,0.08) 0%, transparent 70%)",
							borderRadius: "inherit",
						}}
						aria-hidden="true"
					/>
				)}
			</div>
		);
	},
);

KioskInput.displayName = "KioskInput";

// ============================================================================
// ESTILOS PARA SELECT
// ============================================================================

export interface KioskSelectProps
	extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
	variant?: "default" | "premium" | "glass";
	inputSize?: "sm" | "md" | "lg";
	hasError?: boolean;
	leftIcon?: React.ReactNode;
	containerClassName?: string;
}

export const KioskSelect = forwardRef<HTMLSelectElement, KioskSelectProps>(
	(
		{
			className,
			variant = "default",
			inputSize = "md",
			hasError = false,
			leftIcon,
			containerClassName,
			disabled,
			children,
			...props
		},
		ref,
	) => {
		// Estilos base compartidos
		const baseStyles = cn(
			"w-full appearance-none outline-none cursor-pointer",
			"font-medium text-foreground",
			"transition-all duration-300 ease-out",
			"pr-10", // Espacio para el chevron
			disabled && "opacity-50 cursor-not-allowed pointer-events-none",
		);

		const sizeStyles = {
			sm: cn("text-sm px-3 py-2.5 rounded-lg", leftIcon && "pl-9"),
			md: cn("text-base px-4 py-3.5 rounded-xl", leftIcon && "pl-11"),
			lg: cn("text-lg px-5 py-4 rounded-2xl", leftIcon && "pl-14"),
		};

		const variantStyles = {
			default: cn(
				"bg-white/5 dark:bg-zinc-900/60",
				"border-2 border-white/10 dark:border-zinc-700/50",
				"shadow-inner shadow-black/5 dark:shadow-black/20",
				"hover:border-primary/30 hover:bg-white/10 dark:hover:bg-zinc-800/60",
				"focus:border-primary/50 focus:bg-white/15 focus:ring-4 focus:ring-primary/20",
				"active:scale-[0.99]",
			),
			premium: cn(
				"bg-gradient-to-br from-white/10 via-white/5 to-white/10",
				"dark:from-zinc-800/80 dark:via-zinc-900/60 dark:to-zinc-800/80",
				"border-2 border-white/20 dark:border-zinc-600/50",
				"shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
				"hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(46,204,113,0.2)]",
				"focus:border-primary/60 focus:ring-4 focus:ring-primary/30",
				"active:scale-[0.98]",
			),
			glass: cn(
				"bg-white/10 backdrop-blur-xl dark:bg-zinc-900/40",
				"border border-white/30 dark:border-white/10",
				"shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]",
				"hover:bg-white/15 hover:border-white/40",
				"focus:bg-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/20",
				"active:scale-[0.99]",
			),
		};

		const errorStyles = hasError
			? cn(
					"border-red-500/60 bg-red-500/5 ring-2 ring-red-500/20",
					"focus:border-red-500/80 focus:ring-red-500/30",
				)
			: "";

		const iconSizeStyles = {
			sm: "w-4 h-4",
			md: "w-5 h-5",
			lg: "w-6 h-6",
		};

		const iconPositionStyles = {
			sm: "left-3",
			md: "left-3.5",
			lg: "left-4",
		};

		return (
			<div className={cn("relative group", containerClassName)}>
				{leftIcon && (
					<span
						className={cn(
							"absolute top-1/2 -translate-y-1/2 pointer-events-none",
							"text-foreground/40 group-hover:text-foreground/60 group-focus-within:text-primary/80",
							"transition-colors duration-300",
							iconPositionStyles[inputSize],
							iconSizeStyles[inputSize],
						)}
					>
						{leftIcon}
					</span>
				)}

				<select
					ref={ref}
					disabled={disabled}
					className={cn(
						baseStyles,
						sizeStyles[inputSize],
						variantStyles[variant],
						errorStyles,
						className,
					)}
					{...props}
				>
					{children}
				</select>

				{/* Chevron */}
				<svg
					aria-hidden="true"
					className={cn(
						"absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none",
						"text-foreground/40 group-hover:text-foreground/60 group-focus-within:text-primary/80",
						"transition-all duration-300",
						"group-focus-within:rotate-180",
						iconSizeStyles[inputSize],
					)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</div>
		);
	},
);

KioskSelect.displayName = "KioskSelect";

// ============================================================================
// ESTILOS PARA TEXTAREA
// ============================================================================

export interface KioskTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	variant?: "default" | "premium" | "glass";
	inputSize?: "sm" | "md" | "lg";
	hasError?: boolean;
	containerClassName?: string;
}

export const KioskTextarea = forwardRef<
	HTMLTextAreaElement,
	KioskTextareaProps
>(
	(
		{
			className,
			variant = "default",
			inputSize = "md",
			hasError = false,
			containerClassName,
			disabled,
			...props
		},
		ref,
	) => {
		const baseStyles = cn(
			"w-full appearance-none outline-none resize-none",
			"font-medium text-foreground placeholder:text-foreground/40",
			"transition-all duration-300 ease-out",
			disabled && "opacity-50 cursor-not-allowed pointer-events-none",
		);

		const sizeStyles = {
			sm: "text-sm px-3 py-2.5 rounded-lg min-h-[80px]",
			md: "text-base px-4 py-3.5 rounded-xl min-h-[100px]",
			lg: "text-lg px-5 py-4 rounded-2xl min-h-[120px]",
		};

		const variantStyles = {
			default: cn(
				"bg-white/5 dark:bg-zinc-900/60",
				"border-2 border-white/10 dark:border-zinc-700/50",
				"shadow-inner shadow-black/5",
				"hover:border-primary/30 hover:bg-white/10",
				"focus:border-primary/50 focus:bg-white/15 focus:ring-4 focus:ring-primary/20",
				"active:scale-[0.995]",
			),
			premium: cn(
				"bg-gradient-to-br from-white/10 via-white/5 to-white/10",
				"dark:from-zinc-800/80 dark:via-zinc-900/60 dark:to-zinc-800/80",
				"border-2 border-white/20 dark:border-zinc-600/50",
				"shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
				"hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(46,204,113,0.2)]",
				"focus:border-primary/60 focus:ring-4 focus:ring-primary/30",
			),
			glass: cn(
				"bg-white/10 backdrop-blur-xl dark:bg-zinc-900/40",
				"border border-white/30 dark:border-white/10",
				"shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]",
				"hover:bg-white/15 hover:border-white/40",
				"focus:bg-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/20",
			),
		};

		const errorStyles = hasError
			? cn(
					"border-red-500/60 bg-red-500/5 ring-2 ring-red-500/20",
					"focus:border-red-500/80 focus:ring-red-500/30",
				)
			: "";

		return (
			<div className={cn("relative group", containerClassName)}>
				<textarea
					ref={ref}
					disabled={disabled}
					className={cn(
						baseStyles,
						sizeStyles[inputSize],
						variantStyles[variant],
						errorStyles,
						className,
					)}
					{...props}
				/>
			</div>
		);
	},
);

KioskTextarea.displayName = "KioskTextarea";
