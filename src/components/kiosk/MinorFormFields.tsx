"use client";

import { AlertCircle, Calendar, CreditCard, Heart, User } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Minor } from "@/lib/schemas/consent.schema";
import { cn } from "@/lib/utils";
import { DOCUMENT_ID_TYPES } from "@/types/firestore";
import { KioskInput } from "./KioskInput";

interface MinorFormFieldsProps {
	/** Función register de react-hook-form */
	register: UseFormRegister<Minor>;
	/** Objeto de errores de react-hook-form */
	errors: FieldErrors<Minor>;
	/** Prefijo único para IDs de inputs (evitar colisiones en DOM) */
	idPrefix?: string;
	/** Color del texto de labels */
	labelColorClass?: string;
}

/**
 * Campos reutilizables para el formulario de menores.
 * Se usa tanto en MinorInlineForm como en MinorFormModal.
 *
 * Beneficios:
 * - DRY: Un solo lugar para mantener los campos
 * - Consistencia: Mismo diseño en creación y edición
 * - Facilidad de testing: Componente puro y aislado
 */
export function MinorFormFields({
	register,
	errors,
	idPrefix = "minor",
	labelColorClass = "text-zinc-400",
}: MinorFormFieldsProps) {
	const { t } = useLanguage();

	// Clase base para selects (KioskInput no soporta selects directamente)
	const selectClass = cn(
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
		"appearance-none cursor-pointer",
		"[&_option]:bg-zinc-800 [&_option]:text-white",
	);

	return (
		<>
			{/* Nombre y Apellidos */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div>
					<label
						htmlFor={`${idPrefix}FirstName`}
						className={cn(
							"flex items-center gap-1 text-xs mb-1.5",
							labelColorClass,
						)}
					>
						<User size={12} />
						{t("minors.form.firstName")} *
					</label>
					<KioskInput
						id={`${idPrefix}FirstName`}
						{...register("firstName")}
						placeholder={t("minors.form.firstName")}
						hasError={!!errors.firstName}
						variant="premium"
					/>
					{errors.firstName && (
						<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
							<AlertCircle size={10} />
							{errors.firstName.message}
						</span>
					)}
				</div>

				<div>
					<label
						htmlFor={`${idPrefix}LastName`}
						className={cn(
							"flex items-center gap-1 text-xs mb-1.5",
							labelColorClass,
						)}
					>
						<User size={12} />
						{t("minors.form.lastName")} *
					</label>
					<KioskInput
						id={`${idPrefix}LastName`}
						{...register("lastName")}
						placeholder={t("minors.form.lastName")}
						hasError={!!errors.lastName}
						variant="premium"
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
				<label
					htmlFor={`${idPrefix}BirthDate`}
					className={cn(
						"flex items-center gap-1 text-xs mb-1.5",
						labelColorClass,
					)}
				>
					<Calendar size={12} />
					{t("minors.form.birthDate")} *
				</label>
				<KioskInput
					id={`${idPrefix}BirthDate`}
					type="date"
					{...register("birthDate")}
					hasError={!!errors.birthDate}
					variant="premium"
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
				<label
					htmlFor={`${idPrefix}Eps`}
					className={cn(
						"flex items-center gap-1 text-xs mb-1.5",
						labelColorClass,
					)}
				>
					<Heart size={12} />
					{t("forms.health.epsName")} *
				</label>
				<KioskInput
					id={`${idPrefix}Eps`}
					{...register("eps")}
					placeholder="Ej. Sura, Sanitas, N/A"
					hasError={!!errors.eps}
					variant="premium"
				/>
				{errors.eps && (
					<span className="text-red-400 text-xs mt-1 flex items-center gap-1">
						<AlertCircle size={10} />
						{errors.eps.message}
					</span>
				)}
			</div>

			{/* Tipo ID y Número */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div>
					<label
						htmlFor={`${idPrefix}IdType`}
						className={cn(
							"flex items-center gap-1 text-xs mb-1.5",
							labelColorClass,
						)}
					>
						<CreditCard size={12} />
						{t("minors.form.idType")} *
					</label>
					<select
						id={`${idPrefix}IdType`}
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
					<label
						htmlFor={`${idPrefix}IdNumber`}
						className={cn(
							"flex items-center gap-1 text-xs mb-1.5",
							labelColorClass,
						)}
					>
						<CreditCard size={12} />
						{t("minors.form.idNumber")} *
					</label>
					<KioskInput
						id={`${idPrefix}IdNumber`}
						{...register("idNumber")}
						placeholder={t("minors.form.idNumber.placeholder")}
						hasError={!!errors.idNumber}
						variant="premium"
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
				<label
					htmlFor={`${idPrefix}Relationship`}
					className={cn(
						"flex items-center gap-1 text-xs mb-1.5",
						labelColorClass,
					)}
				>
					<Heart size={12} />
					{t("minors.form.relationship")} *
				</label>
				<select
					id={`${idPrefix}Relationship`}
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
				<label
					htmlFor={`${idPrefix}MedicalCondition`}
					className={cn(
						"flex items-center gap-1 text-xs mb-1.5",
						labelColorClass,
					)}
				>
					<Heart size={12} className="text-red-400" />
					{t("minors.form.medicalCondition")}
					<span className="text-zinc-500 ml-1">
						{t("minors.form.medicalCondition.optional")}
					</span>
				</label>
				<KioskInput
					id={`${idPrefix}MedicalCondition`}
					{...register("medicalCondition")}
					placeholder={t("minors.form.medicalCondition.placeholder")}
					maxLength={200}
					variant="premium"
				/>
				<p className="text-zinc-500 text-xs mt-1">
					{t("minors.form.medicalCondition.hint")}
				</p>
			</div>
		</>
	);
}
