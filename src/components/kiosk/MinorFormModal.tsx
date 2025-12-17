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
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
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
	idType: "ti",
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

	const inputClass =
		"w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all";

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
								? `Editar Menor #${minorNumber}`
								: `Agregar Menor #${minorNumber}`}
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
								<label htmlFor="minorFirstName" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
									<User size={12} />
									Nombre *
								</label>
								<input
									id="minorFirstName"
									{...register("firstName")}
									placeholder="Nombre"
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
								<label htmlFor="minorLastName" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
									<User size={12} />
									Apellidos *
								</label>
								<input
									id="minorLastName"
									{...register("lastName")}
									placeholder="Apellidos"
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
							<label htmlFor="minorBirthDate" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
								<Calendar size={12} />
								Fecha de Nacimiento *
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
								<label htmlFor="minorIdType" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
									<CreditCard size={12} />
									Tipo ID *
								</label>
								<select
									id="minorIdType"
									{...register("idType")}
									className={cn(inputClass, "appearance-none cursor-pointer")}
								>
									<option value="ti">Tarjeta Identidad</option>
									<option value="cc">Cédula</option>
									<option value="passport">Pasaporte</option>
									<option value="otro">Otro</option>
								</select>
							</div>

							<div>
								<label htmlFor="minorIdNumber" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
									<CreditCard size={12} />
									Número ID *
								</label>
								<input
									id="minorIdNumber"
									{...register("idNumber")}
									placeholder="Número"
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
							<label htmlFor="minorRelationship" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
								<Heart size={12} />
								Parentesco *
							</label>
							<select
								id="minorRelationship"
								{...register("relationship")}
								className={cn(inputClass, "appearance-none cursor-pointer")}
							>
								<option value="hijo">Hijo/a</option>
								<option value="sobrino">Sobrino/a</option>
								<option value="nieto">Nieto/a</option>
								<option value="otro">Otro</option>
							</select>
						</div>

						{/* Condición Médica */}
						<div>
							<label htmlFor="minorMedicalCondition" className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
								<Heart size={12} className="text-red-400" />
								Condición Médica / Alergias
								<span className="text-gray-600 ml-1">(opcional)</span>
							</label>
							<input
								id="minorMedicalCondition"
								{...register("medicalCondition")}
								placeholder="Ninguna o especificar..."
								maxLength={200}
								className={cn(inputClass, "placeholder:text-gray-600")}
							/>
							<p className="text-gray-600 text-xs mt-1">
								⚠️ Información importante para la seguridad del menor.
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
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex-1 py-3 px-4 bg-neon-green hover:bg-green-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
							>
								<Save size={18} />
								{initialData ? "Actualizar" : "Guardar"}
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
