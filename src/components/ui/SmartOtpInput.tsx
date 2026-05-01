"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SmartOtpInputProps {
	/** Longitud del código OTP (por defecto 6) */
	length?: number;
	/** Callback cuando se completa el código */
	onComplete: (code: string) => void;
	/** Valor controlado del OTP */
	value: string;
	/** Handler para cambios de valor */
	onChange: (value: string) => void;
	/** Deshabilitar inputs */
	disabled?: boolean;
	/** Mostrar estado de error */
	hasError?: boolean;
	/** Limpiar el valor (útil después de errores) */
	shouldClear?: boolean;
	/** Clase CSS adicional para el contenedor */
	className?: string;
	/** IDs descriptivos adicionales */
	describedBy?: string;
}

/**
 * SmartOtpInput - Componente optimizado para códigos OTP desde notificaciones de email
 *
 * Características:
 * - autoComplete="one-time-code" para iOS/Android email notifications
 * - Auto-submit al completar los 6 dígitos
 * - Soporte de pegado inteligente
 * - Navegación con teclado (arrow keys, backspace)
 * - Accesible (ARIA)
 */
export function SmartOtpInput({
	length = 6,
	onComplete,
	value,
	onChange,
	disabled = false,
	hasError = false,
	shouldClear = false,
	className,
	describedBy,
}: SmartOtpInputProps) {
	const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
	const [focusedIndex, setFocusedIndex] = useState(0);

	// Limpiar cuando se solicite
	useEffect(() => {
		if (shouldClear) {
			onChange("");
			inputsRef.current[0]?.focus();
		}
	}, [shouldClear, onChange]);

	// Auto-submit cuando se completa
	useEffect(() => {
		if (value.length === length && !disabled) {
			onComplete(value);
		}
	}, [value, length, onComplete, disabled]);

	// Manejar cambio en un input individual
	const handleChange = (index: number, inputValue: string) => {
		if (disabled) return;

		// Extraer solo dígitos
		const digit = inputValue.replace(/\D/g, "");

		if (!digit) return;

		// Construir nuevo valor
		const newValue = value.split("");
		newValue[index] = digit[0];
		const updatedValue = newValue.join("").slice(0, length);

		onChange(updatedValue);

		// Mover foco al siguiente input
		if (index < length - 1 && digit) {
			inputsRef.current[index + 1]?.focus();
		}
	};

	// Manejar teclas especiales
	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (disabled) return;

		switch (e.key) {
			case "Backspace":
				e.preventDefault();
				if (value[index]) {
					// Borrar dígito actual
					const newValue = value.split("");
					newValue[index] = "";
					onChange(newValue.join(""));
				} else if (index > 0) {
					// Mover al anterior y borrar
					const newValue = value.split("");
					newValue[index - 1] = "";
					onChange(newValue.join(""));
					inputsRef.current[index - 1]?.focus();
				}
				break;

			case "ArrowLeft":
				e.preventDefault();
				if (index > 0) {
					inputsRef.current[index - 1]?.focus();
				}
				break;

			case "ArrowRight":
				e.preventDefault();
				if (index < length - 1) {
					inputsRef.current[index + 1]?.focus();
				}
				break;

			case "ArrowUp":
			case "ArrowDown":
				e.preventDefault();
				break;

			default:
				// Permitir solo números
				if (!/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
					if (e.key.length === 1) {
						e.preventDefault();
					}
				}
		}
	};

	// Manejar pegado inteligente
	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		if (disabled) return;

		const pastedData = e.clipboardData.getData("text");
		const digits = pastedData.replace(/\D/g, "").slice(0, length);

		if (digits.length > 0) {
			onChange(digits);

			// Enfocar el siguiente input vacío o el último
			const nextEmptyIndex = Math.min(digits.length, length - 1);
			inputsRef.current[nextEmptyIndex]?.focus();
		}
	};

	// Manejar foco
	const handleFocus = (index: number) => {
		setFocusedIndex(index);
		// Seleccionar contenido al enfocar
		inputsRef.current[index]?.select();
	};

	return (
		<fieldset
			className={cn(
				"flex items-center justify-center gap-2 sm:gap-3 border-none p-0 m-0",
				className,
			)}
			aria-label="Código de verificación OTP"
			aria-describedby={describedBy}
		>
			<legend className="sr-only">Ingresa el codigo OTP de seis digitos</legend>
			{Array.from({ length }, (_, index) => {
				const digit = value[index] || "";
				const isFocused = focusedIndex === index;
				const digitKey = `otp-digit-${index}`;

				return (
					<input
						key={digitKey}
						ref={(el) => {
							inputsRef.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						autoComplete={index === 0 ? "one-time-code" : "off"}
						pattern="\d{1}"
						maxLength={1}
						value={digit}
						onChange={(e) => handleChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						onPaste={handlePaste}
						onFocus={() => handleFocus(index)}
						disabled={disabled}
						aria-label={`Dígito ${index + 1} de ${length}`}
						className={cn(
							// Base styles - Mobile First
							"kiosk-otp-digit",
							"h-14 w-12 sm:h-16 sm:w-14 md:h-18 md:w-16",
							"rounded-xl sm:rounded-2xl",
							"text-center text-2xl sm:text-3xl md:text-4xl font-bold",
							"outline-none",

							// Fondo con gradiente premium
							"bg-gradient-to-b from-white/10 via-white/5 to-white/10",
							"dark:from-zinc-800/90 dark:via-zinc-900/80 dark:to-zinc-800/90",

							// Borde con transición suave
							"border-2 border-white/20 dark:border-zinc-600/50",

							// Transiciones
							"transition-all duration-300 ease-out",

							// Sombra base
							"shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]",
							"dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]",

							// Hover state
							!disabled &&
								!hasError &&
								"hover:border-blue-400/60 hover:bg-gradient-to-b hover:from-blue-500/10 hover:via-white/8 hover:to-blue-500/10",
							!disabled &&
								!hasError &&
								"dark:hover:border-blue-400/50 dark:hover:from-blue-500/15 dark:hover:via-zinc-800/90 dark:hover:to-blue-500/15",

							// Focus state - premium glow
							!hasError &&
								isFocused && [
									"border-blue-500 dark:border-blue-400",
									"bg-gradient-to-b from-blue-500/15 via-white/10 to-blue-500/15",
									"dark:from-blue-500/20 dark:via-zinc-800/95 dark:to-blue-500/20",
									"ring-4 ring-blue-500/25 dark:ring-blue-400/20",
									"shadow-[0_8px_32px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]",
									"scale-105",
								],

							// Estado con valor - verde de éxito
							digit &&
								!hasError &&
								!isFocused && [
									"border-emerald-500/60 dark:border-emerald-400/50",
									"bg-gradient-to-b from-emerald-500/15 via-emerald-500/8 to-emerald-500/15",
									"dark:from-emerald-500/20 dark:via-zinc-800/90 dark:to-emerald-500/20",
									"text-emerald-600 dark:text-emerald-400",
								],

							// Estado de error
							hasError && [
								"border-red-500/70 dark:border-red-400/60",
								"bg-gradient-to-b from-red-500/10 via-red-500/5 to-red-500/10",
								"dark:from-red-500/15 dark:via-zinc-800/90 dark:to-red-500/15",
								"text-red-600 dark:text-red-400",
								"animate-shake",
							],
							hasError &&
								isFocused &&
								"ring-4 ring-red-500/25 dark:ring-red-400/20",

							// Estado deshabilitado
							disabled &&
								"opacity-50 cursor-not-allowed bg-zinc-200/50 dark:bg-zinc-800/50",
						)}
					/>
				);
			})}
		</fieldset>
	);
}
