import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Consent } from "@/hooks";
import {
	adminDelete,
	adminDownload,
	adminPost,
	getAuthToken,
} from "@/lib/adminApi";

interface UseConsentsTableOptions {
	onMutate?: () => void;
}

interface UseConsentsTableReturn {
	selectedConsent: Consent | null;
	setSelectedConsent: (consent: Consent | null) => void;
	consentToDelete: Consent | null;
	setConsentToDelete: (consent: Consent | null) => void;
	isResending: boolean;
	isDeleting: boolean;
	isExporting: boolean;
	handleResendEmail: (consent: Consent) => Promise<void>;
	handleDeleteConsent: () => Promise<void>;
	handleExport: () => Promise<void>;
	handleDownloadPdf: (consent: Consent) => Promise<void>;
	handleViewSignature: (consent: Consent) => void;
	isValidConsent: (validUntil: string | null) => boolean;
}

/**
 * Hook para manejar la lógica común de las tablas de consentimientos.
 * Centraliza acciones como reenviar email, eliminar, exportar y ver PDF.
 */
export function useConsentsTable(
	options: UseConsentsTableOptions = {},
): UseConsentsTableReturn {
	const { onMutate } = options;

	const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);
	const [consentToDelete, setConsentToDelete] = useState<Consent | null>(null);
	const [isResending, setIsResending] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const isValidConsent = useCallback((validUntil: string | null): boolean => {
		if (!validUntil) return false;
		return new Date(validUntil) > new Date();
	}, []);

	const handleResendEmail = useCallback(async (consent: Consent) => {
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
	}, []);

	const handleDeleteConsent = useCallback(async () => {
		if (!consentToDelete) return;

		setIsDeleting(true);
		try {
			await adminDelete(`/api/admin/consents/${consentToDelete.id}`);
			toast.success("Consentimiento eliminado", {
				description: `Consentimiento #${consentToDelete.consecutivo} ha sido eliminado`,
			});
			onMutate?.();
		} catch (error) {
			toast.error("Error al eliminar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsDeleting(false);
			setConsentToDelete(null);
		}
	}, [consentToDelete, onMutate]);

	const handleExport = useCallback(async () => {
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
	}, []);

	const handleDownloadPdf = useCallback(async (consent: Consent) => {
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
	}, []);

	const handleViewSignature = useCallback((consent: Consent) => {
		if (consent.signatureUrl) {
			window.open(consent.signatureUrl, "_blank");
		}
	}, []);

	return {
		selectedConsent,
		setSelectedConsent,
		consentToDelete,
		setConsentToDelete,
		isResending,
		isDeleting,
		isExporting,
		handleResendEmail,
		handleDeleteConsent,
		handleExport,
		handleDownloadPdf,
		handleViewSignature,
		isValidConsent,
	};
}
