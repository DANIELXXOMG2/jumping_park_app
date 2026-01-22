"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
import { MinorFormFields } from "./MinorFormFields";

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
	idType: "rc",
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
						e.stopPropagation();
						handleSubmit(onSubmit)(e);
					}}
					className="overflow-y-auto max-h-[calc(90vh-120px)]"
				>
					<div className="p-4 space-y-4">
						{/* Campos reutilizables del formulario */}
						<MinorFormFields
							register={register}
							errors={errors}
							idPrefix="modal"
							labelColorClass="text-white"
						/>
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
								className="flex-1 py-3 px-4 bg-neon-green hover:bg-green-500 text-white! font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
