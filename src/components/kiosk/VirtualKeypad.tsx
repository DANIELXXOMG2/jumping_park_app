"use client";

import { Check, Delete, Sparkles } from "lucide-react";
import { useUISound } from "@/hooks";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface VirtualKeypadProps {
	onKeyPress: (key: string) => void;
	onDelete: () => void;
	onConfirm: () => void;
	onClear?: () => void;
	isLoading?: boolean;
}

const digitKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/**
 * Estilos base premium para botones del teclado virtual
 */
const baseButtonStyles = cn(
	// Forma y tamaño
	"h-14 sm:h-20 md:h-24 rounded-2xl sm:rounded-3xl",
	// Fondo con gradiente sutil
	"bg-gradient-to-br from-white/10 via-white/5 to-white/10",
	"dark:from-zinc-800/80 dark:via-zinc-900/60 dark:to-zinc-800/80",
	// Borde con gradiente
	"border border-white/20 dark:border-zinc-700/50",
	// Tipografía
	"text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground",
	// Sombra
	"shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
	// Transiciones
	"transition-all duration-200",
	// Estados
	"hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
	"hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/10 hover:via-transparent hover:to-primary/10",
	"active:scale-95 active:shadow-[0_4px_15px_rgba(0,0,0,0.2)]",
	// Focus
	"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
	// Disabled
	"disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
);

export function VirtualKeypad({
	onKeyPress,
	onDelete,
	onConfirm,
	onClear,
	isLoading = false,
}: VirtualKeypadProps) {
	// Hook de sonidos para feedback táctil auditivo
	const { playClick, playError, playSuccess } = useUISound();
	const { t } = useLanguage();

	/**
	 * Handler para presionar un dígito con feedback sonoro
	 */
	const handleKeyPress = (digit: string) => {
		playClick();
		onKeyPress(digit);
	};

	/**
	 * Handler para borrar con feedback sonoro
	 */
	const handleDelete = () => {
		playClick();
		onDelete();
	};

	/**
	 * Handler para limpiar todo con feedback de "destrucción"
	 */
	const handleClear = () => {
		playError();
		onClear?.();
	};

	/**
	 * Handler para confirmar con feedback de éxito
	 */
	const handleConfirm = () => {
		playSuccess();
		onConfirm();
	};

	return (
		<div className="w-full max-w-3xl">
			<div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
				{/* Dígitos 1-9 */}
				{digitKeys.slice(0, 9).map((digit) => (
					<button
						key={digit}
						type="button"
						onClick={() => handleKeyPress(digit)}
						disabled={isLoading}
						className={cn(
							baseButtonStyles,
							"group relative overflow-hidden backdrop-blur-sm"
						)}
						aria-label={t("keypad.enterDigit", { digit })}
					>
						{/* Efecto shimmer al hover */}
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" aria-hidden="true" />
						<span className="relative">{digit}</span>
					</button>
				))}

				{/* Botón DELETE */}
				<button
					type="button"
					onClick={handleDelete}
					disabled={isLoading}
					className={cn(
						baseButtonStyles,
						"group relative overflow-hidden",
						"col-span-1 flex items-center justify-center",
						"text-xl sm:text-2xl md:text-3xl",
						// Estilo especial para delete
						"hover:border-red-500/30 hover:from-red-500/10 hover:to-red-500/10",
						"text-primary hover:text-red-400"
					)}
					aria-label={t("keypad.deleteLastDigit")}
				>
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" aria-hidden="true" />
					<Delete className="relative h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 group-hover:scale-110 transition-transform duration-200" />
				</button>

				{/* Dígito 0 */}
				<button
					type="button"
					onClick={() => handleKeyPress("0")}
					disabled={isLoading}
					className={cn(
						baseButtonStyles,
						"group relative overflow-hidden backdrop-blur-sm"
					)}
					aria-label={t("keypad.enterDigit", { digit: "0" })}
				>
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" aria-hidden="true" />
					<span className="relative">0</span>
				</button>

				{/* Botón CONFIRMAR */}
				<button
					type="button"
					onClick={handleConfirm}
					disabled={isLoading}
					className={cn(
						// Tamaño base
						"h-14 sm:h-20 md:h-24 rounded-2xl sm:rounded-3xl",
						// Gradiente premium
						"bg-gradient-to-r from-primary via-emerald-400 to-primary",
						"dark:from-primary dark:via-emerald-500 dark:to-primary",
						// Borde brillante
						"border-2 border-white/30",
						// Texto
						"text-zinc-900 font-bold",
						// Sombra con glow
						"shadow-[0_8px_30px_rgba(46,204,113,0.4)]",
						// Transiciones
						"transition-all duration-300",
						// Hover
						"hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)]",
						"hover:border-white/50",
						// Active
						"active:scale-95 active:shadow-[0_4px_20px_rgba(46,204,113,0.3)]",
						// Focus
						"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
						// Disabled
						"disabled:opacity-50 disabled:pointer-events-none",
						// Layout
						"group relative overflow-hidden flex items-center justify-center"
					)}
					aria-label={t("keypad.confirmDocument")}
				>
					{/* Efecto shimmer */}
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" aria-hidden="true" />
					
					{/* Partículas decorativas */}
					<span className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white/60 animate-pulse" aria-hidden="true" />
					<span className="absolute bottom-2 right-3 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white/50 animate-pulse delay-150" aria-hidden="true" />
					
					<span className="relative flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl md:text-3xl">
						<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.5} />
						OK
						<Check
							className="h-5 w-5 sm:h-7 sm:w-7 md:h-10 md:w-10 group-hover:scale-110 transition-transform duration-200"
							strokeWidth={2.25}
						/>
					</span>
				</button>
			</div>

			{/* Botón de limpiar (opcional) */}
			{onClear && (
				<button
					type="button"
					onClick={handleClear}
					disabled={isLoading}
					className="group mt-4 w-full py-3 text-sm text-foreground/40 hover:text-red-400 transition-all duration-300 flex items-center justify-center gap-2"
					aria-label={t("keypad.clearAll")}
				>
					<span className="group-hover:scale-110 transition-transform duration-200">🗑️</span>
					<span className="group-hover:underline">{t("keypad.clearAll")}</span>
				</button>
			)}
		</div>
	);
}
