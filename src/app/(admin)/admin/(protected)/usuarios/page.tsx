"use client";

import { Download, Loader2, MoreHorizontal, RefreshCw, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
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
import { adminDelete, adminDownload, adminGet } from "@/lib/adminApi";
import { formatRelativeTime } from "@/lib/utils";

interface User {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone: string;
	minorsCount: number;
	createdAt: string | null;
}

interface Pagination {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

const PAGE_SIZE = 20;

export default function UsersPage() {
	const router = useRouter();
	const { isOffline } = useNetworkStatus();

	// Estado para usuarios y paginación
	const [users, setUsers] = useState<User[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		total: 0,
		limit: PAGE_SIZE,
		offset: 0,
		hasMore: false,
	});
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);

	// Estado para eliminar usuarios
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Función para obtener usuarios con paginación
	const fetchUsers = useCallback(async (searchTerm: string, offset: number) => {
		try {
			setIsLoading(true);
			const params = new URLSearchParams({
				limit: PAGE_SIZE.toString(),
				offset: offset.toString(),
			});
			
			if (searchTerm.trim()) {
				params.set("search", searchTerm);
			}

			const data = await adminGet<{ users: User[]; pagination: Pagination }>(
				`/api/admin/users?${params}`,
			);
			setUsers(data.users);
			setPagination(data.pagination);
		} catch {
			toast.error("Error al cargar usuarios");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar usuarios al montar y cuando cambia la búsqueda
	useEffect(() => {
		fetchUsers(search, 0);
	}, [search, fetchUsers]);

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
		fetchUsers(search, newOffset);
	};

	const handleRefresh = () => {
		fetchUsers(search, pagination.offset);
	};

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const today = new Date().toISOString().split("T")[0];
			await adminDownload("/api/admin/export/users", `usuarios_${today}.csv`);
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

	const handleDeleteUser = async () => {
		if (!userToDelete) return;

		setIsDeleting(true);
		try {
			await adminDelete(`/api/admin/users/${userToDelete.uid}`);
			toast.success("Usuario eliminado", {
				description: `${userToDelete.fullName} ha sido eliminado correctamente`,
			});
			// Refrescar la lista
			fetchUsers(search, pagination.offset);
		} catch (error) {
			toast.error("Error al eliminar", {
				description:
					error instanceof Error ? error.message : "Intente nuevamente",
			});
		} finally {
			setIsDeleting(false);
			setUserToDelete(null);
		}
	};

	const columns = [
		{
			key: "uid",
			header: "Documento",
			render: (user: User) => (
				<span className="font-mono text-xs">{user.uid}</span>
			),
		},
		{
			key: "fullName",
			header: "Nombre",
			render: (user: User) => (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/30 to-primary-contrast/30 flex items-center justify-center">
						<span className="text-xs font-bold text-primary">
							{user.fullName?.charAt(0)?.toUpperCase() || "U"}
						</span>
					</div>
					<span className="font-medium">{user.fullName}</span>
				</div>
			),
		},
		{
			key: "email",
			header: "Email",
			render: (user: User) => (
				<span className="text-foreground/70">{user.email}</span>
			),
		},
		{
			key: "phone",
			header: "Teléfono",
			render: (user: User) => (
				<span className="text-foreground/70">{user.phone || "-"}</span>
			),
		},
		{
			key: "minorsCount",
			header: "Participantes",
			render: (user: User) => (
				<Badge variant={user.minorsCount > 0 ? "success" : "default"}>
					{user.minorsCount}
				</Badge>
			),
		},
		{
			key: "createdAt",
			header: "Registrado",
			render: (user: User) => (
				<span className="text-foreground/50 text-xs">
					{user.createdAt ? formatRelativeTime(user.createdAt) : "-"}
				</span>
			),
		},
		{
			key: "actions",
			header: "",
			render: (user: User) => (
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
								setUserToDelete(user);
							}}
							className="text-red-600 focus:text-red-600"
						>
							<Trash2 className="w-4 h-4" />
							Eliminar usuario
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
					<h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
						<Users className="w-8 h-8 text-primary" />
						Usuarios
					</h1>
					<p className="text-foreground/60 mt-1">
						{pagination.total} usuarios registrados
					</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Botón de recargar */}
					<Button
						variant="ghost"
						size="sm"
						onClick={handleRefresh}
						disabled={isLoading}
						title="Recargar datos"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
					</Button>
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
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<SearchInput
					value={search}
					onChange={(value) => {
						setSearch(value);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
					placeholder="Buscar por nombre, email, documento..."
					className="flex-1 max-w-md"
				/>
			</div>

			{/* Users Table */}
			<div className="bg-surface rounded-xl border border-border p-4 lg:p-6">
				<DataTable
					data={users}
					columns={columns}
					keyExtractor={(user) => user.id}
					onRowClick={(user) => router.push(`/admin/usuarios/${user.uid}`)}
					isLoading={isLoading}
					fromCache={isOffline}
					emptyMessage={search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
					pagination={{
						total: pagination.total,
						limit: pagination.limit,
						offset: pagination.offset,
						onPageChange: handlePageChange,
					}}
				/>
			</div>

			{/* Modal de confirmación de eliminación */}
			<DeleteConfirmModal
				isOpen={!!userToDelete}
				onClose={() => setUserToDelete(null)}
				onConfirm={handleDeleteUser}
				isDeleting={isDeleting}
				title="Eliminar Usuario"
				description="¿Estás seguro de que deseas eliminar este usuario?"
				itemName={userToDelete?.fullName}
			/>
		</div>
	);
}
