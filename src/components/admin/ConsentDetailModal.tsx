"use client";

import {
	ExternalLink,
	FileText,
	Heart,
	Loader2,
	Send,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Modal } from "@/components/admin/Modal";
import type { Consent, Minor } from "@/hooks";
import { getAuthToken } from "@/lib/adminApi";
import { formatEPS } from "@/lib/utils/formatters";

interface ConsentDetailModalProps {
	consent: Consent | null;
	onClose: () => void;
	onResendEmail: (consent: Consent) => void;
	onViewUser?: (userId: string) => void;
	isResending?: boolean;
	isValidConsent: (validUntil: string | null) => boolean;
	/** Datos del usuario para mostrar como fallback */
	userFallback?: {
		fullName?: string;
		uid?: string;
		email?: string;
		phone?: string;
	};
}

/**
 * Modal reutilizable para mostrar el detalle de un consentimiento.
 * Usado tanto en la vista general como en el detalle de usuario.
 */
export function ConsentDetailModal({
	consent,
	onClose,
	onResendEmail,
	onViewUser,
	isResending = false,
	isValidConsent,
	userFallback,
}: ConsentDetailModalProps) {
	const handleViewPdf = async () => {
		if (!consent) return;
		const token = await getAuthToken();
		if (token) {
			const pdfUrl = `/api/admin/consents/${consent.id}/pdf`;
			try {
				const response = await fetch(pdfUrl, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response.ok) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					window.open(url, "_blank");
				}
			} catch {
				// Error silencioso
			}
		}
	};

	const renderMinorItem = (minor: Minor, index: number) => {
		const fullName =
			minor.fullName ||
			`${minor.firstName || ""} ${minor.lastName || ""}`.trim();

		return (
			<div key={index} className="bg-surface-muted rounded-lg p-3">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">{fullName}</p>
						<p className="text-xs text-foreground/50">
							{minor.relationship} • {minor.birthDate} • EPS: {formatEPS(minor.eps)}
						</p>
					</div>
					<Badge variant="default" className="text-xs">
						{minor.idType?.toUpperCase()} {minor.idNumber}
					</Badge>
				</div>
				{minor.medicalCondition && (
					<div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
						<Heart className="w-3 h-3 fill-red-400" />
						<span>⚠️ {minor.medicalCondition}</span>
					</div>
				)}
			</div>
		);
	};

	return (
		<Modal
			isOpen={!!consent}
			onClose={onClose}
			title={`Consentimiento #${consent?.consecutivo}`}
		>
			{consent && (
				<div className="space-y-6">
					{/* Adult Info */}
					<div>
						<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
							Información del Responsable
						</h4>
						<div className="bg-surface-muted rounded-lg p-4 space-y-2">
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Nombre:</span>
								<span className="text-sm font-medium">
									{consent.adultName || userFallback?.fullName}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Documento:</span>
								<span className="text-sm font-mono">
									{consent.userId || userFallback?.uid}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Email:</span>
								<span className="text-sm">
									{consent.adultEmail || userFallback?.email}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Teléfono:</span>
								<span className="text-sm">
									{consent.adultPhone || userFallback?.phone}
								</span>
							</div>
						</div>
					</div>

					{/* Minors */}
					{consent.minors && consent.minors.length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
								Participantes ({consent.minors.length})
							</h4>
							<div className="space-y-2">
								{consent.minors.map((minor, index) =>
									renderMinorItem(minor, index)
								)}
							</div>
						</div>
					)}

					{/* Consent Details */}
					<div>
						<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
							Detalles del Consentimiento
						</h4>
						<div className="bg-surface-muted rounded-lg p-4 space-y-2">
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Versión:</span>
								<span className="text-sm">{consent.policyVersion}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">IP:</span>
								<span className="text-sm font-mono">
									{consent.ipAddress || "-"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Firmado:</span>
								<span className="text-sm">
									{consent.signedAt
										? new Date(consent.signedAt).toLocaleString("es-CO")
										: "-"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-foreground/60">Válido hasta:</span>
								<span className="text-sm">
									{consent.validUntil
										? new Date(consent.validUntil).toLocaleString("es-CO")
										: "-"}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-foreground/60">Estado:</span>
								<Badge
									variant={isValidConsent(consent.validUntil) ? "success" : "error"}
								>
									{isValidConsent(consent.validUntil) ? "Vigente" : "Vencido"}
								</Badge>
							</div>
						</div>
					</div>

					{/* Signature */}
					{consent.signatureUrl && (
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
								Firma Digital
							</h4>
							<div className="bg-white rounded-lg p-4 relative h-24">
								<Image
									src={consent.signatureUrl}
									alt="Firma"
									fill
									className="object-contain"
									unoptimized
								/>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-wrap gap-3 pt-4 border-t border-border">
						{onViewUser && (
							<Button
								variant="secondary"
								onClick={() => {
									onClose();
									onViewUser(consent.userId);
								}}
							>
								Ver Usuario
							</Button>
						)}
						<Button variant="primary" onClick={handleViewPdf}>
							<FileText className="w-4 h-4 mr-2" />
							Ver PDF
						</Button>
						<Button
							variant="outline"
							onClick={() => onResendEmail(consent)}
							disabled={isResending}
						>
							{isResending ? (
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							) : (
								<Send className="w-4 h-4 mr-2" />
							)}
							Reenviar Email
						</Button>
						{consent.signatureUrl && (
							<Button
								variant="ghost"
								onClick={() => window.open(consent.signatureUrl, "_blank")}
								title="Ver firma"
							>
								<ExternalLink className="w-4 h-4" />
							</Button>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
}
