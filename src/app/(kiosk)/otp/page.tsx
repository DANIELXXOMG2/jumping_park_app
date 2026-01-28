"use client";

import { AlertTriangle, Loader2, Mail, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SmartOtpInput } from "@/components/ui/SmartOtpInput";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKioskStore } from "@/store/kioskStore";

const OTP_LENGTH = 6;
const CONSENT_ROUTE = "/consentimiento";
const INGRESO_ROUTE = "/ingreso";

const maskEmail = (email: string) => {
	if (email.includes("*")) return email; // Ya está ofuscado
	const [localPart, domainPart] = email.split("@");
	if (!domainPart) return email;
	const safeLocal = `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 3))}`;
	const [domainName, ...rest] = domainPart.split(".");
	const safeDomain = `${domainName.slice(0, 1)}***`;
	const tld = rest.join(".");
	return `${safeLocal}@${safeDomain}${tld ? `.${tld}` : ""}`;
};

export default function OtpPage() {
	const router = useRouter();
	const visitorData = useKioskStore((state) => state.visitorData);
	const updateVisitorData = useKioskStore((state) => state.updateVisitorData); // Necesitamos actualizar datos
	const setAuthenticated = useKioskStore((state) => state.setAuthenticated);
	const setStep = useKioskStore((state) => state.setStep);

	// Hook de traducciones
	const { t } = useLanguage();

	const email = visitorData.email;
	const cedula = visitorData.uid;
	// Permitimos que isReady sea true si tenemos cédula O email.
	// En flujo ingreso tenemos cédula y email ofuscado.
	// En flujo registro tenemos email real y cédula.
	const isReady = Boolean(cedula || email);

	const [otp, setOtp] = useState("");
	const [isValidating, setIsValidating] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isResending, setIsResending] = useState(false);
	const [resendMessage, setResendMessage] = useState<string | null>(null);
	const [shouldClearOtp, setShouldClearOtp] = useState(false);
	const RESEND_SECONDS = 20;
	const [resendCooldown, setResendCooldown] = useState(RESEND_SECONDS);

	const maskedEmail = useMemo(() => (email ? maskEmail(email) : ""), [email]);

	const validateCode = useCallback(
		async (code: string) => {
			if (code.length !== OTP_LENGTH) return;
			if (isValidating) return;

			setIsValidating(true);
			setErrorMessage(null);
			setResendMessage(null);
			setShouldClearOtp(false);

			try {
				const isEmailMasked = email?.includes("*");

				const payload = {
					code,
					email: isEmailMasked ? undefined : email || undefined,
					cedula: cedula || undefined,
				};

				const response = await fetch("/api/otp/validate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const data = await response.json();

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("Código incorrecto o expirado");
					}
					if (response.status === 500) {
						throw new Error("Error del sistema, intenta reenviar");
					}
					throw new Error(data.error ?? "Código inválido");
				}

				if (!data.success) {
					throw new Error(data.error ?? "Código inválido");
				}

				if (data.userData) {
					updateVisitorData(data.userData);
				}

				setAuthenticated(true);
				setStep(3);
				router.push(CONSENT_ROUTE);
			} catch (error) {
				setErrorMessage(
					error instanceof Error ? error.message : "Código incorrecto",
				);
				setOtp("");
				setShouldClearOtp(true);
				setIsValidating(false);
			}
		},
		[
			cedula,
			email,
			router,
			setAuthenticated,
			setStep,
			updateVisitorData,
			isValidating,
		],
	);

	// Handler para cambio de OTP
	const handleOtpChange = useCallback((value: string) => {
		setOtp(value);
		setErrorMessage(null);
		setShouldClearOtp(false);
	}, []);

	const handleResend = useCallback(async () => {
		if (isResending) return;
		setIsResending(true);
		setErrorMessage(null);
		setResendMessage(null);
		setOtp("");

		try {
			const isEmailMasked = email?.includes("*");
			const payload: Record<string, string> = {};
			if (!isEmailMasked && email) payload.email = email;
			if (cedula) payload.cedula = cedula;

			if (!payload.email && !payload.cedula) {
				setErrorMessage("No hay datos válidos para reenviar el código");
				setIsResending(false);
				return;
			}

			const response = await fetch("/api/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "No pudimos reenviar el código");
			}

			setResendMessage("Enviamos un nuevo código a tu correo");

			setResendCooldown(RESEND_SECONDS);
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "No pudimos reenviar el código",
			);
		} finally {
			setIsResending(false);
		}
	}, [cedula, email, isResending]);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => {
			setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	if (!isReady) {
		return (
			<section className="flex flex-1 items-center justify-center px-3 sm:px-6 py-4 sm:py-8">
				<div className="group/card relative flex w-full max-w-3xl flex-col items-center gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl overflow-hidden
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					border-2 border-white/20 dark:border-zinc-700/50
					p-4 sm:p-6 md:p-10 text-center
					shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
				>
					{/* Shimmer de fondo */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000 pointer-events-none" aria-hidden="true" />
					
					{/* Ícono de error */}
					<div className="relative mb-2">
						<div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
						<div className="relative p-4 rounded-full bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 border border-red-500/30">
							<ShieldCheck className="w-10 h-10 text-red-400" strokeWidth={1.5} />
						</div>
					</div>
					
					<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-red-400">
						{t("otp.step")}
					</p>
					<h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-white">
						{t("otp.noData.title")}
					</h1>
					<p className="text-sm sm:text-base text-white/70">
						{t("otp.noData.description")}
					</p>
					<button
						type="button"
						onClick={() => router.replace(INGRESO_ROUTE)}
						className="group relative mt-2 overflow-hidden rounded-xl sm:rounded-2xl px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold uppercase tracking-wide
							bg-gradient-to-r from-primary via-emerald-400 to-primary
							text-zinc-900 border-2 border-white/30
							shadow-[0_8px_30px_rgba(46,204,113,0.4)]
							transition-all duration-300
							hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)] hover:scale-[1.02]
							active:scale-[0.98]"
					>
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" aria-hidden="true" />
						<span className="relative">{t("otp.noData.button")}</span>
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="flex flex-1 items-center justify-center px-3 sm:px-6 py-4 sm:py-8">
			<div className="group/form relative flex w-full max-w-4xl flex-col items-center gap-4 sm:gap-6 md:gap-8 rounded-2xl sm:rounded-3xl overflow-hidden
				bg-gradient-to-br from-white/10 via-white/5 to-white/10
				dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
				border-2 border-white/20 dark:border-zinc-700/50
				p-4 sm:p-6 md:p-10 text-center
				shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
			>
				{/* ═══ SHIMMER DE FONDO ═══ */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/form:translate-x-[100%] transition-transform duration-1000 pointer-events-none" aria-hidden="true" />
				
				{/* ═══ PARTÍCULAS DECORATIVAS ═══ */}
				<span className="absolute top-4 left-6 w-2 h-2 rounded-full bg-primary/20 animate-pulse" aria-hidden="true" />
				<span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-purple-500/20 animate-pulse delay-150" aria-hidden="true" />
				<span className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-emerald-500/20 animate-pulse delay-300" aria-hidden="true" />

				{/* ═══ ENCABEZADO ═══ */}
				<div className="relative space-y-2 sm:space-y-3">
					{/* Badge de paso */}
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
						<ShieldCheck className="w-4 h-4 text-primary" strokeWidth={2} />
						<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-primary font-semibold">
							{t("otp.step")}
						</p>
					</div>
					
					<h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-white">
						{t("otp.heading")}
					</h1>
					<p className="text-sm sm:text-base text-white/70 flex items-center justify-center gap-2 flex-wrap">
						<Mail className="w-4 h-4 text-white/50" />
						{t("otp.sentToEmail")}{" "}
						<span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">{maskedEmail}</span>
					</p>
				</div>

				{/* ═══ SMART OTP INPUT ═══ */}
				<div className="w-full max-w-md py-4">
					<SmartOtpInput
						length={OTP_LENGTH}
						value={otp}
						onChange={handleOtpChange}
						onComplete={validateCode}
						disabled={isValidating}
						hasError={!!errorMessage}
						shouldClear={shouldClearOtp}
					/>
				</div>

				{/* ═══ INDICADOR DE VALIDACIÓN ═══ */}
				{isValidating && (
					<div className="flex items-center gap-3 text-base sm:text-lg text-primary px-6 py-3 rounded-2xl bg-primary/10 border-2 border-primary/30 shadow-[0_0_30px_rgba(46,204,113,0.15)]">
						<Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
						<span className="font-semibold">{t("otp.validating")}</span>
					</div>
				)}

				{/* ═══ MENSAJE DE ERROR ═══ */}
				{errorMessage && (
					<div className="w-full max-w-3xl rounded-xl sm:rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg text-red-400 dark:text-red-300 flex items-center justify-center gap-2">
						<AlertTriangle className="w-5 h-5 shrink-0" />
						{errorMessage}
					</div>
				)}

				{/* ═══ MENSAJE DE ÉXITO (REENVÍO) ═══ */}
				{resendMessage && !errorMessage && (
					<div className="w-full max-w-3xl rounded-xl sm:rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-primary flex items-center justify-center gap-2">
						<Sparkles className="w-4 h-4" />
						{resendMessage}
					</div>
				)}

				{/* ═══ ACCIONES SECUNDARIAS ═══ */}
				<div className="flex flex-col items-center gap-3 sm:gap-4">
					{/* Botón de reenviar */}
					<button
						type="button"
						onClick={handleResend}
						disabled={isResending || resendCooldown > 0 || isValidating}
						className="group relative flex items-center gap-2 rounded-xl overflow-hidden border-2 border-white/20 dark:border-zinc-700/50 bg-gradient-to-r from-white/5 via-white/10 to-white/5 dark:from-zinc-800/50 dark:via-zinc-800/30 dark:to-zinc-800/50 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(46,204,113,0.15)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/20"
					>
						{/* Shimmer */}
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 group-disabled:hidden" aria-hidden="true" />
						
						{isResending ? (
							<Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
						) : (
							<RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:rotate-180 transition-transform duration-500" strokeWidth={1.5} />
						)}
						<span className="relative">
							{resendCooldown > 0
								? t("otp.resendCooldown", { seconds: resendCooldown })
								: t("otp.resend")}
						</span>
					</button>
				</div>

				{/* ═══ WARNING BANNER ═══ */}
				<div className="w-full max-w-3xl rounded-xl sm:rounded-2xl border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-yellow-500/10 px-4 sm:px-6 py-3 sm:py-4 mt-1 sm:mt-2 overflow-hidden relative">
					{/* Decoración */}
					<span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-yellow-400/40 animate-pulse" aria-hidden="true" />
					
					<div className="flex items-start gap-2 sm:gap-3">
						<div className="p-1.5 rounded-lg bg-yellow-500/20">
							<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 shrink-0" />
						</div>
						<div className="text-left">
							<p className="text-yellow-300 font-semibold text-sm sm:text-base">
								⚠️ {t("otp.warning.title")}
							</p>
							<p className="text-yellow-200/70 text-xs sm:text-sm mt-1">
								{t("otp.warning.description")}
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
