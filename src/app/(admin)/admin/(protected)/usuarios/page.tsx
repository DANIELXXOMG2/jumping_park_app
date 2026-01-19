"use client";

import { Download, Loader2, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { DataTable } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { useRecentRegistrations } from "@/hooks";
import { adminDownload, adminGet } from "@/lib/adminApi";
import { formatRelativeTime } from "@/lib/utils";
import { toJsDate } from "@/lib/utils/dateUtils";

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

export default function UsersPage() {
	const router = useRouter();
	
	// Hook con soporte offline - trae últimos 7 días
	const {
		data: recentUsers,
		loading: recentLoading,
		fromCache,
		hasPendingWrites,
		refresh,
	} = useRecentRegistrations(7);

	// Estado para búsqueda (usa API tradicional)
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [pagination, setPagination] = useState<Pagination>({
		total: 0,
		limit: 20,
		offset: 0,
		hasMore: false,
	});
	const [search, setSearch] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	// Determinar qué datos mostrar: búsqueda o recientes
	const isSearchActive = search.trim().length > 0;
	
	// Mapear usuarios recientes al formato esperado
	const mappedRecentUsers: User[] = recentUsers.map((user) => {
		let createdAtISO: string | null = null;
		try {
			if (user.createdAt) {
				const date = toJsDate(user.createdAt);
				if (date && !Number.isNaN(date.getTime())) {
					createdAtISO = date.toISOString();
				}
			}
		} catch {
			// Fecha inválida, mantener null
		}
		
		return {
			id: user.uid,
			uid: user.uid,
			fullName: user.fullName,
			email: user.email,
			phone: user.phone,
			minorsCount: user.minors?.length || 0,
			createdAt: createdAtISO,
		};
	});

	const displayedUsers = isSearchActive ? searchResults : mappedRecentUsers;
	const isLoading = isSearchActive ? isSearching : recentLoading;

	const fetchSearchResults = useCallback(async (searchTerm: string, offset: number) => {
		if (!searchTerm.trim()) return;
		
		try {
			setIsSearching(true);
			const params = new URLSearchParams({
				limit: "20",
				offset: offset.toString(),
				search: searchTerm,
			});

			const data = await adminGet<{ users: User[]; pagination: Pagination }>(
				`/api/admin/users?${params}`,
			);
			setSearchResults(data.users);
			setPagination(data.pagination);
		} catch {
			toast.error("Error al buscar usuarios");
		} finally {
			setIsSearching(false);
		}
	}, []);

	useEffect(() => {
		if (search.trim()) {
			fetchSearchResults(search, 0);
		} else {
			setSearchResults([]);
			setPagination({ total: 0, limit: 20, offset: 0, hasMore: false });
		}
	}, [search, fetchSearchResults]);

	const handlePageChange = (newOffset: number) => {
		if (isSearchActive) {
			fetchSearchResults(search, newOffset);
		}
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
						{isSearchActive 
							? `${pagination.total} resultados encontrados`
							: `${mappedRecentUsers.length} usuarios en los últimos 7 días`
						}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Botón de recargar */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => refresh()}
						disabled={recentLoading}
						title="Recargar datos"
					>
						<RefreshCw className={`w-4 h-4 ${recentLoading ? "animate-spin" : ""}`} />
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
					data={displayedUsers}
					columns={columns}
					keyExtractor={(user) => user.id}
					onRowClick={(user) => router.push(`/admin/usuarios/${user.uid}`)}
					isLoading={isLoading}
					fromCache={!isSearchActive && fromCache}
					emptyMessage={isSearchActive ? "No se encontraron usuarios" : "No hay usuarios registrados en los últimos 7 días"}
					pagination={isSearchActive ? {
						...pagination,
						onPageChange: handlePageChange,
					} : undefined}
				/>
			</div>
		</div>
	);
}
