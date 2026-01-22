"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronUp, Save, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
import { MinorFormFields } from "./MinorFormFields";

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
				{/* Campos reutilizables del formulario */}
				<MinorFormFields
					register={register}
					errors={errors}
					idPrefix="inline"
					labelColorClass="text-gray-400"
				/>

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
						{isSubmitting
							? t("minors.inline.saving")
							: t("minors.inline.saveButton")}
					</span>
				</button>
			</div>
		</div>
	);
}
