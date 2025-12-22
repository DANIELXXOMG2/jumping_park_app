"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";
import { VirtualKeypad } from "@/components/kiosk/VirtualKeypad";
import { useKioskStore } from "@/store/kioskStore";
import { useLanguage } from "@/contexts/LanguageContext";

const MIN_DIGITS = 6;
const MAX_DIGITS = 15;
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
				className="relative flex w-full max-w-4xl flex-col items-center gap-4 sm:gap-6 md:gap-8 rounded-2xl sm:rounded-3xl md:rounded-4xl border-2 border-white/10 bg-white/5 dark:bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-6 md:p-10 text-center shadow-[0_40px_140px_rgba(0,0,0,0.45)] before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl md:before:rounded-4xl before:p-[2px] before:bg-gradient-to-br before:from-primary/20 before:via-transparent before:to-primary/10 before:-z-10 before:pointer-events-none"
			>
				<div className="space-y-2 sm:space-y-4">
					<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-primary">
						{t("ingreso.step")}
					</p>
					<h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-foreground">
						{t("ingreso.title")}
					</h1>
					<p className="text-sm sm:text-base text-foreground/70">
						{t("ingreso.subtitle")}
					</p>
				</div>

				<div className="w-full max-w-3xl">
					<input
						type="text"
						inputMode="numeric"
						readOnly
						value={cedula}
						className="w-full rounded-xl sm:rounded-2xl md:rounded-[2.5rem] border bg-white dark:bg-zinc-900 text-black dark:text-white border-gray-200 dark:border-zinc-700 px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 text-center text-2xl sm:text-3xl md:text-5xl font-bold tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.4em] shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						aria-label={t("ingreso.placeholder")}
					/>
					<p className="mt-2 sm:mt-3 text-xs sm:text-sm text-foreground/60">
						{t("ingreso.hint", { min: MIN_DIGITS })}
					</p>
				</div>

				{errorMessage && (
					<div className="w-full max-w-3xl rounded-xl sm:rounded-2xl md:rounded-3xl border border-red-500/40 bg-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg text-red-600 dark:text-red-100">
						{errorMessage}
					</div>
				)}

				<VirtualKeypad
					onKeyPress={appendDigit}
					onDelete={handleDelete}
					onConfirm={() => void handleCheckUser()}
				/>

				<button type="submit" className="sr-only" aria-hidden tabIndex={-1}>
					{t("ingreso.continue")}
				</button>

				{isChecking && (
					<div className="flex items-center gap-3 text-lg text-foreground/80">
						<Loader2 className="h-5 w-5 animate-spin" />
						{t("ingreso.verifying")}
					</div>
				)}
			</form>
		</section>
	);
}
