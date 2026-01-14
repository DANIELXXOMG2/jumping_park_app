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
	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
		<div
			className={cn(
				"flex items-center justify-center gap-2 sm:gap-3",
				className
			)}
			role="group"
			aria-label="Código de verificación OTP"
		>
			{Array.from({ length }, (_, index) => {
				const digit = value[index] || "";
				const isFocused = focusedIndex === index;

				return (
					<input
						key={index}
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
							// Base styles
							"h-14 w-12 sm:h-16 sm:w-14 rounded-xl text-center text-2xl sm:text-3xl font-bold",
							"transition-all duration-200 ease-in-out",
							"border-2 outline-none ring-offset-2",
							
							// Estados normales
							!hasError && !isFocused && "border-gray-300 bg-white",
							!hasError && isFocused && "border-blue-500 ring-2 ring-blue-200 scale-105",
							
							// Estado con valor
							digit && !hasError && "border-blue-600 bg-blue-50",
							
							// Estado de error
							hasError && "border-red-500 bg-red-50 text-red-700",
							hasError && isFocused && "ring-2 ring-red-200",
							
							// Estado deshabilitado
							disabled && "opacity-50 cursor-not-allowed bg-gray-100",
							
							// Hover (solo si no está deshabilitado)
							!disabled && "hover:border-blue-400"
						)}
					/>
				);
			})}
		</div>
	);
}
