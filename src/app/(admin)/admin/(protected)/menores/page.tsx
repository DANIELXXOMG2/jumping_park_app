"use client";

import {
	Baby,
	Eye,
	FileCheck,
	Heart,
	Mail,
	MoreHorizontal,
	Phone,
	Trash2,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
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
import { useAuth } from "@/contexts/AuthContext";
import { adminDelete, adminGet } from "@/lib/adminApi";
import { calculateAge } from "@/lib/utils/dateUtils";
import { formatEPS } from "@/lib/utils/formatters";
import { hasPermission } from "@/types/auth";

interface Minor {
	id: string;
	fullName: string;
	firstName?: string;
	lastName?: string;
	birthDate: string;
	relationship: string;
	eps?: string;
	idType?: string;
	idNumber?: string;
	parentId: string;
	parentName: string;
	parentEmail: string;
	parentPhone: string;
	medicalCondition?: string;
}

interface ConsentInfo {
	id: string;
	consecutivo: number;
	signedAt: string | null;
	expiresAt: string | null;
	isExpired: boolean;
}

interface Pagination {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

export default function MinorsPage() {
	const router = useRouter();
	const { role } = useAuth();
	const { isOffline } = useNetworkStatus();
	const [minors, setMinors] = useState<Minor[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		total: 0,
		limit: 20,
		offset: 0,
		hasMore: false,
	});
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	// Estado para eliminar menores (solo si tiene permiso)
	const [minorToDelete, setMinorToDelete] = useState<Minor | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Estado para ver detalles (para trabajadores sin permiso de edición)
	const [selectedMinor, setSelectedMinor] = useState<Minor | null>(null);
	const [consentInfo, setConsentInfo] = useState<ConsentInfo | null>(null);
	const [loadingConsent, setLoadingConsent] = useState(false);

	// Verificar si el usuario puede editar/eliminar
	const canEdit = role ? hasPermission(role, "minors:edit") : false;

	const fetchMinors = useCallback(
		async (searchTerm: string, offset: number) => {
			try {
				setIsLoading(true);
				const params = new URLSearchParams({
					limit: "20",
					offset: offset.toString(),
				});
				if (searchTerm) {
					params.set("search", searchTerm);
				}

				const data = await adminGet<{
					minors: Minor[];
					pagination: Pagination;
				}>(`/api/admin/minors?${params}`);
				setMinors(data.minors);
				setPagination(data.pagination);
			} catch {
				// Error silencioso
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	useEffect(() => {
		fetchMinors(search, 0);
	}, [search, fetchMinors]);

	const handlePageChange = (newOffset: number) => {
		fetchMinors(search, newOffset);
	};

	const handleDeleteMinor = async () => {
		if (!minorToDelete) return;

		setIsDeleting(true);
		try {
			await adminDelete(`/api/admin/minors/${minorToDelete.id}`);
			toast.success("Participante eliminado", {
				description: `${minorToDelete.fullName} ha sido eliminado correctamente`,
			});
			// Refrescar la lista
			fetchMinors(search, pagination.offset);
		} catch (error) {
			toast.error("Error al eliminar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsDeleting(false);
			setMinorToDelete(null);
		}
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleDateString("es-CO", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Cargar información del consentimiento cuando se selecciona un participante
	const handleViewDetails = async (minor: Minor) => {
		setSelectedMinor(minor);
		setConsentInfo(null);
		setLoadingConsent(true);

		try {
			// Buscar el último consentimiento del responsable
			const result = await adminGet<{
				found: boolean;
				isExpired?: boolean;
				consent?: {
					id: string;
					consecutivo: number;
					signedAt: string | null;
					expiresAt: string | null;
				};
			}>(`/api/admin/verificar-consentimiento?cedula=${minor.parentId}`);

			if (result.found && result.consent) {
				setConsentInfo({
					...result.consent,
					isExpired: result.isExpired ?? true,
				});
			}
		} catch {
			// No hay consentimiento o error
		} finally {
			setLoadingConsent(false);
		}
	};

	const columns = [
		{
			key: "fullName",
			header: "Nombre",
			render: (minor: Minor) => (
				<div className="flex items-center gap-2">
					<div className="relative">
						<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
							<span className="text-xs font-bold text-blue-400">
								{minor.fullName?.charAt(0)?.toUpperCase() || "M"}
							</span>
						</div>
						{minor.medicalCondition && (
							<div
								className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center"
								title="Tiene condición médica"
							>
								<Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" />
							</div>
						)}
					</div>
					<span className="font-medium">{minor.fullName}</span>
				</div>
			),
		},
		{
			key: "birthDate",
			header: "Edad",
			render: (minor: Minor) => (
				<Badge variant="info">{calculateAge(minor.birthDate)} años</Badge>
			),
		},
		{
			key: "idNumber",
			header: "Documento",
			render: (minor: Minor) => (
				<span className="font-mono text-xs text-foreground/70">
					{minor.idType?.toUpperCase()} {minor.idNumber || "-"}
				</span>
			),
		},
		{
			key: "relationship",
			header: "Parentesco",
			render: (minor: Minor) => (
				<span className="text-foreground/70 capitalize">
					{minor.relationship}
				</span>
			),
		},
		{
			key: "eps",
			header: "EPS",
			render: (minor: Minor) => (
				<span className="text-foreground/70">{formatEPS(minor.eps)}</span>
			),
		},
		{
			key: "parentName",
			header: "Responsable",
			render: (minor: Minor) => (
				<div>
					<p className="text-sm font-medium">{minor.parentName}</p>
					<p className="text-xs text-foreground/50">{minor.parentId}</p>
				</div>
			),
		},
		{
			key: "actions",
			header: "",
			render: (minor: Minor) => (
				<div className="flex items-center gap-1">
					{/* Botón de ver detalles (siempre visible) */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleViewDetails(minor);
						}}
						className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
						aria-label="Ver detalles"
					>
						<Eye className="w-4 h-4" />
					</button>

					{/* Menú de acciones (solo si puede editar) */}
					{canEdit && (
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
										setMinorToDelete(minor);
									}}
									className="text-red-600 focus:text-red-600"
								>
									<Trash2 className="w-4 h-4" />
									Eliminar participante
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			),
		},
	];

	return (
		<div className="space-y-6 pb-20 lg:pb-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-foreground">
						Participantes
					</h1>
					<p className="text-foreground/60 mt-1">
						{pagination.total} participantes registrados
					</p>
				</div>
			</div>

			{/* Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				<SearchInput
					value={search}
					onChange={(value) => {
						setSearch(value);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
					placeholder="Buscar por nombre, documento, responsable..."
					className="flex-1 max-w-md"
				/>
			</div>

			{/* Minors Table */}
			<div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
				<DataTable
					data={minors}
					columns={columns}
					keyExtractor={(minor) => minor.id}
					onRowClick={handleViewDetails}
					isLoading={isLoading}
					fromCache={isOffline}
					emptyMessage="No se encontraron participantes"
					pagination={{
						...pagination,
						onPageChange: handlePageChange,
					}}
				/>
			</div>

			{/* Modal de Detalles del Participante */}
			<Modal
				isOpen={!!selectedMinor}
				onClose={() => {
					setSelectedMinor(null);
					setConsentInfo(null);
				}}
				title="Detalles del Participante"
				className="max-w-lg"
			>
				{selectedMinor && (
					<div className="space-y-6">
						{/* Información del Participante */}
						<div className="bg-surface-muted rounded-xl p-4 space-y-4">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
									<Baby className="w-6 h-6 text-blue-400" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-foreground">
										{selectedMinor.fullName}
									</h3>
									<p className="text-sm text-foreground/60">
										{calculateAge(selectedMinor.birthDate)} años •{" "}
										{selectedMinor.relationship}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-2">
								<div>
									<p className="text-xs text-foreground/50 uppercase tracking-wide">
										Documento
									</p>
									<p className="text-sm font-mono text-foreground mt-1">
										{selectedMinor.idType?.toUpperCase()}{" "}
										{selectedMinor.idNumber || "-"}
									</p>
								</div>
								<div>
									<p className="text-xs text-foreground/50 uppercase tracking-wide">
										EPS
									</p>
									<p className="text-sm text-foreground mt-1">
										{formatEPS(selectedMinor.eps)}
									</p>
								</div>
								<div>
									<p className="text-xs text-foreground/50 uppercase tracking-wide">
										Fecha de Nacimiento
									</p>
									<p className="text-sm text-foreground mt-1">
										{formatDate(selectedMinor.birthDate)}
									</p>
								</div>
								<div className="col-span-2">
									<p className="text-xs text-foreground/50 uppercase tracking-wide flex items-center gap-1">
										<Heart className="w-3 h-3" />
										Condición Médica / Alergias
									</p>
									<p
										className={`text-sm mt-1 ${selectedMinor.medicalCondition ? "text-red-400 font-medium" : "text-foreground"}`}
									>
										{selectedMinor.medicalCondition || "Ninguna"}
									</p>
								</div>
							</div>
						</div>

						{/* Información del Responsable */}
						<div className="bg-surface-muted rounded-xl p-4 space-y-3">
							<div className="flex items-center gap-2 text-foreground/70">
								<User className="w-4 h-4" />
								<span className="text-sm font-medium uppercase tracking-wide">
									Responsable
								</span>
							</div>

							<div className="space-y-2">
								<p className="text-foreground font-medium">
									{selectedMinor.parentName}
								</p>
								<div className="flex items-center gap-2 text-sm text-foreground/60">
									<span className="font-mono">{selectedMinor.parentId}</span>
								</div>
								{selectedMinor.parentEmail && (
									<div className="flex items-center gap-2 text-sm text-foreground/60">
										<Mail className="w-4 h-4" />
										<span>{selectedMinor.parentEmail}</span>
									</div>
								)}
								{selectedMinor.parentPhone && (
									<div className="flex items-center gap-2 text-sm text-foreground/60">
										<Phone className="w-4 h-4" />
										<span>{selectedMinor.parentPhone}</span>
									</div>
								)}
							</div>
						</div>

						{/* Información del Consentimiento */}
						<div className="bg-surface-muted rounded-xl p-4 space-y-3">
							<div className="flex items-center gap-2 text-foreground/70">
								<FileCheck className="w-4 h-4" />
								<span className="text-sm font-medium uppercase tracking-wide">
									Consentimiento
								</span>
							</div>

							{loadingConsent ? (
								<div className="flex items-center justify-center py-4">
									<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
							) : consentInfo ? (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-foreground font-medium">
											#{consentInfo.consecutivo}
										</span>
										<Badge
											variant={!consentInfo.isExpired ? "success" : "error"}
										>
											{!consentInfo.isExpired ? "Vigente" : "Vencido"}
										</Badge>
									</div>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div>
											<p className="text-foreground/50">Firmado</p>
											<p className="text-foreground">
												{formatDate(consentInfo.signedAt)}
											</p>
										</div>
										<div>
											<p className="text-foreground/50">Válido hasta</p>
											<p className="text-foreground">
												{formatDate(consentInfo.expiresAt)}
											</p>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-4 text-foreground/50">
									<FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">
										No se encontró consentimiento activo
									</p>
								</div>
							)}
						</div>

						{/* Botones de acción */}
						<div className="flex justify-end gap-2 pt-2">
							{canEdit && (
								<button
									type="button"
									onClick={() =>
										router.push(`/admin/usuarios/${selectedMinor.parentId}`)
									}
									className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-white"
								>
									Ver perfil completo
								</button>
							)}
							<button
								type="button"
								onClick={() => {
									setSelectedMinor(null);
									setConsentInfo(null);
								}}
								className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-surface-muted/80 transition-colors text-foreground"
							>
								Cerrar
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Modal de confirmación de eliminación (solo si puede editar) */}
			{canEdit && (
				<DeleteConfirmModal
					isOpen={!!minorToDelete}
					onClose={() => setMinorToDelete(null)}
					onConfirm={handleDeleteMinor}
					isDeleting={isDeleting}
					title="Eliminar Participante"
					description="¿Estás seguro de que deseas eliminar este participante?"
					itemName={minorToDelete?.fullName}
				/>
			)}
		</div>
	);
}
