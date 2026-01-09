"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConsentReadingModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
}

export function ConsentReadingModal({
	isOpen,
	onClose,
	children,
}: ConsentReadingModalProps) {
	const { t } = useLanguage();

	return (
		<Modal
			variant="fullscreen"
			isOpen={isOpen}
			onClose={onClose}
			title={t("consent.modal.title")}
			footerAction={
				<button
					type="button"
					onClick={onClose}
					className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-[#00E5FF] hover:bg-[#00B8D4] text-black font-bold text-xl rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/30"
				>
					<ArrowLeft className="w-6 h-6" />
					{t("consent.modal.closeBtn")}
				</button>
			}
		>
			{children}
		</Modal>
	);
}
