"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface MinorModalBaseProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	iconBgClass?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

/**
 * Componente base para modales del kiosco (MinorFormModal, MinorHistoryModal).
 * Proporciona la estructura común: portal, backdrop, header con icono/título, y footer sticky.
 */
export function MinorModalBase({
	isOpen,
	onClose,
	title,
	subtitle,
	icon,
	iconBgClass = "bg-neon-green/20",
	children,
	footer,
}: MinorModalBaseProps) {
	if (!isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Cerrar modal"
				className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg max-h-[85vh] bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700 sticky top-0 z-10">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"w-8 h-8 rounded-full flex items-center justify-center",
								iconBgClass
							)}
						>
							{icon}
						</div>
						<div>
							<span className="text-sm font-semibold text-white">{title}</span>
							{subtitle && (
								<p className="text-xs text-gray-400">{subtitle}</p>
							)}
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
					>
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="overflow-y-auto max-h-[calc(85vh-140px)]">
					{children}
				</div>

				{/* Footer */}
				{footer && (
					<div className="sticky bottom-0 px-4 py-3 bg-gray-800/95 border-t border-gray-700 backdrop-blur-sm">
						{footer}
					</div>
				)}
			</div>
		</div>
	);

	// Render via portal to escape parent form context
	if (typeof document !== "undefined") {
		return createPortal(modalContent, document.body);
	}

	return null;
}
