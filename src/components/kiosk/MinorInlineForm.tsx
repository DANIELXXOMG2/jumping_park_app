"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Calendar,
	ChevronUp,
	CreditCard,
	Heart,
	Save,
	Sparkles,
	User,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
import { DOCUMENT_ID_TYPES } from "@/types/firestore";
import { cn } from "@/lib/utils";
import { EPSSelector } from "./EPSSelector";

interface MinorInlineFormProps {
	onSave: (data: Minor) => void;
	onMinimize: () => void;
	isMinimized: boolean;
}

const defaultMinor: Minor = {
	firstName: "",
	lastName: "",
	birthDate: "",
	eps: "",
	idType: "rc",
	idNumber: "",
	relationship: "hijo",
	medicalCondition: "",
};

export function MinorInlineForm({
	onSave,
	onMinimize,
	isMinimized,
}: MinorInlineFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { t } = useLanguage();

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<Minor>({
		resolver: zodResolver(minorSchema),
		defaultValues: defaultMinor,
	});

	const onSubmit = async (data: Minor) => {
		setIsSubmitting(true);
		try {
			onSave(data);
			reset(defaultMinor);
			onMinimize();
		} finally {
			setIsSubmitting(false);
		}
	};

	// Clase base premium para inputs
	const inputClass = cn(
		"kiosk-input-base kiosk-input-premium",
		"w-full text-sm sm:text-base",
		"bg-zinc-800 dark:bg-zinc-800",
		"text-white dark:text-white",
		"border-2 border-zinc-600/50 rounded-xl",
		"px-3 py-3 sm:px-4 sm:py-3.5",
		"placeholder:text-zinc-500",
		"hover:border-emerald-500/40 hover:bg-zinc-700",
		"focus:border-emerald-500/60 focus:outline-none focus:ring-4 focus:ring-emerald-500/20",
		"focus:bg-zinc-700",
		"focus:shadow-[0_0_24px_rgba(46,204,113,0.15)]",
		"active:scale-[0.99]",
		"transition-all duration-300 ease-out",
		// Estilos para options de select (evitar texto blanco sobre fondo blanco)
		"[&_option]:bg-zinc-800 [&_option]:text-white"
	);

	// Clase específica para selects con opciones legibles
	const selectClass = cn(
		inputClass,
		"appearance-none cursor-pointer",
		"bg-zinc-800 text-white"
	);

	// Si está minimizado, no renderizar nada
	if (isMinimized) {
		return null;
	}

	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10 backdrop-blur-sm">
			{/* Efectos decorativos */}
			<div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute -bottom-20 -left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
			
			{/* Header */}
			<div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-b border-emerald-500/20">
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
						<User className="w-5 h-5 text-emerald-400" />
					</div>
					<div>
						<h3 className="text-base font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
							{t("minors.inline.title")}
							<Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
						</h3>
						<p className="text-xs text-gray-400">
							{t("minors.inline.subtitle")}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onMinimize}
					className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
					title={t("minors.inline.minimize")}
				>
					<ChevronUp size={20} />
				</button>
			</div>

			{/* Form Content - Usamos div en lugar de form para evitar formularios anidados */}
			<div className="relative p-4 space-y-4">
				{/* Nombre y Apellidos */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label htmlFor="inlineFirstName" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
							<User size={12} />
							{t("minors.form.firstName")} *
						</label>
						<input
							id="inlineFirstName"
							{...register("firstName")}
							placeholder={t("minors.form.firstName")}
							className={cn(inputClass, errors.firstName && "border-red-500")}
						/>
						{errors.firstName && (
							<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<AlertCircle size={10} />
								{errors.firstName.message}
							</span>
						)}
					</div>

					<div>
						<label htmlFor="inlineLastName" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
							<User size={12} />
							{t("minors.form.lastName")} *
						</label>
						<input
							id="inlineLastName"
							{...register("lastName")}
							placeholder={t("minors.form.lastName")}
							className={cn(inputClass, errors.lastName && "border-red-500")}
						/>
						{errors.lastName && (
							<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<AlertCircle size={10} />
								{errors.lastName.message}
							</span>
						)}
					</div>
				</div>

				{/* Fecha de Nacimiento */}
				<div>
					<label htmlFor="inlineBirthDate" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
						<Calendar size={12} />
						{t("minors.form.birthDate")} *
					</label>
					<input
						id="inlineBirthDate"
						type="date"
						{...register("birthDate")}
						className={cn(inputClass, errors.birthDate && "border-red-500")}
					/>
					{errors.birthDate && (
						<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
							<AlertCircle size={10} />
							{errors.birthDate.message}
						</span>
					)}
				</div>

				{/* EPS */}
				<div>
					<Controller
						name="eps"
						control={control}
						render={({ field }) => (
							<EPSSelector
								value={field.value}
								onChange={field.onChange}
								error={errors.eps?.message}
							/>
						)}
					/>
				</div>

				{/* Tipo ID y Número */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label htmlFor="inlineIdType" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
							<CreditCard size={12} />
							{t("minors.form.idType")} *
						</label>
						<select
							id="inlineIdType"
							{...register("idType")}
							className={selectClass}
						>
							{DOCUMENT_ID_TYPES.map((type) => (
								<option key={type} value={type}>
									{t(`documentType.${type}.desc`)}
								</option>
							))}
						</select>
					</div>

					<div>
						<label htmlFor="inlineIdNumber" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
							<CreditCard size={12} />
							{t("minors.form.idNumber")} *
						</label>
						<input
							id="inlineIdNumber"
							{...register("idNumber")}
							placeholder={t("minors.form.idNumber.placeholder")}
							className={cn(inputClass, errors.idNumber && "border-red-500")}
						/>
						{errors.idNumber && (
							<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
								<AlertCircle size={10} />
								{errors.idNumber.message}
							</span>
						)}
					</div>
				</div>

				{/* Parentesco */}
				<div>
					<label htmlFor="inlineRelationship" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
						<Heart size={12} />
						{t("minors.form.relationship")} *
					</label>
					<select
						id="inlineRelationship"
						{...register("relationship")}
						className={selectClass}
					>
						<option value="hijo">{t("minors.relationship.hijo")}</option>
						<option value="sobrino">{t("minors.relationship.sobrino")}</option>
						<option value="nieto">{t("minors.relationship.nieto")}</option>
						<option value="otro">{t("minors.relationship.otro")}</option>
					</select>
				</div>

				{/* Condición Médica */}
				<div>
					<label htmlFor="inlineMedicalCondition" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
						<Heart size={12} className="text-red-400" />
						{t("minors.form.medicalCondition")}
						<span className="text-gray-600 ml-1">{t("minors.form.medicalCondition.optional")}</span>
					</label>
					<input
						id="inlineMedicalCondition"
						{...register("medicalCondition")}
						placeholder={t("minors.form.medicalCondition.placeholder")}
						maxLength={200}
						className={cn(inputClass, "placeholder:text-gray-600")}
					/>
					<p className="text-gray-600 text-xs mt-1">
						{t("minors.form.medicalCondition.hint")}
					</p>
				</div>

				{/* Botón de Guardar - type="button" para evitar submit del form padre */}
				<button
					type="button"
					onClick={() => handleSubmit(onSubmit)()}
					disabled={isSubmitting}
					className="group relative w-full py-3.5 overflow-hidden
						bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500
						text-white font-bold text-base rounded-xl
						border border-emerald-400/50
						shadow-[0_6px_25px_rgba(46,204,113,0.35)]
						transition-all duration-300
						hover:shadow-[0_10px_35px_rgba(46,204,113,0.45)] hover:scale-[1.01]
						active:scale-[0.99]
						disabled:opacity-50 disabled:cursor-not-allowed
						flex items-center justify-center gap-2"
				>
					{/* Shimmer */}
					<span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
					
					<Save size={18} className="relative" />
					<span className="relative">
						{isSubmitting ? t("minors.inline.saving") : t("minors.inline.saveButton")}
					</span>
				</button>
			</div>
		</div>
	);
}
