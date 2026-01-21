"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertCircle,
	Calendar,
	CreditCard,
	Heart,
	Save,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
import { DOCUMENT_ID_TYPES } from "@/types/firestore";
import { cn } from "@/lib/utils";
import { EPSSelector } from "./EPSSelector";

interface MinorFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: Minor) => void;
	initialData?: Minor | null;
	minorNumber: number;
}

const defaultMinor: Minor = {
	firstName: "",
	lastName: "",
	birthDate: "",
	eps: "",
	idType: "rc", // Registro Civil por defecto (más común en menores)
	idNumber: "",
	relationship: "hijo",
	medicalCondition: "",
};

export function MinorFormModal({
	isOpen,
	onClose,
	onSave,
	initialData,
	minorNumber,
}: MinorFormModalProps) {
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
		defaultValues: initialData || defaultMinor,
	});

	// Reset form when modal opens with new data
	useEffect(() => {
		if (isOpen) {
			reset(initialData || defaultMinor);
		}
	}, [isOpen, initialData, reset]);

	const onSubmit = async (data: Minor) => {
		setIsSubmitting(true);
		try {
			onSave(data);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	// Clase base premium para inputs del modal
	const inputClass = cn(
		// Base
		"kiosk-input-base kiosk-input-premium",
		"w-full text-sm sm:text-base text-white",
		"bg-zinc-800 dark:bg-zinc-800",
		"border-2 border-zinc-600/50 rounded-xl",
		"px-3 py-3 sm:px-4 sm:py-3.5",
		// Placeholder
		"placeholder:text-zinc-500",
		// Hover
		"hover:border-emerald-500/40 hover:bg-zinc-700",
		// Focus
		"focus:border-emerald-500/60 focus:outline-none focus:ring-4 focus:ring-emerald-500/20",
		"focus:bg-zinc-700",
		"focus:shadow-[0_0_24px_rgba(46,204,113,0.15)]",
		// Active (móvil)
		"active:scale-[0.99]",
		// Transiciones
		"transition-all duration-300 ease-out",
		// Estilos para options de select
		"[&_option]:bg-zinc-800 [&_option]:text-white"
	);

	// Clase específica para selects con opciones legibles
	const selectClass = cn(
		inputClass,
		"appearance-none cursor-pointer",
		"bg-zinc-800 text-white"
	);

	// Use portal to render outside of parent form - fixes nested form issue
	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg max-h-[85vh] bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700 sticky top-0 z-10">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center">
							<User className="w-4 h-4 text-neon-green" />
						</div>
						<span className="text-sm font-semibold text-white">
							{initialData
								? `${t("minors.modal.editTitle")} #${minorNumber}`
								: `${t("minors.modal.addTitle")} #${minorNumber}`}
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
					>
						<X size={20} />
					</button>
				</div>

				{/* Form Content - Scrollable */}
				<form
					onSubmit={(e) => {
						e.stopPropagation(); // Prevent bubbling to parent consent form
						handleSubmit(onSubmit)(e);
					}}
					className="overflow-y-auto max-h-[calc(90vh-120px)]"
				>
					<div className="p-4 space-y-4">
						{/* Nombre y Apellidos */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="minorFirstName" className="flex items-center gap-1 text-xs text-white mb-1.5">
									<User size={12} />
									{t("minors.form.firstName")} *
								</label>
								<input
									id="minorFirstName"
									{...register("firstName")}
									placeholder={t("minors.form.firstName")}
									className={cn(
										inputClass,
										errors.firstName && "border-red-500",
									)}
								/>
								{errors.firstName && (
									<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
										<AlertCircle size={10} />
										{errors.firstName.message}
									</span>
								)}
							</div>

							<div>
								<label htmlFor="minorLastName" className="flex items-center gap-1 text-xs text-white mb-1.5">
									<User size={12} />
									{t("minors.form.lastName")} *
								</label>
								<input
									id="minorLastName"
									{...register("lastName")}
									placeholder={t("minors.form.lastName")}
									className={cn(
										inputClass,
										errors.lastName && "border-red-500",
									)}
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
							<label htmlFor="minorBirthDate" className="flex items-center gap-1 text-xs text-white mb-1.5">
								<Calendar size={12} />
								{t("minors.form.birthDate")} *
							</label>
							<input
								id="minorBirthDate"
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
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="minorIdType" className="flex items-center gap-1 text-xs text-white mb-1.5">
									<CreditCard size={12} />
									{t("minors.form.idType")} *
								</label>
								<select
									id="minorIdType"
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
								<label htmlFor="minorIdNumber" className="flex items-center gap-1 text-xs text-white mb-1.5">
									<CreditCard size={12} />
									{t("minors.form.idNumber")} *
								</label>
								<input
									id="minorIdNumber"
									{...register("idNumber")}
									placeholder={t("minors.form.idNumber.placeholder")}
									className={cn(
										inputClass,
										errors.idNumber && "border-red-500",
									)}
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
							<label htmlFor="minorRelationship" className="flex items-center gap-1 text-xs text-white mb-1.5">
								<Heart size={12} />
								{t("minors.form.relationship")} *
							</label>
							<select
								id="minorRelationship"
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
							<label htmlFor="minorMedicalCondition" className="flex items-center gap-1 text-xs text-zinc-300 mb-1.5">
								<Heart size={12} className="text-red-400" />
								{t("minors.form.medicalCondition")}
								<span className="text-zinc-500 ml-1">{t("minors.form.medicalCondition.optional")}</span>
							</label>
							<input
								id="minorMedicalCondition"
								{...register("medicalCondition")}
								placeholder={t("minors.form.medicalCondition.placeholder")}
								maxLength={200}
								className={cn(inputClass, "placeholder:text-zinc-500")}
							/>
							<p className="text-zinc-500 text-xs mt-1">
								{t("minors.form.medicalCondition.hint")}
							</p>
						</div>
					</div>

					{/* Footer - Fixed */}
					<div className="sticky bottom-0 px-4 py-3 bg-gray-800/95 border-t border-gray-700 backdrop-blur-sm">
						<div className="flex gap-3">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
							>
								{t("minors.cancel")}
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex-1 py-3 px-4 bg-neon-green hover:bg-green-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
							>
								<Save size={18} />
								{initialData ? t("minors.update") : t("minors.save")}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);

	// Render via portal to escape parent form context
	if (typeof document !== "undefined") {
		return createPortal(modalContent, document.body);
	}

	return null;
}
