"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { type Minor, minorSchema } from "@/lib/schemas/consent.schema";
import { MinorFormFields } from "./MinorFormFields";
import { MinorModalBase } from "./MinorModalBase";

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

	const title = initialData
		? `${t("minors.modal.editTitle")} #${minorNumber}`
		: `${t("minors.modal.addTitle")} #${minorNumber}`;

	const footer = (
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
				form="minor-form"
				disabled={isSubmitting}
				className="flex-1 py-3 px-4 bg-neon-green hover:bg-green-500 text-white! font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
			>
				<Save size={18} />
				{initialData ? t("minors.update") : t("minors.save")}
			</button>
		</div>
	);

	return (
		<MinorModalBase
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			icon={<User className="w-4 h-4 text-neon-green" />}
			iconBgClass="bg-neon-green/20"
			footer={footer}
		>
			<form
				id="minor-form"
				onSubmit={(e) => {
					e.stopPropagation();
					handleSubmit(onSubmit)(e);
				}}
			>
				<div className="p-4 space-y-4">
					<MinorFormFields
						register={register}
						errors={errors}
						idPrefix="modal"
						labelColorClass="text-white"
					/>
				</div>
			</form>
		</MinorModalBase>
	);
}
