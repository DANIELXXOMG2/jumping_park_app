"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/admin/Button";
import { Modal } from "@/components/admin/Modal";

interface DeleteConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isDeleting: boolean;
	title: string;
	description: string;
	itemName?: string;
}

/**
 * Modal de confirmación para eliminar elementos.
 * Muestra una advertencia clara antes de proceder con la eliminación.
 */
export function DeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	isDeleting,
	title,
	description,
	itemName,
}: DeleteConfirmModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="space-y-6">
				{/* Warning Icon */}
				<div className="flex items-center justify-center">
					<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
						<AlertTriangle className="w-8 h-8 text-red-500" />
					</div>
				</div>

				{/* Description */}
				<div className="text-center space-y-2">
					<p className="text-foreground">{description}</p>
					{itemName && (
						<p className="font-semibold text-foreground text-lg">
							&quot;{itemName}&quot;
						</p>
					)}
					<p className="text-sm text-foreground/60">
						Esta acción no se puede deshacer.
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3 justify-end">
					<Button variant="ghost" onClick={onClose} disabled={isDeleting}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={onConfirm}
						disabled={isDeleting}
						className="bg-red-600 hover:bg-red-700 text-white"
					>
						{isDeleting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Eliminando...
							</>
						) : (
							"Eliminar"
						)}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
