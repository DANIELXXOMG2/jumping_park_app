"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Mail, Phone, MapPin, IdCard, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUISound } from "@/hooks";
import {
	type VisitorFormValues,
	visitorSchema,
} from "@/lib/schemas/visitor.schema";
import { useKioskStore } from "@/store/kioskStore";
import { cn } from "@/lib/utils";

export default function RegistroPage() {
	const router = useRouter();
	const visitorData = useKioskStore((state) => state.visitorData);
	const updateVisitorData = useKioskStore((state) => state.updateVisitorData);
	const setStep = useKioskStore((state) => state.setStep);

	// Hook de sonidos para feedback auditivo
	const { playClick, playSuccess, playError } = useUISound();

	// Hook de traducciones
	const { t } = useLanguage();

	const cedula = visitorData.uid ?? "";
	const hasCedula = Boolean(cedula);

	const form = useForm<VisitorFormValues>({
		resolver: zodResolver(visitorSchema),
		defaultValues: {
			fullName: visitorData.fullName ?? "",
			email: visitorData.email ?? "",
			phone: visitorData.phone ?? "",
			address: visitorData.address ?? "",
			cedula,
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = form;

	const [serverError, setServerError] = useState<string | null>(null);
	const [serverMessage, setServerMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!cedula) return;
		const currentCedula = form.getValues("cedula");
		if (currentCedula !== cedula) {
			form.setValue("cedula", cedula, { shouldDirty: false });
		}
	}, [cedula, form]);

	const onSubmit: SubmitHandler<VisitorFormValues> = async (values) => {
		setServerError(null);
		setServerMessage(null);
		try {
			const normalizedAddress = values.address?.trim()
				? values.address.trim()
				: undefined;
			updateVisitorData({
				uid: values.cedula,
				fullName: values.fullName,
				email: values.email,
				phone: values.phone,
				address: normalizedAddress,
			});

			const response = await fetch("/api/otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: values.email, cedula: values.cedula }),
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error ?? "No pudimos enviar el OTP");
			}

			// 🔊 Feedback sonoro de éxito
			playSuccess();

			setStep(2);
			setServerMessage(t("registro.success"));
			router.push("/otp");
		} catch (error) {
			// 🔊 Feedback sonoro de error
			playError();

			console.error("Error registrando visitante", error);
			setServerError(
				error instanceof Error
					? error.message
					: t("registro.error.generic"),
			);
		}
	};

	const renderError = (message?: string) =>
		message ? (
			<p className="flex items-center gap-1.5 text-sm text-red-400 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
				<AlertCircle className="w-3.5 h-3.5 shrink-0" />
				{message}
			</p>
		) : null;

	// Estilos premium para inputs del formulario de registro
	const fieldClasses = cn(
		// Base
		"kiosk-input-base",
		"w-full text-base sm:text-lg text-foreground",
		"rounded-xl sm:rounded-2xl",
		"px-4 sm:px-6 py-3 sm:py-4",
		// Placeholder
		"placeholder:text-foreground/40",
		// Fondo premium glass
		"bg-gradient-to-br from-white/8 via-white/5 to-white/8",
		"dark:from-zinc-800/80 dark:via-zinc-900/70 dark:to-zinc-800/80",
		"backdrop-blur-sm",
		// Borde
		"border-2 border-white/15 dark:border-zinc-600/40",
		// Sombra
		"shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.08)]",
		"dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.25)]",
		// Transiciones
		"transition-all duration-300 ease-out",
		// Hover
		"hover:border-primary/40 hover:bg-gradient-to-br",
		"hover:from-primary/8 hover:via-white/8 hover:to-primary/8",
		"dark:hover:from-primary/10 dark:hover:via-zinc-800/80 dark:hover:to-primary/10",
		"hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_8px_24px_rgba(46,204,113,0.12)]",
		// Focus
		"focus:outline-none focus:ring-4 focus:ring-primary/20",
		"focus:border-primary/60",
		"focus:bg-gradient-to-br focus:from-primary/12 focus:via-white/10 focus:to-primary/12",
		"dark:focus:from-primary/15 dark:focus:via-zinc-800/90 dark:focus:to-primary/15",
		"focus:shadow-[0_0_32px_rgba(46,204,113,0.15),0_12px_32px_rgba(46,204,113,0.12)]",
		// Active (móvil)
		"active:scale-[0.99]"
	);

	if (!hasCedula) {
		return (
			<section className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
				<div className="group/card relative flex w-full max-w-3xl flex-col items-center gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl overflow-hidden
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					border-2 border-white/20 dark:border-zinc-700/50
					p-6 sm:p-8 md:p-10 text-center
					shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
				>
					{/* Shimmer de fondo */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000 pointer-events-none" aria-hidden="true" />
					
					{/* Ícono de error */}
					<div className="relative mb-2">
						<div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
						<div className="relative p-4 rounded-full bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/20 border border-red-500/30">
							<IdCard className="w-10 h-10 text-red-400" strokeWidth={1.5} />
						</div>
					</div>
					
					<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-red-400 font-semibold">
						{t("registro.step")}
					</p>
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
						{t("registro.noCedula.title")}
					</h1>
					<p className="text-sm sm:text-base text-foreground/70 max-w-md">
						{t("registro.noCedula.description")}
					</p>
					<button
						type="button"
						onClick={() => {
							playClick();
							router.replace("/ingreso");
						}}
						className="group relative mt-2 overflow-hidden rounded-xl sm:rounded-2xl px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold uppercase tracking-wide
							bg-gradient-to-r from-primary via-emerald-400 to-primary
							text-zinc-900 border-2 border-white/30
							shadow-[0_8px_30px_rgba(46,204,113,0.4)]
							transition-all duration-300
							hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)] hover:scale-[1.02]
							active:scale-[0.98] flex items-center gap-2"
					>
						<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" aria-hidden="true" />
						<ArrowLeft className="relative w-5 h-5" />
						<span className="relative">{t("registro.noCedula.button")}</span>
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="group/form relative flex w-full max-w-4xl flex-col gap-5 sm:gap-6 rounded-2xl sm:rounded-3xl overflow-hidden
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					border-2 border-white/20 dark:border-zinc-700/50
					p-5 sm:p-8 md:p-10 text-left
					shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-lg"
			>
				{/* ═══ SHIMMER DE FONDO ═══ */}
				<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/form:translate-x-[100%] transition-transform duration-1000 pointer-events-none" aria-hidden="true" />
				
				{/* ═══ PARTÍCULAS DECORATIVAS ═══ */}
				<span className="absolute top-4 left-6 w-2 h-2 rounded-full bg-primary/20 animate-pulse" aria-hidden="true" />
				<span className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-purple-500/20 animate-pulse delay-150" aria-hidden="true" />
				<span className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-emerald-500/20 animate-pulse delay-300" aria-hidden="true" />
				<span className="absolute bottom-4 right-6 w-2.5 h-2.5 rounded-full bg-primary/15 animate-pulse delay-500" aria-hidden="true" />

				{/* ═══ ENCABEZADO ═══ */}
				<div className="relative space-y-2 text-center">
					{/* Badge de paso */}
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
						<UserPlus className="w-4 h-4 text-primary" strokeWidth={2} />
						<p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.4em] text-primary font-semibold">
							{t("registro.step")}
						</p>
					</div>
					
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground">
						{t("registro.heading")}
					</h1>
					<p className="text-sm sm:text-base text-foreground/70">
						{t("registro.description")}
					</p>
				</div>

				{/* ═══ CAMPOS DEL FORMULARIO ═══ */}
				<div className="relative grid gap-4 sm:gap-5 md:grid-cols-2">
					{/* Nombre completo */}
					<div className="flex flex-col gap-2">
						<label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
							<UserPlus className="w-4 h-4 text-primary/70" />
							{t("registro.form.fullName")}
						</label>
						<input
							id="fullName"
							type="text"
							className={fieldClasses}
							placeholder={t("registro.placeholder.fullName")}
							{...register("fullName")}
						/>
						{renderError(errors.fullName?.message)}
					</div>

					{/* Email */}
					<div className="flex flex-col gap-2">
						<label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
							<Mail className="w-4 h-4 text-primary/70" />
							{t("registro.form.email")}
						</label>
						<input
							id="email"
							type="email"
							className={fieldClasses}
							placeholder={t("registro.placeholder.email")}
							{...register("email")}
						/>
						{renderError(errors.email?.message)}
					</div>

					{/* Teléfono */}
					<div className="flex flex-col gap-2">
						<label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
							<Phone className="w-4 h-4 text-primary/70" />
							{t("registro.form.phone")}
						</label>
						<input
							id="phone"
							type="tel"
							className={fieldClasses}
							placeholder={t("registro.placeholder.phone")}
							{...register("phone")}
						/>
						{renderError(errors.phone?.message)}
					</div>

					{/* Dirección */}
					<div className="flex flex-col gap-2">
						<label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
							<MapPin className="w-4 h-4 text-primary/70" />
							{t("registro.form.address")}
						</label>
						<input
							id="address"
							type="text"
							className={fieldClasses}
							placeholder={t("registro.placeholder.address")}
							{...register("address")}
						/>
						{renderError(errors.address?.message)}
					</div>
				</div>

				{/* ═══ CAMPO DE CÉDULA (READONLY) ═══ */}
				<div className="relative flex flex-col gap-2">
					<label htmlFor="cedula" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
						<IdCard className="w-4 h-4 text-primary/70" />
						{t("registro.form.cedula")}
					</label>
					<input
						id="cedula"
						type="text"
						className={`${fieldClasses} cursor-not-allowed bg-zinc-800/40 dark:bg-zinc-800/60 text-foreground/60 border-dashed`}
						readOnly
						{...register("cedula")}
					/>
					{renderError(errors.cedula?.message)}
				</div>

				{/* ═══ MENSAJES DE ERROR/ÉXITO ═══ */}
				{serverError && (
					<div className="rounded-xl sm:rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg text-red-400 flex items-center gap-3">
						<AlertCircle className="w-5 h-5 shrink-0" />
						{serverError}
					</div>
				)}

				{serverMessage && !serverError && (
					<div className="rounded-xl sm:rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg text-primary flex items-center gap-3">
						<Sparkles className="w-5 h-5 shrink-0" />
						{serverMessage}
					</div>
				)}

				{/* ═══ BOTÓN DE ENVÍO ═══ */}
				<button
					type="submit"
					disabled={isSubmitting}
					className="group relative mt-2 w-full overflow-hidden rounded-xl sm:rounded-2xl py-4 sm:py-5 text-lg sm:text-xl font-bold uppercase tracking-wide
						bg-gradient-to-r from-primary via-emerald-400 to-primary
						text-zinc-900 border-2 border-white/30
						shadow-[0_8px_30px_rgba(46,204,113,0.4)]
						transition-all duration-300
						hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)] hover:scale-[1.01]
						active:scale-[0.99]
						disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed
						flex items-center justify-center gap-3"
				>
					{/* Shimmer */}
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 group-disabled:hidden" aria-hidden="true" />
					
					{/* Partículas */}
					<span className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white/60 animate-pulse group-disabled:hidden" aria-hidden="true" />
					<span className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white/50 animate-pulse delay-150 group-disabled:hidden" aria-hidden="true" />
					
					{isSubmitting ? (
						<span className="relative flex items-center gap-3">
							<Loader2 className="h-6 w-6 animate-spin" /> 
							{t("registro.saving")}
						</span>
					) : (
						<span className="relative flex items-center gap-2">
							<Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
							{t("registro.submit")}
						</span>
					)}
				</button>
			</form>
		</section>
	);
}
