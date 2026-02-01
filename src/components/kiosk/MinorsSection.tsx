"use client";

import {
	Baby,
	Calendar,
	ChevronDown,
	CreditCard,
	Edit3,
	Heart,
	History,
	Plus,
	Trash2,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type {
	UseFieldArrayReturn,
	UseFormGetValues,
	UseFormSetValue,
} from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUISound } from "@/hooks";
import type { DictionaryKey } from "@/lib/i18n/dictionary";
import type { ConsentFormData, Minor } from "@/lib/schemas/consent.schema";
import { calculateAge } from "@/lib/utils/dateUtils";
import { MinorFormModal } from "./MinorFormModal";
import { MinorHistoryModal } from "./MinorHistoryModal";
import { MinorInlineForm } from "./MinorInlineForm";

interface MinorsSectionProps {
	fields: UseFieldArrayReturn<ConsentFormData, "minors", "id">["fields"];
	append: UseFieldArrayReturn<ConsentFormData, "minors", "id">["append"];
	remove: UseFieldArrayReturn<ConsentFormData, "minors", "id">["remove"];
	update: UseFieldArrayReturn<ConsentFormData, "minors", "id">["update"];
	setValue: UseFormSetValue<ConsentFormData>;
	getValues: UseFormGetValues<ConsentFormData>;
	/** ID del usuario (cédula) para cargar historial de menores */
	userId?: string;
}

export function MinorsSection({
	fields,
	append,
	remove,
	update,
	getValues,
	userId,
}: MinorsSectionProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	// Estado para controlar si el usuario cerró manualmente el formulario inline
	const [wasInlineManuallyMinimized, setWasInlineManuallyMinimized] = useState(false);
	// Estado para evitar problemas de hidratación - solo renderizar después de montar en cliente
	const [hasMounted, setHasMounted] = useState(false);
	
	// Marcar como montado después del primer render en el cliente
	useEffect(() => {
		setHasMounted(true);
	}, []);
	
	// El formulario inline está minimizado si:
	// 1. Ya hay al menos un participante, O
	// 2. El usuario lo minimizó manualmente
	const isInlineMinimized = fields.length > 0 || wasInlineManuallyMinimized;

	const { playClick, playSuccess } = useUISound();
	const { t } = useLanguage();

	const handleAddMinor = useCallback(() => {
		playClick();
		setEditingIndex(null);
		setIsModalOpen(true);
	}, [playClick]);

	const handleEditMinor = useCallback(
		(index: number) => {
			playClick();
			setEditingIndex(index);
			setIsModalOpen(true);
		},
		[playClick],
	);

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false);
		setEditingIndex(null);
	}, []);

	const handleOpenHistory = useCallback(() => {
		playClick();
		setIsHistoryModalOpen(true);
	}, [playClick]);

	const handleCloseHistory = useCallback(() => {
		setIsHistoryModalOpen(false);
	}, []);

	const handleSelectFromHistory = useCallback(
		(minors: Minor[]) => {
			// Agregar todos los menores seleccionados del historial
			minors.forEach((minor) => {
				append(minor);
			});
			playSuccess();
		},
		[append, playSuccess],
	);

	const handleSaveMinor = useCallback(
		(data: Minor) => {
			if (editingIndex !== null) {
				// Editando existente
				update(editingIndex, data);
			} else {
				// Agregando nuevo
				append(data);
			}
			playSuccess();
			handleCloseModal();
		},
		[editingIndex, update, append, playSuccess, handleCloseModal],
	);

	// Handler para guardar desde el formulario inline
	const handleSaveInlineMinor = useCallback(
		(data: Minor) => {
			append(data);
			playSuccess();
			// No necesitamos setear nada porque fields.length > 0 automaticamente minimiza
		},
		[append, playSuccess],
	);

	// Handler para minimizar el formulario inline manualmente
	const handleMinimizeInline = useCallback(() => {
		setWasInlineManuallyMinimized(true);
	}, []);

	// Handler para expandir el formulario inline (mostrar mensaje vacío con botón)
	const handleExpandInline = useCallback(() => {
		playClick();
		setWasInlineManuallyMinimized(false);
	}, [playClick]);

	const handleRemoveMinor = useCallback(
		(index: number) => {
			playClick();
			remove(index);
		},
		[remove, playClick],
	);

	// Obtener IDs de menores ya agregados (para filtrar en historial)
	const alreadyAddedIds = fields
		.map((_, index) => {
			const minor = getValues(`minors.${index}`);
			return minor?.idNumber || "";
		})
		.filter(Boolean);

	// Obtener datos del menor que se está editando
	const getEditingMinorData = (): Minor | null => {
		if (editingIndex === null) return null;
		const minors = getValues("minors");
		return minors[editingIndex] || null;
	};

	// Calcular edad desde fecha de nacimiento (usa utilidad centralizada)
	const formatMinorAge = (birthDate: string): string => {
		if (!birthDate) return "";
		return `${calculateAge(birthDate)} ${t("minors.section.years")}`;
	};

	// Formatear tipo de documento
	const formatIdType = (type: string): string => {
		const key = `documentType.${type}.short` as const;
		// Fallback para tipos legacy o desconocidos
		try {
			return t(key as Parameters<typeof t>[0]);
		} catch {
			return type.toUpperCase();
		}
	};

	// Formatear parentesco
	const formatRelationship = (rel: string): string => {
		const key = `minors.relationship.${rel}` as const;
		try {
			return t(key as Parameters<typeof t>[0]);
		} catch {
			return rel;
		}
	};

	// Obtener label de EPS (ahora es texto libre)
	const getEPSDisplayLabel = (epsValue: string): string => {
		if (!epsValue) return t("minors.section.noEps");
		// Compatibilidad con datos legacy que usan prefijo "otra_manual:"
		if (epsValue.startsWith("otra_manual:")) {
			return epsValue.replace("otra_manual:", "");
		}
		return epsValue;
	};

	return (
		<section className="space-y-5">
			{/* Header con gradiente y efecto glass */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20 p-4 backdrop-blur-sm">
				{/* Efecto de brillo decorativo */}
				<div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
				<div className="absolute -bottom-10 -left-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
				
				<div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
								<Baby className="w-6 h-6 text-emerald-400 animate-bounce-jump" />
							</div>
							<div>
								<h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
									{t("minors.section.title")}
									{fields.length > 0 && (
										<span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-sm font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
											{fields.length}
										</span>
									)}
								</h2>
								<p className="text-xs text-gray-400 mt-0.5">
									{t("minors.section.tooltip")}
								</p>
							</div>
						</div>
					</div>

					{/* Botones de acción con efectos modernos */}
					<div className="flex gap-2.5 w-full sm:w-auto">
						{/* Botón de Historial */}
						{userId && (
							<button
								type="button"
								onClick={handleOpenHistory}
								className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-400 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border border-blue-500/30 hover:border-blue-400/50 flex-1 sm:flex-none justify-center shadow-lg shadow-blue-500/5 hover:shadow-blue-500/20"
							>
								<History size={18} className="group-hover:rotate-[-20deg] transition-transform duration-300" />
								<span className="hidden sm:inline">{t("minors.section.historyBtn")}</span>
							</button>
						)}

						{/* Botón de Agregar Nuevo */}
						<button
							type="button"
							onClick={handleAddMinor}
							className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-400 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border border-emerald-500/30 hover:border-emerald-400/50 flex-1 sm:flex-none justify-center shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/20"
						>
							<Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
							<span className="hidden sm:inline">{t("minors.section.addBtn")}</span> {t("minors.section.addBtnNew")}
						</button>
					</div>
				</div>
			</div>

			{/* Formulario Inline - Se muestra cuando no hay participantes y no está minimizado */}
			{/* Solo se renderiza después de montar para evitar errores de hidratación */}
			{hasMounted && fields.length === 0 && !isInlineMinimized && (
				<MinorInlineForm
					onSave={handleSaveInlineMinor}
					onMinimize={handleMinimizeInline}
					isMinimized={isInlineMinimized}
				/>
			)}

			{/* Estado vacío con botón para expandir formulario inline */}
			{/* En SSR o antes de montar, mostramos el estado vacío por defecto */}
			{((!hasMounted && fields.length === 0) || (hasMounted && fields.length === 0 && isInlineMinimized)) && (
				<div className="relative overflow-hidden text-center py-10 border-2 border-dashed border-gray-700/50 rounded-2xl bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-500">
					{/* Efecto de partículas decorativas */}
					<div className="absolute inset-0 opacity-30">
						<div className="absolute top-4 left-1/4 w-2 h-2 bg-emerald-500/40 rounded-full animate-pulse" />
						<div className="absolute top-8 right-1/3 w-1.5 h-1.5 bg-cyan-500/40 rounded-full animate-pulse delay-300" />
						<div className="absolute bottom-6 left-1/3 w-1 h-1 bg-teal-500/40 rounded-full animate-pulse delay-500" />
					</div>
					
					<div className="relative">
						<div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-700/50 border border-gray-600/30 mb-4 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-500">
							<Baby className="w-10 h-10 text-gray-500 group-hover:text-emerald-400 transition-colors duration-500" />
						</div>
						<p className="text-gray-300 font-medium">{t("minors.section.emptyTitle")}</p>
						<p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">
							{t("minors.section.emptySubtitle")}
						</p>
						<button
							type="button"
							onClick={handleExpandInline}
							className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-400 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] border border-emerald-500/30 hover:border-emerald-400/50"
						>
							<ChevronDown size={18} />
							{t("minors.inline.expand")}
						</button>
					</div>
				</div>
			)}

			{/* Lista de Participantes - Tarjetas con animaciones */}
			{fields.length > 0 && (
				<div className="space-y-3">
					{fields.map((field, index) => {
						const minor = getValues(`minors.${index}`);
						return (
							<MinorCompactCard
								key={field.id}
								index={index}
								minor={minor}
								onEdit={() => handleEditMinor(index)}
								onRemove={() => handleRemoveMinor(index)}
								calculateAge={formatMinorAge}
								formatIdType={formatIdType}
								formatRelationship={formatRelationship}
								getEPSDisplayLabel={getEPSDisplayLabel}
								t={t}
							/>
						);
					})}
				</div>
			)}

			{/* Modal de Formulario */}
			<MinorFormModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSave={handleSaveMinor}
				initialData={getEditingMinorData()}
				minorNumber={
					editingIndex !== null ? editingIndex + 1 : fields.length + 1
				}
			/>

			{/* Modal de Historial */}
			{userId && (
				<MinorHistoryModal
					isOpen={isHistoryModalOpen}
					onClose={handleCloseHistory}
					onSelectMinors={handleSelectFromHistory}
					userId={userId}
					alreadyAddedIds={alreadyAddedIds}
				/>
			)}
		</section>
	);
}

/* ========================================
   Tarjeta Compacta de Menor
======================================== */

interface MinorCompactCardProps {
	index: number;
	minor: Minor;
	onEdit: () => void;
	onRemove: () => void;
	calculateAge: (birthDate: string) => string;
	formatIdType: (type: string) => string;
	formatRelationship: (rel: string) => string;
	getEPSDisplayLabel: (eps: string) => string;
	t: (key: DictionaryKey, replacements?: Record<string, string | number>) => string;
}

function MinorCompactCard({
	index,
	minor,
	onEdit,
	onRemove,
	calculateAge,
	formatIdType,
	formatRelationship,
	getEPSDisplayLabel,
	t,
}: MinorCompactCardProps) {
	const fullName =
		`${minor.firstName} ${minor.lastName}`.trim() || t("minors.section.noName");
	const age = calculateAge(minor.birthDate);
	const docInfo = minor.idNumber
		? `${formatIdType(minor.idType)} ${minor.idNumber}`
		: t("minors.section.noDoc");
	const relationship = formatRelationship(minor.relationship);
	const eps = getEPSDisplayLabel(minor.eps);
	const hasMedicalCondition =
		minor.medicalCondition && minor.medicalCondition.trim().length > 0;

	return (
		<div className="group relative overflow-hidden bg-gradient-to-r from-gray-900/90 via-gray-800/80 to-gray-900/90 border border-gray-700/50 rounded-2xl hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
			{/* Efecto de brillo al hover */}
			<div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
			
			{/* Línea de acento lateral */}
			<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
			
			<div className="relative flex items-center gap-4 p-4 pl-5">
				{/* Avatar/Número con gradiente */}
				<div className="relative">
					<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300">
						<span className="text-emerald-400 font-bold text-lg">{index + 1}</span>
					</div>
					{hasMedicalCondition && (
						<div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center" title={t("minors.section.hasMedicalCondition")}>
							<Heart size={10} className="text-red-400 fill-red-400" />
						</div>
					)}
				</div>

				{/* Info Principal */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<h3 className="text-white font-semibold text-base truncate group-hover:text-emerald-200 transition-colors duration-300">
							{fullName}
						</h3>
					</div>
					
					{/* Info Pills */}
					<div className="flex flex-wrap items-center gap-2 mt-2">
						{age && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50">
								<Calendar size={11} className="text-emerald-400" />
								{age}
							</span>
						)}
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50">
							<CreditCard size={11} className="text-cyan-400" />
							{docInfo}
						</span>
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50">
							<User size={11} className="text-blue-400" />
							{relationship}
						</span>
					</div>
					
					{/* EPS Info */}
					<p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
						<span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500/60" />
						EPS: <span className="text-gray-400">{eps}</span>
					</p>
				</div>

				{/* Acciones con efectos hover */}
				<div className="flex items-center gap-1.5 shrink-0">
					<button
						type="button"
						onClick={onEdit}
						className="p-2.5 text-gray-400 hover:text-blue-400 bg-transparent hover:bg-blue-500/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 border border-transparent hover:border-blue-500/30"
						title={t("minors.section.editTooltip")}
					>
						<Edit3 size={17} />
					</button>
					<button
						type="button"
						onClick={onRemove}
						className="p-2.5 text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-500/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 border border-transparent hover:border-red-500/30"
						title={t("minors.section.removeTooltip")}
					>
						<Trash2 size={17} />
					</button>
				</div>
			</div>
		</div>
	);
}
