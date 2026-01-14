"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, type ReactNode } from "react";

interface SecretAdminTriggerProps {
	children: ReactNode;
	/** Ruta a la que redirigir tras activar el trigger secreto */
	redirectTo?: string;
	/** Número de clics necesarios para activar (default: 5) */
	clicksRequired?: number;
	/** Tiempo máximo en ms para completar los clics (default: 2000) */
	timeoutMs?: number;
}

/**
 * Componente invisible que envuelve un elemento y activa una redirección
 * secreta al panel de administración tras múltiples clics rápidos.
 *
 * Uso: Envolver el logo o texto del footer para acceso oculto al login.
 *
 * @example
 * <SecretAdminTrigger>
 *   <Image src="/logo.png" alt="Logo" />
 * </SecretAdminTrigger>
 */
export function SecretAdminTrigger({
	children,
	redirectTo = "/admin/login",
	clicksRequired = 5,
	timeoutMs = 2000,
}: SecretAdminTriggerProps) {
	const router = useRouter();
	const clickCountRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const resetTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		clickCountRef.current = 0;
	}, []);

	const handleClick = useCallback(() => {
		clickCountRef.current += 1;

		// Si es el primer clic, iniciar el timer
		if (clickCountRef.current === 1) {
			timerRef.current = setTimeout(() => {
				// Tiempo agotado sin completar los clics
				resetTimer();
			}, timeoutMs);
		}

		// Si alcanzamos el número requerido de clics
		if (clickCountRef.current >= clicksRequired) {
			resetTimer();
			router.push(redirectTo);
		}
	}, [clicksRequired, timeoutMs, redirectTo, router, resetTimer]);

	return (
		<div
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleClick();
				}
			}}
			className="cursor-pointer"
			role="button"
			tabIndex={0}
			aria-label="Elemento interactivo"
		>
			{children}
		</div>
	);
}
