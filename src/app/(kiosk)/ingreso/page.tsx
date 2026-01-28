"use client";

import { Fingerprint, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";
import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKioskStore } from "@/store/kioskStore";

const MIN_DIGITS = 5;
const MAX_DIGITS = 20;
const OTP_ROUTE = "/otp";
const REGISTER_ROUTE = "/registro";

type CheckUserResponse = {
	exists: boolean;
	userData?: {
		emailMasked?: string;
	};
};

export default function IngresoPage() {
	const router = useRouter();
	const { t } = useLanguage();
	const updateVisitorData = useKioskStore((state) => state.updateVisitorData);
	const setStep = useKioskStore((state) => state.setStep);
	const [cedula, setCedula] = useState("");
	const [isChecking, setIsChecking] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const appendDigit = useCallback((digit: string) => {
		setErrorMessage(null);
		setCedula((prev) => {
			if (prev.length >= MAX_DIGITS) return prev;
			return `${prev}${digit}`;
		});
	}, []);

	/**
	 * Maneja la entrada directa desde el teclado físico.
	 * Permite letras y números para soportar pasaportes.
	 */
	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
		if (value.length <= MAX_DIGITS) {
			setCedula(value);
			setErrorMessage(null);
		}
	}, []);

	const handleDelete = useCallback(() => {
		setCedula((prev) => prev.slice(0, -1));
		setErrorMessage(null);
	}, []);

	const handleCheckUser = useCallback(async () => {
		if (!cedula || isChecking) {
			if (!cedula)
				setErrorMessage(t("ingreso.error.empty"));
			return;
		}

		if (cedula.length < MIN_DIGITS) {
			setErrorMessage(t("ingreso.error.minDigits", { min: MIN_DIGITS }));
			return;
		}

		setIsChecking(true);
		setErrorMessage(null);

		try {
			const response = await fetch("/api/usuarios/check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ cedula }),
			});

			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				const validationMsg = Array.isArray(payload?.details)
					? payload.details[0]?.message
					: payload?.error;
				throw new Error(validationMsg ?? `Error ${response.status}`);
			}

			const data: CheckUserResponse = payload;

			if (data.exists) {
				// Usuario existe: enviamos OTP usando la cédula (el backend resuelve el email)
				const otpResponse = await fetch("/api/otp", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ cedula }),
				});

				const otpPayload = await otpResponse.json().catch(() => ({}));
				if (!otpResponse.ok) {
					throw new Error(
						otpPayload.error ?? "No pudimos enviar el código OTP",
					);
				}

				// Actualizamos store con cédula y email ofuscado (para mostrar en pantalla OTP)
				updateVisitorData({
					uid: cedula,
					email: data.userData?.emailMasked,
				});

				// TODO: Mostrar Toast "Si tus datos coinciden..." (Implementar Toast si existe librería, o usar estado local en OTP page)
				// Por ahora redirigimos
				setStep(2);
				router.push(OTP_ROUTE);
			} else {
				// Usuario no existe: redirigir a registro
				updateVisitorData({ uid: cedula });
				setStep(2); // O el paso que corresponda a registro
				router.push(REGISTER_ROUTE);
			}
		} catch (error) {
			// console.error("Error verificando cédula", error);
			const message =
				error instanceof Error
					? error.message
					: "No pudimos verificar tu cédula. Intentá nuevamente.";
			setErrorMessage(message);
		} finally {
			setIsChecking(false);
		}
	}, [cedula, isChecking, router, setStep, updateVisitorData, t]);

	const handleSubmit = useCallback(
		(evt: FormEvent<HTMLFormElement>) => {
			evt.preventDefault();
			void handleCheckUser();
		},
		[handleCheckUser],
	);

	return (
		<section className="flex flex-1 items-center justify-center px-3 sm:px-6 py-4 sm:py-8 bg-background text-foreground">
			<form
				onSubmit={handleSubmit}
				className="group/form relative flex w-full max-w-4xl flex-col items-center gap-4 sm:gap-6 md:gap-8 rounded-2xl sm:rounded-3xl md:rounded-4xl overflow-hidden
					/* ═══ FONDO CON GRADIENTE ═══ */
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					backdrop-blur-xl
					/* ═══ BORDE PREMIUM ═══ */
					border-2 border-white/20 dark:border-zinc-700/50
					/* ═══ SOMBRA ═══ */
					shadow-[0_40px_140px_rgba(0,0,0,0.45)]
					/* ═══ PADDING ═══ */
					p-4 sm:p-6 md:p-10 text-center
				"
			>
				{/* ═══ EFECTO SHIMMER DE FONDO ═══ */}
				<div 
					className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/form:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" 
					aria-hidden="true" 
				/>
				
				{/* ═══ PARTÍCULAS DECORATIVAS ═══ */}
				<span className="absolute top-4 left-6 w-2 h-2 rounded-full bg-primary/20 animate-pulse" aria-hidden="true" />
				<span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-purple-500/20 animate-pulse delay-150" aria-hidden="true" />
				<span className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-emerald-500/20 animate-pulse delay-300" aria-hidden="true" />
				<span className="absolute bottom-4 right-6 w-2.5 h-2.5 rounded-full bg-primary/15 animate-pulse delay-500" aria-hidden="true" />

				{/* ═══ ENCABEZADO ═══ */}
				<div className="relative space-y-2 sm:space-y-4">
					{/* Badge de paso */}
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
						<Fingerprint className="w-4 h-4 text-primary" strokeWidth={2} />
						<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-primary font-semibold">
							{t("ingreso.step")}
						</p>
					</div>
					
					<h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-foreground">
						{t("ingreso.title")}
					</h1>
					<p className="text-sm sm:text-base text-foreground/70">
						{t("ingreso.subtitle")}
					</p>
				</div>

				{/* ═══ CAMPO DE ENTRADA ═══ */}
				<div className="relative w-full max-w-3xl">
					{/* Input con estilo premium */}
					<div className="relative group">
						<input
							type="text"
							inputMode="text"
							value={cedula}
							onChange={handleInputChange}
							placeholder={t("ingreso.placeholder")}
							className="
								kiosk-input-base
								w-full rounded-xl sm:rounded-2xl md:rounded-[2.5rem]
								/* ═══ FONDO PREMIUM GLASS ═══ */
								bg-gradient-to-br from-white/10 via-white/5 to-white/10
								dark:from-zinc-900/95 dark:via-zinc-950/90 dark:to-zinc-900/95
								backdrop-blur-xl
								/* ═══ BORDE CON GRADIENTE SUTIL ═══ */
								border-2 border-white/15 dark:border-zinc-600/40
								/* ═══ TEXTO ═══ */
								text-zinc-900 dark:text-white
								placeholder:text-gray-400/70 dark:placeholder:text-zinc-500
								/* ═══ DIMENSIONES ═══ */
								px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8
								text-center text-2xl sm:text-3xl md:text-5xl font-bold
								tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.4em]
								/* ═══ SOMBRA PREMIUM ═══ */
								shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.12)]
								dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.4)]
								/* ═══ TRANSICIONES ═══ */
								transition-all duration-300 ease-out
								/* ═══ HOVER ═══ */
								hover:border-primary/40 hover:bg-gradient-to-br 
								hover:from-primary/8 hover:via-white/8 hover:to-primary/8
								dark:hover:from-primary/10 dark:hover:via-zinc-900/95 dark:hover:to-primary/10
								hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_12px_40px_rgba(46,204,113,0.15)]
								/* ═══ FOCUS ═══ */
								focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25
								focus-visible:border-primary/60 
								focus-visible:bg-gradient-to-br focus-visible:from-primary/12 focus-visible:via-white/10 focus-visible:to-primary/12
								dark:focus-visible:from-primary/15 dark:focus-visible:via-zinc-900/98 dark:focus-visible:to-primary/15
								focus-visible:shadow-[0_0_40px_rgba(46,204,113,0.2),0_16px_48px_rgba(46,204,113,0.15)]
								/* ═══ ACTIVE (MÓVIL) ═══ */
								active:scale-[0.99]
								uppercase
							"
							aria-label={t("ingreso.placeholder")}
							autoComplete="off"
							autoCapitalize="characters"
						/>
						{/* Efecto glow al focus */}
						<div 
							className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
							style={{
								background: "radial-gradient(ellipse at center, rgba(46,204,113,0.1) 0%, transparent 70%)"
							}}
							aria-hidden="true" 
						/>
					</div>
					
					<p className="mt-2 sm:mt-3 text-xs sm:text-sm text-foreground/60 flex items-center justify-center gap-1.5">
						<Sparkles className="w-3 h-3 text-primary/60" />
						{t("ingreso.hint", { min: MIN_DIGITS })}
					</p>
				</div>

				{/* ═══ MENSAJE DE ERROR ═══ */}
				{errorMessage && (
					<div className="w-full max-w-3xl rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg text-red-500 dark:text-red-300 animate-shake">
						{errorMessage}
					</div>
				)}

				{/* ═══ TECLADO VIRTUAL ═══ */}
				<VirtualKeypad
					onKeyPress={appendDigit}
					onDelete={handleDelete}
					onConfirm={() => void handleCheckUser()}
				/>

				<button type="submit" className="sr-only" aria-hidden tabIndex={-1}>
					{t("ingreso.continue")}
				</button>

				{/* ═══ INDICADOR DE CARGA ═══ */}
				{isChecking && (
					<div className="flex items-center gap-3 text-lg text-foreground/80 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
						<Loader2 className="h-5 w-5 animate-spin text-primary" />
						<span>{t("ingreso.verifying")}</span>
					</div>
				)}
			</form>
		</section>
	);
}
