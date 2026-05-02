"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Edit2,
	Loader2,
	Mail,
	RefreshCw,
	Shield,
	ShieldCheck,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Card } from "@/components/admin/Card";
import { Modal } from "@/components/admin/Modal";
import { SearchInput } from "@/components/admin/SearchInput";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";

interface StaffMember {
	uid: string;
	email: string;
	displayName?: string;
	role: UserRole;
	createdAt?: string;
	lastSignIn?: string;
}

interface StaffFormData {
	email: string;
	role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
	admin: "Administrador",
	trabajador: "Trabajador",
	visitor: "Visitante",
};

const ROLE_COLORS: Record<
	UserRole,
	"default" | "success" | "warning" | "error" | "info"
> = {
	admin: "success",
	trabajador: "info",
	visitor: "warning",
};

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
	admin: ShieldCheck,
	trabajador: Shield,
	visitor: Users,
};

export function StaffManager() {
	const { user, role: currentUserRole, getIdToken } = useAuth();
	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<StaffMember | null>(
		null,
	);
	const [formData, setFormData] = useState<StaffFormData>({
		email: "",
		role: "trabajador",
	});
	const [saving, setSaving] = useState(false);

	// Solo admins pueden gestionar el personal
	const canManageStaff = currentUserRole === "admin";

	const fetchStaff = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const token = await getIdToken();
			if (!token) {
				throw new Error("No se pudo obtener el token de autenticación");
			}

			const response = await fetch("/api/admin/roles", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error("Error al cargar el personal");
			}

			const data = await response.json();
			setStaff(data.users || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setLoading(false);
		}
	}, [getIdToken]);

	useEffect(() => {
		fetchStaff();
	}, [fetchStaff]);

	const handleAddMember = async () => {
		if (!formData.email) {
			setError("El email es requerido");
			return;
		}

		try {
			setSaving(true);
			setError(null);

			const token = await getIdToken();
			if (!token) {
				throw new Error("No se pudo obtener el token de autenticación");
			}

			const response = await fetch("/api/admin/roles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al agregar miembro");
			}

			setSuccess("Miembro agregado correctamente");
			setIsAddModalOpen(false);
			setFormData({ email: "", role: "trabajador" });
			fetchStaff();

			setTimeout(() => setSuccess(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setSaving(false);
		}
	};

	const handleEditMember = async () => {
		if (!selectedMember) return;

		try {
			setSaving(true);
			setError(null);

			const token = await getIdToken();
			if (!token) {
				throw new Error("No se pudo obtener el token de autenticación");
			}

			const response = await fetch("/api/admin/roles", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					email: selectedMember.email,
					role: formData.role,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al actualizar rol");
			}

			setSuccess("Rol actualizado correctamente");
			setIsEditModalOpen(false);
			setSelectedMember(null);
			fetchStaff();

			setTimeout(() => setSuccess(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteMember = async () => {
		if (!selectedMember) return;

		// Prevenir que el usuario se elimine a sí mismo
		if (selectedMember.email === user?.email) {
			setError("No puedes eliminar tu propio rol");
			setIsDeleteModalOpen(false);
			return;
		}

		try {
			setSaving(true);
			setError(null);

			const token = await getIdToken();
			if (!token) {
				throw new Error("No se pudo obtener el token de autenticación");
			}

			const response = await fetch(
				`/api/admin/roles?email=${encodeURIComponent(selectedMember.email)}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al eliminar miembro");
			}

			setSuccess("Miembro eliminado correctamente");
			setIsDeleteModalOpen(false);
			setSelectedMember(null);
			fetchStaff();

			setTimeout(() => setSuccess(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setSaving(false);
		}
	};

	const openEditModal = (member: StaffMember) => {
		setSelectedMember(member);
		setFormData({ email: member.email, role: member.role });
		setIsEditModalOpen(true);
	};

	const openDeleteModal = (member: StaffMember) => {
		setSelectedMember(member);
		setIsDeleteModalOpen(true);
	};

	const filteredStaff = staff.filter(
		(member) =>
			member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (!canManageStaff) {
		return (
			<Card>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Shield className="h-16 w-16 text-gray-400 mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Acceso Restringido
					</h3>
					<p className="text-gray-500">
						Solo los administradores pueden gestionar el personal.
					</p>
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header con mensajes */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
					<AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{success && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
					<CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
					<p className="text-green-700">{success}</p>
				</div>
			)}

			{/* Barra de acciones */}
			<Card>
				<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
					<div className="flex-1 w-full sm:max-w-xs">
						<SearchInput
							value={searchQuery}
							onChange={setSearchQuery}
							placeholder="Buscar por email o nombre..."
						/>
					</div>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={fetchStaff}
							disabled={loading}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
							/>
							Actualizar
						</Button>
						<Button
							variant="primary"
							size="sm"
							onClick={() => {
								setFormData({ email: "", role: "trabajador" });
								setIsAddModalOpen(true);
							}}
						>
							<UserPlus className="h-4 w-4 mr-2" />
							Agregar Miembro
						</Button>
					</div>
				</div>
			</Card>

			{/* Lista de personal */}
			<Card>
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary-500" />
					</div>
				) : filteredStaff.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Users className="h-16 w-16 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							{searchQuery ? "Sin resultados" : "Sin personal"}
						</h3>
						<p className="text-gray-500">
							{searchQuery
								? "No se encontraron miembros con ese criterio."
								: "Agrega miembros del personal para comenzar."}
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-200">
						{filteredStaff.map((member) => {
							const RoleIcon = ROLE_ICONS[member.role] || Users;
							const isCurrentUser = member.email === user?.email;

							return (
								<div
									key={member.uid}
									className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-3 sm:gap-4"
								>
									<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
										<div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
											<RoleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<p className="font-medium text-gray-900 text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
													{member.displayName || member.email}
												</p>
												{isCurrentUser && <Badge variant="success">Tú</Badge>}
											</div>
											<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500 mt-0.5">
												<span className="flex items-center gap-1 truncate">
													<Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
													<span className="truncate">{member.email}</span>
												</span>
												{member.lastSignIn && (
													<span className="flex items-center gap-1 text-[10px] sm:text-sm">
														<Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
														<span className="hidden xs:inline">
															Último acceso:
														</span>{" "}
														{new Date(member.lastSignIn).toLocaleDateString()}
													</span>
												)}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2 sm:gap-3 pl-12 sm:pl-0">
										<Badge variant={ROLE_COLORS[member.role] || "default"}>
											{ROLE_LABELS[member.role] || member.role}
										</Badge>

										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => openEditModal(member)}
												title="Editar rol"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											{!isCurrentUser && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => openDeleteModal(member)}
													title="Eliminar miembro"
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			{/* Modal Agregar Miembro */}
			<Modal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				title="Agregar Miembro del Personal"
			>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="staff-email"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Email del usuario
						</label>
						<input
							id="staff-email"
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							placeholder="usuario@ejemplo.com"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<p className="mt-1 text-xs text-gray-500">
							El usuario debe haberse registrado previamente en el sistema.
						</p>
					</div>

					<div>
						<label
							htmlFor="staff-role"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Rol
						</label>
						<select
							id="staff-role"
							value={formData.role}
							onChange={(e) =>
								setFormData({ ...formData, role: e.target.value as UserRole })
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="trabajador">Trabajador (solo Dashboard)</option>
							<option value="admin">Administrador (acceso completo)</option>
						</select>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							variant="secondary"
							onClick={() => setIsAddModalOpen(false)}
							disabled={saving}
						>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleAddMember}
							disabled={saving || !formData.email}
						>
							{saving ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								"Agregar Miembro"
							)}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Modal Editar Rol */}
			<Modal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				title="Editar Rol"
			>
				<div className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-700 mb-1">
							Usuario
						</span>
						<p className="text-gray-900">{selectedMember?.email}</p>
					</div>

					<div>
						<label
							htmlFor="edit-staff-role"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Nuevo Rol
						</label>
						<select
							id="edit-staff-role"
							value={formData.role}
							onChange={(e) =>
								setFormData({ ...formData, role: e.target.value as UserRole })
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="trabajador">Trabajador (solo Dashboard)</option>
							<option value="admin">Administrador (acceso completo)</option>
						</select>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							variant="secondary"
							onClick={() => setIsEditModalOpen(false)}
							disabled={saving}
						>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleEditMember}
							disabled={saving}
						>
							{saving ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Guardando...
								</>
							) : (
								"Guardar Cambios"
							)}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Modal Confirmar Eliminación */}
			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title="Eliminar Miembro"
			>
				<div className="space-y-4">
					<div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
						<AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
						<div>
							<p className="font-medium text-red-800">¿Estás seguro?</p>
							<p className="text-sm text-red-600">
								Se eliminará el rol de <strong>{selectedMember?.email}</strong>{" "}
								y perderá acceso al panel de administración.
							</p>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							variant="secondary"
							onClick={() => setIsDeleteModalOpen(false)}
							disabled={saving}
						>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleDeleteMember}
							disabled={saving}
							className="bg-red-600 hover:bg-red-700"
						>
							{saving ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Eliminando...
								</>
							) : (
								"Eliminar Miembro"
							)}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
