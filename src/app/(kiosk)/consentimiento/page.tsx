"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	FileText,
	Maximize2,
	PenTool,
	Sparkles,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConsentContent } from "@/components/kiosk/ConsentContent";
import { ConsentReadingModal } from "@/components/kiosk/ConsentReadingModal";
import { MinorsSection } from "@/components/kiosk/MinorsSection";
import SignaturePad, {
	type SignaturePadRef,
} from "@/components/kiosk/SignaturePad";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHydrationSafeHardeningFlag } from "@/lib/hardeningClient";
import { HARDENING_FLAG } from "@/lib/hardeningPolicy";
import { createLogger } from "@/lib/logger";
import {
	buildConsentSubmissionPayload,
	CONSENT_POLICY_VERSION,
} from "@/lib/offline/consentPayload";
import { createConsentDedupeKey } from "@/lib/offline/idempotency";
import {
	createOfflineQueueItem,
	upsertOfflineQueueItem,
} from "@/lib/offline/queue";
import {
	readOfflineConsentQueue,
	writeOfflineConsentQueue,
} from "@/lib/offline/storage";
import { syncOfflineConsentQueue } from "@/lib/offline/sync";
import {
	type ConsentFormData,
	getConsentSchema,
} from "@/lib/schemas/consent.schema";
import { useKioskStore } from "@/store/kioskStore";

const logger = createLogger("ConsentPage");

export default function ConsentPage() {
	const router = useRouter();
	const { visitorData, offline, setOfflineRuntime } = useKioskStore();
	const { t, language } = useLanguage();
	const offlineQueueEnabled = useHydrationSafeHardeningFlag(
		HARDENING_FLAG.OFFLINE_QUEUE,
	);
	const openReadingModalButtonRef = useRef<HTMLButtonElement>(null);
	const signatureRef = useRef<SignaturePadRef>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);

	const {
		register,
		control,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<ConsentFormData>({
		resolver: zodResolver(getConsentSchema(language)),
		defaultValues: {
			acceptedPolicy: false,
			minors: [],
			signature: "",
		},
		mode: "onChange",
	});

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "minors",
	});

	useEffect(() => {
		if (!visitorData.uid) {
			// If no user data, redirect to start
			router.push("/ingreso");
		}
	}, [visitorData.uid, router]);

	const queueConsentLocally = async (
		payload: ReturnType<typeof buildConsentSubmissionPayload>,
		dedupeKey: string | undefined,
		createdAt: string,
	) => {
		const queueItemId = dedupeKey ?? crypto.randomUUID();
		const nextQueue = upsertOfflineQueueItem(
			await readOfflineConsentQueue(),
			createOfflineQueueItem({
				id: queueItemId,
				kind: "consent.create",
				dedupeKey: dedupeKey ?? queueItemId,
				payload,
				createdAt,
			}),
		);

		await writeOfflineConsentQueue(nextQueue);
		setOfflineRuntime({ queueSize: nextQueue.length });
	};

	const handleSign = async (data: ConsentFormData) => {
		if (signatureRef.current?.isEmpty()) {
			toast.error(t("consentPage.signatureRequired"), {
				description: t("consentPage.signatureRequiredDesc"),
			});
			return;
		}

		const signatureBase64 = signatureRef.current?.toDataURL();
		if (!signatureBase64) return;

		setIsSubmitting(true);
		const signedAtLocal = new Date().toISOString();
		const offlineSync =
			offlineQueueEnabled && visitorData.uid
				? {
						dedupeKey: createConsentDedupeKey({
							userId: visitorData.uid,
							policyVersion: CONSENT_POLICY_VERSION,
							signedAtLocal,
						}),
						policyVersion: CONSENT_POLICY_VERSION,
						signedAtLocal,
					}
				: undefined;
		const payload = buildConsentSubmissionPayload({
			formData: data,
			visitorData,
			signatureBase64,
			offlineSync,
		});

		try {
			if (
				offlineQueueEnabled &&
				typeof navigator !== "undefined" &&
				!navigator.onLine
			) {
				await queueConsentLocally(
					payload,
					offlineSync?.dedupeKey,
					signedAtLocal,
				);

				toast.success("Consentimiento guardado sin conexion", {
					description: "Lo enviaremos automaticamente cuando vuelva internet",
				});

				const nombreEncoded = encodeURIComponent(
					visitorData.fullName || t("consentPage.guest"),
				);
				router.push(`/exito?offline=1&nombre=${nombreEncoded}`);
				return;
			}

			const response = await fetch("/api/consentimientos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || t("consentPage.errorDesc"));
			}

			// Toast de éxito breve
			toast.success(t("consentPage.successTitle"), {
				description: `${t("consentPage.successConsecutivo")} #${result.consecutivo}`,
			});

			// Redirigir a la página de éxito con los parámetros
			const nombreEncoded = encodeURIComponent(
				visitorData.fullName || t("consentPage.guest"),
			);
			router.push(
				`/exito?consecutivo=${result.consecutivo}&nombre=${nombreEncoded}`,
			);
		} catch (error) {
			logger.error("Error submitting consent", error);

			if (offlineQueueEnabled) {
				const message = error instanceof Error ? error.message : "";
				const shouldQueueFallback =
					typeof navigator !== "undefined" &&
					(!navigator.onLine || message.includes("Failed to fetch"));

				if (shouldQueueFallback) {
					await queueConsentLocally(
						payload,
						offlineSync?.dedupeKey,
						signedAtLocal,
					);
					toast.success("Consentimiento guardado para reintento", {
						description:
							"No se perdio el registro. Lo sincronizaremos cuando vuelva la conexion.",
					});
					const nombreEncoded = encodeURIComponent(
						visitorData.fullName || t("consentPage.guest"),
					);
					router.push(`/exito?offline=1&nombre=${nombreEncoded}`);
					return;
				}
			}

			toast.error(t("consentPage.errorTitle"), {
				description: t("consentPage.errorDesc"),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSignatureEnd = () => {
		if (signatureRef.current && !signatureRef.current.isEmpty()) {
			setValue("signature", "signed", { shouldValidate: true });
		}
	};

	const handleCloseReadingModal = () => {
		setIsReadingModalOpen(false);
		window.setTimeout(() => {
			openReadingModalButtonRef.current?.focus();
		}, 450);
	};

	return (
		<main
			className="mx-auto flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-background/90 px-4 py-6 text-foreground sm:max-w-4xl sm:px-6 sm:py-8"
			aria-labelledby="consentimiento-title"
		>
			{/* ═══ HEADER PREMIUM ═══ */}
			<header className="relative mb-6 sm:mb-8">
				{/* Badge decorativo */}
				<div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
					<FileText className="w-4 h-4 text-primary" strokeWidth={2} />
					<p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary font-semibold">
						{t("consentPage.title")}
					</p>
				</div>

				<h1
					id="consentimiento-title"
					className="mb-4 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl"
				>
					{t("consentPage.title")}
				</h1>

				{/* Tarjeta del responsable */}
				<div
					className="group/card relative overflow-hidden rounded-xl sm:rounded-2xl
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					border-2 border-white/20 dark:border-zinc-700/50
					p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-lg"
				>
					{/* Shimmer */}
					<div
						className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000 pointer-events-none"
						aria-hidden="true"
					/>

					<div className="relative flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 border border-primary/30">
							<Users className="w-5 h-5 text-primary" strokeWidth={2} />
						</div>
						<div>
							<p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground/60 font-medium mb-0.5">
								{t("consentPage.responsible")}
							</p>
							<p className="text-lg sm:text-xl font-semibold text-foreground">
								{visitorData.fullName || t("consentPage.guest")}
								<span className="text-foreground/50 text-sm ml-2">
									({visitorData.uid})
								</span>
							</p>
						</div>
					</div>
				</div>
			</header>

			<form
				onSubmit={handleSubmit(handleSign)}
				aria-describedby="consentimiento-feedback"
				className="flex-1 flex flex-col gap-6 sm:gap-8"
				aria-label={t("consentPage.title")}
			>
				{offlineQueueEnabled && (
					<section className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-foreground/80">
						<p>
							{offline.isOnline
								? offline.queueSize > 0
									? `Hay ${offline.queueSize} consentimiento(s) pendientes de sincronizar.`
									: "Modo offline listo: shell y sesion disponibles para reintentos."
								: "Sin conexion: guardaremos este consentimiento localmente y lo enviaremos despues."}
						</p>
						{offline.lastSyncError && (
							<p className="mt-2 text-xs text-amber-300">
								Ultimo error: {offline.lastSyncError}
							</p>
						)}
						{offline.lastRejectedError && (
							<p className="mt-2 text-xs text-amber-200">
								Ultimo rechazo permanente: {offline.lastRejectedError}
							</p>
						)}
						{offline.queueSize > 0 &&
							offline.isOnline &&
							!offline.isSyncing && (
								<button
									type="button"
									onClick={() => {
										void syncOfflineConsentQueue({
											force: true,
											beforeSync: () =>
												setOfflineRuntime({
													isSyncing: true,
													lastRejectedError: undefined,
													lastSyncError: undefined,
												}),
											afterSync: (result) => {
												const now = new Date().toISOString();
												setOfflineRuntime({
													isSyncing: false,
													queueSize: result.remaining,
													lastRejectedAt: result.rejected
														? now
														: offline.lastRejectedAt,
													lastRejectedError: result.lastRejectedError,
													lastSyncAt:
														result.synced > 0 || result.rejected
															? now
															: offline.lastSyncAt,
													lastSyncError: result.lastError,
												});
											},
										});
									}}
									className="mt-3 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary"
								>
									Reintentar ahora
								</button>
							)}
					</section>
				)}

				<output
					id="consentimiento-feedback"
					className="sr-only"
					aria-live="polite"
				>
					{errors.acceptedPolicy?.message ??
						errors.signature?.message ??
						(isSubmitting ? t("consentPage.processing") : "")}
				</output>

				{/* ═══ CAJA DE TÉRMINOS PREMIUM ═══ */}
				<section
					className="group/terms relative flex-1 min-h-[200px] overflow-hidden rounded-xl sm:rounded-2xl
						bg-gradient-to-br from-white via-gray-50 to-white
						dark:from-zinc-100 dark:via-zinc-50 dark:to-zinc-100
						text-zinc-800 p-5 sm:p-6 overflow-y-auto max-h-[400px] 
						shadow-[inset_0_2px_15px_rgba(0,0,0,0.1),0_10px_40px_rgba(0,0,0,0.2)]
						border-2 border-white/50 dark:border-zinc-300/50"
					aria-label={t("consentPage.termsBoxAria")}
				>
					{/* Botón de expandir premium */}
					<button
						ref={openReadingModalButtonRef}
						type="button"
						onClick={() => setIsReadingModalOpen(true)}
						className="group absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 overflow-hidden
							bg-gradient-to-r from-primary via-emerald-400 to-primary
							text-zinc-900 text-sm font-semibold rounded-xl
							shadow-[0_4px_15px_rgba(46,204,113,0.3)]
							transition-all duration-300
							hover:shadow-[0_6px_20px_rgba(46,204,113,0.4)] hover:scale-[1.02]
							active:scale-[0.98]"
						aria-label={t("consentPage.expandButtonAria")}
					>
						<span
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"
							aria-hidden="true"
						/>
						<Maximize2 size={18} className="relative" />
						<span className="relative hidden sm:inline">
							{t("consentPage.expandButton")}
						</span>
					</button>

					{/* Contenido del consentimiento */}
					<div className="text-sm leading-relaxed pt-12 sm:pt-0">
						<ConsentContent variant="compact" />
					</div>
				</section>

				{/* ═══ CHECKBOX PREMIUM ═══ */}
				<div
					className="group/check relative overflow-hidden flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl
					bg-gradient-to-br from-white/10 via-white/5 to-white/10
					dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/90
					border-2 border-white/20 dark:border-zinc-700/50
					shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-lg
					transition-all duration-300 hover:border-primary/30"
				>
					{/* Shimmer */}
					<div
						className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover/check:translate-x-[100%] transition-transform duration-1000 pointer-events-none"
						aria-hidden="true"
					/>

					<input
						type="checkbox"
						id="acceptedPolicy"
						{...register("acceptedPolicy")}
						className="relative mt-1 w-6 h-6 rounded-lg border-2 border-primary/50 text-primary focus:ring-primary/30 focus:ring-4 bg-white/10 cursor-pointer transition-all duration-300 checked:bg-primary checked:border-primary"
						aria-label={t("consentPage.checkboxAria")}
					/>
					<label
						htmlFor="acceptedPolicy"
						className="relative text-sm sm:text-base cursor-pointer select-none text-foreground/90 leading-relaxed"
					>
						{t("consentPage.acceptTerms")}
					</label>
				</div>
				{errors.acceptedPolicy && (
					<p
						role="alert"
						aria-live="assertive"
						className="-mt-4 ml-1 flex items-center gap-2 text-sm text-red-400"
					>
						<AlertCircle size={16} /> {errors.acceptedPolicy.message}
					</p>
				)}

				{/* ═══ SECCIÓN DE MENORES ═══ */}
				<MinorsSection
					fields={fields}
					append={append}
					remove={remove}
					update={update}
					setValue={setValue}
					getValues={getValues}
					userId={visitorData.uid}
				/>

				{/* ═══ SECCIÓN DE FIRMA PREMIUM ═══ */}
				<section
					className="relative mt-2 sm:mt-4"
					aria-label={t("consentPage.signaturePadAria")}
				>
					{/* Header de sección */}
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/20 border border-purple-500/30">
							<PenTool className="w-5 h-5 text-purple-400" strokeWidth={2} />
						</div>
						<h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
							{t("consentPage.digitalSignature")}
						</h2>
					</div>

					{/* Contenedor del SignaturePad con estilo premium */}
					<div
						className="relative overflow-hidden rounded-xl sm:rounded-2xl
						border-2 border-white/20 dark:border-zinc-700/50
						shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
					>
						<SignaturePad ref={signatureRef} onEnd={handleSignatureEnd} />
					</div>

					{errors.signature && (
						<p
							role="alert"
							aria-live="assertive"
							className="mt-3 flex items-center gap-2 text-sm text-red-400"
						>
							<AlertCircle size={16} /> {errors.signature.message}
						</p>
					)}
				</section>

				{isSubmitting && (
					<output aria-live="polite" className="sr-only">
						{t("consentPage.processing")}
					</output>
				)}

				{/* ═══ BOTÓN DE ENVÍO PREMIUM ═══ */}
				<button
					type="submit"
					disabled={isSubmitting}
					className="group relative w-full overflow-hidden mt-2 py-4 sm:py-5
						bg-gradient-to-r from-primary via-emerald-400 to-primary
						text-zinc-900 font-bold text-lg sm:text-xl rounded-xl sm:rounded-2xl
						border-2 border-white/30
						shadow-[0_8px_30px_rgba(46,204,113,0.4)]
						transition-all duration-300
						hover:shadow-[0_12px_40px_rgba(46,204,113,0.5)] hover:scale-[1.01]
						active:scale-[0.99]
						disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed
						flex justify-center items-center gap-3"
					aria-label={
						isSubmitting
							? t("consentPage.processing")
							: t("consentPage.submitButton")
					}
				>
					{/* Shimmer */}
					<span
						className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 group-disabled:hidden pointer-events-none"
						aria-hidden="true"
					/>

					{/* Partículas decorativas */}
					<span
						className="absolute top-2 left-4 w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white/60 animate-pulse group-disabled:hidden"
						aria-hidden="true"
					/>
					<span
						className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white/50 animate-pulse delay-150 group-disabled:hidden"
						aria-hidden="true"
					/>

					{isSubmitting ? (
						<span className="relative">{t("consentPage.processing")}</span>
					) : (
						<span className="relative flex items-center gap-2">
							{t("consentPage.submitButton")}
							<Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
						</span>
					)}
				</button>
			</form>

			{/* Modal de Lectura Inmersiva */}
			<ConsentReadingModal
				isOpen={isReadingModalOpen}
				onClose={handleCloseReadingModal}
			>
				<ConsentContent variant="expanded" />
			</ConsentReadingModal>
		</main>
	);
}
