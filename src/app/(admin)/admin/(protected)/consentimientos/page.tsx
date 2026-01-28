"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/Button";
import { ConsentDetailModal } from "@/components/admin/ConsentDetailModal";
import { ConsentTable } from "@/components/admin/ConsentTable";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { useNetworkStatus } from "@/components/admin/NetworkStatus";
import { SearchInput } from "@/components/admin/SearchInput";
import { useConsents } from "@/hooks";
import { useConsentsTable } from "@/hooks/useConsentsTable";

export default function ConsentsPage() {
	const router = useRouter();
	const { isOffline } = useNetworkStatus();
	const [search, setSearch] = useState("");
	const [offset, setOffset] = useState(0);

	// Usar SWR para caché y revalidación automática
	const { consents, pagination, isLoading, mutate } = useConsents({
		search,
		offset,
		limit: 20,
	});

	// Hook para manejar la lógica de la tabla de consentimientos
	const {
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
	} = useConsentsTable({
		onMutate: () => mutate(),
	});

	const handlePageChange = (newOffset: number) => {
		setOffset(newOffset);
	};

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
				<ConsentTable
					consents={consents}
					isLoading={isLoading}
					fromCache={isOffline}
					isValidConsent={isValidConsent}
					showContactColumn={true}
					actions={{
						onView: setSelectedConsent,
						onDownloadPdf: handleDownloadPdf,
						onViewSignature: handleViewSignature,
						onDelete: setConsentToDelete,
					}}
					pagination={{
						...pagination,
						onPageChange: handlePageChange,
					}}
				/>
			</div>

			{/* Consent Detail Modal */}
			<ConsentDetailModal
				consent={selectedConsent}
				onClose={() => setSelectedConsent(null)}
				onResendEmail={handleResendEmail}
				onViewUser={(userId) => router.push(`/admin/usuarios/${userId}`)}
				isResending={isResending}
				isValidConsent={isValidConsent}
			/>

			{/* Modal de confirmación de eliminación */}
			<DeleteConfirmModal
				isOpen={!!consentToDelete}
				onClose={() => setConsentToDelete(null)}
				onConfirm={handleDeleteConsent}
				isDeleting={isDeleting}
				title="Eliminar Consentimiento"
				description="¿Estás seguro de que deseas eliminar este consentimiento?"
				itemName={
					consentToDelete
						? `#${consentToDelete.consecutivo} - ${consentToDelete.adultName}`
						: undefined
				}
			/>
		</div>
	);
}
