"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	CreditCard,
	History,
	Loader2,
	User,
	UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Minor } from "@/lib/schemas/consent.schema";
import { cn } from "@/lib/utils";
import { MinorModalBase } from "./MinorModalBase";

interface HistoricalMinor {
	firstName: string;
	lastName: string;
	birthDate: string;
	relationship: string;
	eps?: string;
	idType?: string;
	idNumber: string;
	medicalCondition?: string;
	lastUsed?: string;
}

interface MinorHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectMinors: (minors: Minor[]) => void;
	userId: string;
	/** IDs de menores ya agregados al consentimiento actual */
	alreadyAddedIds: string[];
}

export function MinorHistoryModal({
	isOpen,
	onClose,
	onSelectMinors,
	userId,
	alreadyAddedIds,
}: MinorHistoryModalProps) {
	const { t, language } = useLanguage();
	const [historicalMinors, setHistoricalMinors] = useState<HistoricalMinor[]>(
		[],
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchHistoricalMinors = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Usar cache: 'no-store' para evitar problemas con el Service Worker
			const response = await fetch(`/api/usuarios/${userId}/menores`, {
				cache: 'no-store',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				
				// Manejar error 401 de forma especial
				if (response.status === 401) {
					throw new Error("La sesión ha expirado. Por favor, vuelve a verificar tu identidad.");
				}
				
				throw new Error(data.error || `Error del servidor (${response.status})`);
			}
			
			const data = await response.json();
			setHistoricalMinors(data.minors || []);
		} catch (err) {
			console.error("[MinorHistoryModal] Error:", err);
			
			// Detectar errores de red específicos
			if (err instanceof TypeError && err.message === 'Failed to fetch') {
				setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
			} else {
				setError(err instanceof Error ? err.message : "Error al cargar historial");
			}
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	// Fetch historical minors when modal opens
	useEffect(() => {
		if (isOpen && userId) {
			fetchHistoricalMinors();
		}
	}, [isOpen, userId, fetchHistoricalMinors]);

	// Reset selection when modal closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedIds(new Set());
		}
	}, [isOpen]);

	const toggleSelection = useCallback((idNumber: string) => {
		setSelectedIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(idNumber)) {
				newSet.delete(idNumber);
			} else {
				newSet.add(idNumber);
			}
			return newSet;
		});
	}, []);

	const handleConfirm = () => {
		const selectedMinors = historicalMinors
			.filter((m) => selectedIds.has(m.idNumber))
			.map((m) => ({
				firstName: m.firstName,
				lastName: m.lastName,
				birthDate: m.birthDate,
				relationship: m.relationship as Minor["relationship"],
				eps: m.eps || "",
				idType: (m.idType || "ti") as Minor["idType"],
				idNumber: m.idNumber,
				medicalCondition: m.medicalCondition,
			}));

		onSelectMinors(selectedMinors);
		onClose();
	};

	// Calcular edad desde fecha de nacimiento
	const calculateAge = (birthDate: string): string => {
		if (!birthDate) return "";
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return `${age} ${t("minors.section.years")}`;
	};

	// Formatear tipo de documento
	const formatIdType = (type: string): string => {
		const types: Record<string, string> = {
			ti: "T.I.",
			cc: "C.C.",
			passport: "Pasaporte",
			otro: "Otro",
		};
		return types[type] || type;
	};

	// Obtener label de EPS (ahora es texto libre)
	const getEPSDisplayLabel = (epsValue?: string): string => {
		if (!epsValue) return t("minors.section.noEps");
		// Compatibilidad con datos legacy que usan prefijo "otra_manual:"
		if (epsValue.startsWith("otra_manual:")) {
			return epsValue.replace("otra_manual:", "");
		}
		return epsValue;
	};

	// Formatear última visita
	const formatLastUsed = (dateStr?: string): string => {
		if (!dateStr) return t("minors.history.noRecord");
		const date = new Date(dateStr);
		const locale = language === "en" ? "en-US" : "es-CO";
		return `${t("minors.history.lastVisit")} ${date.toLocaleDateString(locale, {
			day: "numeric",
			month: "short",
			year: "numeric",
		})}`;
	};

	// Filtrar menores que no están ya agregados
	const availableMinors = historicalMinors.filter(
		(m) => !alreadyAddedIds.includes(m.idNumber),
	);

	const footer = availableMinors.length > 0 ? (
		<div className="flex gap-3">
			<button
				type="button"
				onClick={onClose}
				className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
			>
				{t("minors.cancel")}
			</button>
			<button
				type="button"
				onClick={handleConfirm}
				disabled={selectedIds.size === 0}
				className={cn(
					"flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
					selectedIds.size > 0
						? "bg-neon-green hover:bg-green-500 text-black"
						: "bg-gray-700 text-gray-500 cursor-not-allowed",
				)}
			>
				<CheckCircle2 size={18} />
				{t("minors.history.addCount")} ({selectedIds.size})
			</button>
		</div>
	) : undefined;

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-gray-400">
					<Loader2 className="w-8 h-8 animate-spin mb-3" />
					<p>{t("minors.history.loading")}</p>
				</div>
			);
		}

		if (error) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-red-400">
					<AlertCircle className="w-8 h-8 mb-3" />
					<p>{error}</p>
					<button
						type="button"
						onClick={fetchHistoricalMinors}
						className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
					>
						{t("minors.history.retry")}
					</button>
				</div>
			);
		}

		if (availableMinors.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-12 text-gray-400">
					<UserPlus className="w-12 h-12 mb-3 opacity-50" />
					<p className="text-center">
						{historicalMinors.length > 0
							? t("minors.history.allAdded")
							: t("minors.history.empty")}
					</p>
					<p className="text-xs text-gray-500 mt-2 text-center">
						{t("minors.history.useAddNew")}
					</p>
				</div>
			);
		}

		return (
			<div className="space-y-3">
				<p className="text-xs text-gray-400 mb-4">
					{t("minors.history.selectPrompt")}
				</p>

				{availableMinors.map((minor) => {
					const isSelected = selectedIds.has(minor.idNumber);

					return (
						<button
							key={minor.idNumber}
							type="button"
							onClick={() => toggleSelection(minor.idNumber)}
							className={cn(
								"w-full p-4 rounded-xl border-2 transition-all text-left",
								isSelected
									? "border-neon-green bg-neon-green/10"
									: "border-gray-700 bg-gray-800/50 hover:border-gray-600",
							)}
						>
							<div className="flex items-start gap-3">
								{/* Checkbox visual */}
								<div
									className={cn(
										"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
										isSelected
											? "bg-neon-green text-black"
											: "bg-gray-700 border border-gray-600",
									)}
								>
									{isSelected && <CheckCircle2 size={16} />}
								</div>

								{/* Info del menor */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1.5">
										<User size={14} className="text-neon-green" />
										<span className="font-semibold text-white truncate">
											{minor.firstName} {minor.lastName}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
										<div className="flex items-center gap-1.5 text-gray-200">
											<Calendar size={12} className="text-neon-blue" />
											<span>{calculateAge(minor.birthDate)}</span>
										</div>
										<div className="flex items-center gap-1.5 text-gray-200">
											<CreditCard size={12} className="text-neon-pink" />
											<span>
												{formatIdType(minor.idType || "ti")}{" "}
												{minor.idNumber}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2 mt-2.5 text-xs">
										<span className="px-2 py-0.5 bg-neon-blue/20 border border-neon-blue/30 rounded text-neon-blue">
											{getEPSDisplayLabel(minor.eps)}
										</span>
										<span className="text-gray-400">
											{formatLastUsed(minor.lastUsed)}
										</span>
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>
		);
	};

	return (
		<MinorModalBase
			isOpen={isOpen}
			onClose={onClose}
			title={t("minors.history.title")}
			subtitle={t("minors.history.subtitle")}
			icon={<History className="w-4 h-4 text-neon-blue" />}
			iconBgClass="bg-neon-blue/20"
			footer={footer}
		>
			<div className="p-4">
				{renderContent()}
			</div>
		</MinorModalBase>
	);
}
