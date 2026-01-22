"use client";

import {
	Download,
	ExternalLink,
	Eye,
	FileText,
	Loader2,
	MoreHorizontal,
	PenTool,
	Send,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { DataTable } from "@/components/admin/DataTable";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { Modal } from "@/components/admin/Modal";
import { useNetworkStatus } from "@/components/admin/NetworkStatus";
import { SearchInput } from "@/components/admin/SearchInput";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Consent, useConsents } from "@/hooks";
import { adminDelete, adminDownload, adminPost, getAuthToken } from "@/lib/adminApi";
import { formatRelativeTime } from "@/lib/utils";
import { formatEPS } from "@/lib/utils/formatters";

export default function ConsentsPage() {
	const router = useRouter();
	const { isOffline } = useNetworkStatus();
	const [search, setSearch] = useState("");
	const [offset, setOffset] = useState(0);
	const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
	const [isResending, setIsResending] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	// Estado para eliminar consentimientos
	const [consentToDelete, setConsentToDelete] = useState<Consent | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Usar SWR para caché y revalidación automática
	const { consents, pagination, isLoading } = useConsents({
		search,
		offset,
		limit: 20,
	});

	const handlePageChange = (newOffset: number) => {
		setOffset(newOffset);
	};

	const isValidConsent = (validUntil: string | null) => {
		if (!validUntil) return false;
		return new Date(validUntil) > new Date();
	};

	// Reenviar consentimiento por email
	const handleResendEmail = async (consent: Consent) => {
		setIsResending(true);
		try {
			await adminPost(`/api/admin/consents/${consent.id}/resend`, {});
			toast.success("Email reenviado", {
				description: `Consentimiento enviado a ${consent.adultEmail}`,
			});
		} catch (error) {
			toast.error("Error al reenviar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsResending(false);
		}
	};

	// Exportar consentimientos a CSV
	const handleExport = async () => {
		setIsExporting(true);
		try {
			const today = new Date().toISOString().split("T")[0];
			await adminDownload(
				"/api/admin/export/consents",
				`consentimientos_${today}.csv`,
			);
			toast.success("Exportación completada");
		} catch (error) {
			toast.error("Error al exportar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsExporting(false);
		}
	};

	// Eliminar consentimiento
	const handleDeleteConsent = async () => {
		if (!consentToDelete) return;

		setIsDeleting(true);
		try {
			await adminDelete(`/api/admin/consents/${consentToDelete.id}`);
			toast.success("Consentimiento eliminado", {
				description: `Consentimiento #${consentToDelete.consecutivo} ha sido eliminado`,
			});
			// La revalidación se hace automáticamente con SWR
			window.location.reload();
		} catch (error) {
			toast.error("Error al eliminar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsDeleting(false);
			setConsentToDelete(null);
		}
	};

	// Descargar PDF de un consentimiento
	const handleDownloadPdf = async (consent: Consent) => {
		try {
			const token = await getAuthToken();
			if (token) {
				const pdfUrl = `/api/admin/consents/${consent.id}/pdf`;
				const response = await fetch(pdfUrl, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response.ok) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					window.open(url, "_blank");
				}
			}
		} catch {
			toast.error("Error al abrir PDF");
		}
	};

	// Ver firma de un consentimiento
	const handleViewSignature = (consent: Consent) => {
		if (consent.signatureUrl) {
			window.open(consent.signatureUrl, "_blank");
		}
	};

	const columns = [
		{
			key: "consecutivo",
			header: "#",
			render: (consent: Consent) => (
				<Badge variant="info">#{consent.consecutivo}</Badge>
			),
		},
		{
			key: "adultName",
			header: "Responsable",
			render: (consent: Consent) => (
				<div>
					<p className="font-medium">{consent.adultName}</p>
					<p className="text-xs text-foreground/50">{consent.userId}</p>
				</div>
			),
		},
		{
			key: "adultEmail",
			header: "Contacto",
			render: (consent: Consent) => (
				<div className="text-xs">
					<p className="text-foreground/70">{consent.adultEmail}</p>
					<p className="text-foreground/50">{consent.adultPhone}</p>
				</div>
			),
		},
		{
			key: "minorsCount",
			header: "Participantes",
			render: (consent: Consent) => (
				<Badge variant="default">{consent.minorsCount}</Badge>
			),
		},
		{
			key: "validUntil",
			header: "Estado",
			render: (consent: Consent) => (
				<Badge
					variant={isValidConsent(consent.validUntil) ? "success" : "error"}
				>
					{isValidConsent(consent.validUntil) ? "Vigente" : "Vencido"}
				</Badge>
			),
		},
		{
			key: "signedAt",
			header: "Firmado",
			render: (consent: Consent) => (
				<span className="text-xs text-foreground/50">
					{consent.signedAt ? formatRelativeTime(consent.signedAt) : "-"}
				</span>
			),
		},
		{
			key: "actions",
			header: "",
			render: (consent: Consent) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="p-2 rounded-lg hover:bg-surface-muted transition-colors"
							onClick={(e) => e.stopPropagation()}
							aria-label="Abrir menú de acciones"
						>
							<MoreHorizontal className="w-4 h-4 text-foreground/60" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								setSelectedConsent(consent);
							}}
						>
							<Eye className="w-4 h-4" />
							Ver Detalle
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								handleDownloadPdf(consent);
							}}
						>
							<FileText className="w-4 h-4" />
							Descargar PDF
						</DropdownMenuItem>
						{consent.signatureUrl && (
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									handleViewSignature(consent);
								}}
							>
								<PenTool className="w-4 h-4" />
								Ver Firma
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								setConsentToDelete(consent);
							}}
							className="text-red-600 focus:text-red-600"
						>
							<Trash2 className="w-4 h-4" />
							Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	return (
		<div className="space-y-6 pb-20 lg:pb-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-foreground">
						Consentimientos
					</h1>
					<p className="text-foreground/60 mt-1">
						{pagination.total} consentimientos registrados
					</p>
				</div>
				<Button
					variant="secondary"
					onClick={handleExport}
					disabled={isExporting}
				>
					{isExporting ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Download className="w-4 h-4 mr-2" />
					)}
					Exportar CSV
				</Button>
			</div>

			{/* Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				<SearchInput
					value={search}
					onChange={(value) => {
						setSearch(value);
						setOffset(0);
					}}
					placeholder="Buscar por nombre, email, documento, consecutivo..."
					className="flex-1 max-w-md"
				/>
			</div>

			{/* Consents Table */}
			<div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
				<DataTable
					data={consents}
					columns={columns}
					keyExtractor={(consent) => consent.id}
					onRowClick={(consent) => setSelectedConsent(consent)}
					isLoading={isLoading}
					fromCache={isOffline}
					emptyMessage="No se encontraron consentimientos"
					pagination={{
						...pagination,
						onPageChange: handlePageChange,
					}}
				/>
			</div>

			{/* Consent Detail Modal */}
			<Modal
				isOpen={!!selectedConsent}
				onClose={() => setSelectedConsent(null)}
				title={`Consentimiento #${selectedConsent?.consecutivo}`}
			>
				{selectedConsent && (
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
										{selectedConsent.adultName}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Documento:</span>
									<span className="text-sm font-mono">
										{selectedConsent.userId}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Email:</span>
									<span className="text-sm">{selectedConsent.adultEmail}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Teléfono:</span>
									<span className="text-sm">{selectedConsent.adultPhone}</span>
								</div>
							</div>
						</div>

						{/* Minors */}
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
								Participantes ({selectedConsent.minors.length})
							</h4>
							<div className="space-y-2">
								{selectedConsent.minors.map((minor, index) => (
									<div
										key={index}
										className="bg-surface-muted rounded-lg p-3 flex items-center justify-between"
									>
										<div>
											<p className="text-sm font-medium">
												{minor.fullName ||
													`${minor.firstName || ""} ${minor.lastName || ""}`.trim()}
											</p>
											<p className="text-xs text-foreground/50">
												{minor.relationship} • {minor.birthDate} • EPS: {formatEPS(minor.eps)}
											</p>
										</div>
										<Badge variant="default" className="text-xs">
											{minor.idType?.toUpperCase()} {minor.idNumber}
										</Badge>
									</div>
								))}
							</div>
						</div>

						{/* Consent Details */}
						<div>
							<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
								Detalles del Consentimiento
							</h4>
							<div className="bg-surface-muted rounded-lg p-4 space-y-2">
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Versión:</span>
									<span className="text-sm">
										{selectedConsent.policyVersion}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">IP:</span>
									<span className="text-sm font-mono">
										{selectedConsent.ipAddress || "-"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">Firmado:</span>
									<span className="text-sm">
										{selectedConsent.signedAt
											? new Date(selectedConsent.signedAt).toLocaleString(
													"es-CO",
												)
											: "-"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm text-foreground/60">
										Válido hasta:
									</span>
									<span className="text-sm">
										{selectedConsent.validUntil
											? new Date(selectedConsent.validUntil).toLocaleString(
													"es-CO",
												)
											: "-"}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-foreground/60">Estado:</span>
									<Badge
										variant={
											isValidConsent(selectedConsent.validUntil)
												? "success"
												: "error"
										}
									>
										{isValidConsent(selectedConsent.validUntil)
											? "Vigente"
											: "Vencido"}
									</Badge>
								</div>
							</div>
						</div>

						{/* Signature */}
						{selectedConsent.signatureUrl && (
							<div>
								<h4 className="text-sm font-semibold text-foreground/60 uppercase mb-3">
									Firma Digital
								</h4>
								<div className="bg-white rounded-lg p-4 relative h-24">
									<Image
										src={selectedConsent.signatureUrl}
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
							<Button
								variant="secondary"
								onClick={() => {
									setSelectedConsent(null);
									router.push(`/admin/usuarios/${selectedConsent.userId}`);
								}}
							>
								Ver Usuario
							</Button>
							<Button
								variant="primary"
								onClick={async () => {
									// Abrir PDF en nueva pestaña con autenticación
									const token = await getAuthToken();
									if (token) {
										const pdfUrl = `/api/admin/consents/${selectedConsent.id}/pdf`;
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
								}}
							>
								<FileText className="w-4 h-4 mr-2" />
								Ver PDF
							</Button>
							<Button
								variant="outline"
								onClick={() => handleResendEmail(selectedConsent)}
								disabled={isResending}
							>
								{isResending ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Send className="w-4 h-4 mr-2" />
								)}
								Reenviar Email
							</Button>
							{selectedConsent.signatureUrl && (
								<Button
									variant="ghost"
									onClick={() =>
										window.open(selectedConsent.signatureUrl, "_blank")
									}
									title="Ver firma"
								>
									<ExternalLink className="w-4 h-4" />
								</Button>
							)}
						</div>
					</div>
				)}
			</Modal>

			{/* Modal de confirmación de eliminación */}
			<DeleteConfirmModal
				isOpen={!!consentToDelete}
				onClose={() => setConsentToDelete(null)}
				onConfirm={handleDeleteConsent}
				isDeleting={isDeleting}
				title="Eliminar Consentimiento"
				description="¿Estás seguro de que deseas eliminar este consentimiento?"
				itemName={consentToDelete ? `#${consentToDelete.consecutivo} - ${consentToDelete.adultName}` : undefined}
			/>
		</div>
	);
}
