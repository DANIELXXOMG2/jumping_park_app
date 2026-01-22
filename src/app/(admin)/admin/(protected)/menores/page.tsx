"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { DataTable } from "@/components/admin/DataTable";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { useNetworkStatus } from "@/components/admin/NetworkStatus";
import { SearchInput } from "@/components/admin/SearchInput";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminDelete, adminGet } from "@/lib/adminApi";
import { formatEPS } from "@/lib/utils/formatters";

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
}

interface Pagination {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

export default function MinorsPage() {
	const router = useRouter();
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

	// Estado para eliminar menores
	const [minorToDelete, setMinorToDelete] = useState<Minor | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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

	const calculateAge = (birthDate: string) => {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	};

	const columns = [
		{
			key: "fullName",
			header: "Nombre",
			render: (minor: Minor) => (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
						<span className="text-xs font-bold text-blue-400">
							{minor.fullName?.charAt(0)?.toUpperCase() || "M"}
						</span>
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
				<span className="text-foreground/70">
					{formatEPS(minor.eps)}
				</span>
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
			{/* Minors Table */}
			<div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
				<DataTable
					data={minors}
					columns={columns}
					keyExtractor={(minor) => minor.id}
					onRowClick={(minor) =>
						router.push(`/admin/usuarios/${minor.parentId}`)
					}
					isLoading={isLoading}
					fromCache={isOffline}
					emptyMessage="No se encontraron participantes"
					pagination={{
						...pagination,
						onPageChange: handlePageChange,
					}}
				/>
			</div>

			{/* Modal de confirmación de eliminación */}
			<DeleteConfirmModal
				isOpen={!!minorToDelete}
				onClose={() => setMinorToDelete(null)}
				onConfirm={handleDeleteMinor}
				isDeleting={isDeleting}
				title="Eliminar Participante"
				description="¿Estás seguro de que deseas eliminar este participante?"
				itemName={minorToDelete?.fullName}
			/>
		</div>
	);
}
