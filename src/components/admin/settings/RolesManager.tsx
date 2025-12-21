"use client";

import {
	Check,
	ChevronRight,
	Loader2,
	Lock,
	Plus,
	Save,
	Shield,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/Card";
import { Modal } from "@/components/admin/Modal";
import { adminFetch, adminGet } from "@/lib/adminApi";
import { cn } from "@/lib/utils";
import { ALL_PERMISSIONS } from "@/types/auth";

// ============================================================================
// TIPOS
// ============================================================================

interface Role {
	id: string;
	name: string;
	displayName: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	createdAt: string | null;
	updatedAt: string | null;
}

interface RolesResponse {
	roles: Role[];
	availablePermissions: string[];
	total: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MODULE_ICONS: Record<string, string> = {
	Dashboard: "📊",
	Usuarios: "👥",
	Consentimientos: "📝",
	Menores: "👶",
	Estadísticas: "📈",
	Configuración: "⚙️",
	Roles: "🔐",
	Kiosco: "🖥️",
};

const PERMISSION_LABELS: Record<string, string> = {
	"dashboard:view": "Ver dashboard",
	"users:view": "Ver usuarios",
	"users:create": "Crear usuarios",
	"users:edit": "Editar usuarios",
	"users:delete": "Eliminar usuarios",
	"consents:view": "Ver consentimientos",
	"consents:export": "Exportar consentimientos",
	"minors:view": "Ver menores",
	"minors:edit": "Editar menores",
	"statistics:view": "Ver estadísticas",
	"settings:manage": "Gestionar configuración",
	"roles:manage": "Gestionar roles",
	"kiosk:access": "Acceder al kiosco",
	"consent:sign": "Firmar consentimientos",
};

// ============================================================================
// COMPONENTE: RoleCard
// ============================================================================

function RoleCard({
	role,
	isSelected,
	onClick,
}: {
	role: Role;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-full p-4 rounded-lg border text-left transition-all",
				"hover:border-primary/50 hover:bg-surface-muted/50",
				isSelected
					? "border-primary bg-primary/5 ring-1 ring-primary/20"
					: "border-border bg-surface"
			)}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"w-10 h-10 rounded-lg flex items-center justify-center",
							isSelected ? "bg-primary/10" : "bg-surface-muted"
						)}
					>
						<Shield
							className={cn(
								"w-5 h-5",
								isSelected ? "text-primary" : "text-foreground/60"
							)}
						/>
					</div>
					<div>
						<h3 className="font-medium text-foreground flex items-center gap-2">
							{role.displayName}
							{role.isSystem && (
								<span title="Rol de sistema">
									<Lock className="w-3.5 h-3.5 text-amber-500" />
								</span>
							)}
						</h3>
						<p className="text-xs text-foreground/60">
							{role.permissions.length} permisos
						</p>
					</div>
				</div>
				<ChevronRight
					className={cn(
						"w-5 h-5 transition-colors",
						isSelected ? "text-primary" : "text-foreground/30"
					)}
				/>
			</div>
		</button>
	);
}

// ============================================================================
// COMPONENTE: PermissionCheckbox
// ============================================================================

function PermissionCheckbox({
	permission,
	checked,
	onChange,
	disabled,
}: {
	permission: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<label
			className={cn(
				"flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
				"hover:bg-surface-muted",
				disabled && "opacity-50 cursor-not-allowed"
			)}
		>
			<div
				className={cn(
					"w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
					checked
						? "bg-primary border-primary"
						: "border-border bg-background"
				)}
			>
				{checked && <Check className="w-3.5 h-3.5 text-white" />}
			</div>
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
				className="sr-only"
			/>
			<span className="text-sm text-foreground">
				{PERMISSION_LABELS[permission] || permission}
			</span>
		</label>
	);
}

// ============================================================================
// COMPONENTE: PermissionsMatrix
// ============================================================================

function PermissionsMatrix({
	selectedPermissions,
	onChange,
	disabled,
}: {
	selectedPermissions: string[];
	onChange: (permissions: string[]) => void;
	disabled?: boolean;
}) {
	const handlePermissionToggle = (permission: string, checked: boolean) => {
		if (checked) {
			onChange([...selectedPermissions, permission]);
		} else {
			onChange(selectedPermissions.filter((p) => p !== permission));
		}
	};

	const handleModuleToggle = (modulePermissions: readonly string[], checked: boolean) => {
		if (checked) {
			const newPermissions = new Set([...selectedPermissions, ...modulePermissions]);
			onChange(Array.from(newPermissions));
		} else {
			onChange(selectedPermissions.filter((p) => !modulePermissions.includes(p)));
		}
	};

	return (
		<div className="space-y-4">
			{Object.entries(ALL_PERMISSIONS).map(([module, permissions]) => {
				const allChecked = permissions.every((p) =>
					selectedPermissions.includes(p)
				);
				const someChecked = permissions.some((p) =>
					selectedPermissions.includes(p)
				);

				return (
					<div
						key={module}
						className="border border-border rounded-lg overflow-hidden"
					>
						{/* Header del módulo */}
						<div className="flex items-center justify-between p-3 bg-surface-muted/50">
							<label className="flex items-center gap-2 cursor-pointer">
								<div
									className={cn(
										"w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
										allChecked
											? "bg-primary border-primary"
											: someChecked
												? "bg-primary/50 border-primary"
												: "border-border bg-background"
									)}
								>
									{(allChecked || someChecked) && (
										<Check className="w-3.5 h-3.5 text-white" />
									)}
								</div>
								<input
									type="checkbox"
									checked={allChecked}
									onChange={(e) =>
										handleModuleToggle(permissions, e.target.checked)
									}
									disabled={disabled}
									className="sr-only"
								/>
								<span className="text-lg mr-2">{MODULE_ICONS[module]}</span>
								<span className="font-medium text-foreground">{module}</span>
							</label>
							<Badge variant="default">
								{permissions.filter((p) => selectedPermissions.includes(p)).length}/
								{permissions.length}
							</Badge>
						</div>

						{/* Permisos del módulo */}
						<div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
							{permissions.map((permission) => (
								<PermissionCheckbox
									key={permission}
									permission={permission}
									checked={selectedPermissions.includes(permission)}
									onChange={(checked) =>
										handlePermissionToggle(permission, checked)
									}
									disabled={disabled}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ============================================================================
// COMPONENTE: CreateRoleModal
// ============================================================================

function CreateRoleModal({
	isOpen,
	onClose,
	onCreated,
}: {
	isOpen: boolean;
	onClose: () => void;
	onCreated: () => void;
}) {
	const [name, setName] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [description, setDescription] = useState("");
	const [permissions, setPermissions] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async () => {
		if (!name.trim() || !displayName.trim()) {
			setError("El nombre y nombre para mostrar son requeridos");
			return;
		}

		if (permissions.length === 0) {
			setError("Debes seleccionar al menos un permiso");
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const response = await adminFetch("/api/admin/roles", {
				method: "POST",
				body: JSON.stringify({
					name: name.trim().toLowerCase().replace(/\s+/g, "_"),
					displayName: displayName.trim(),
					description: description.trim() || undefined,
					permissions,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al crear el rol");
			}

			toast.success("Rol creado exitosamente");
			onCreated();
			handleClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al crear el rol");
		} finally {
			setIsCreating(false);
		}
	};

	const handleClose = () => {
		setName("");
		setDisplayName("");
		setDescription("");
		setPermissions([]);
		setError(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Rol">
			<div className="space-y-4">
				{error && (
					<div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
						{error}
					</div>
				)}

				<div>
					<label
						htmlFor="roleName"
						className="block text-sm font-medium text-foreground/70 mb-1"
					>
						Identificador (slug)
					</label>
					<input
						id="roleName"
						type="text"
						value={name}
						onChange={(e) =>
							setName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ""))
						}
						placeholder="ej: marketing, soporte"
						className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
					<p className="text-xs text-foreground/50 mt-1">
						Solo letras minúsculas y guiones bajos
					</p>
				</div>

				<div>
					<label
						htmlFor="roleDisplayName"
						className="block text-sm font-medium text-foreground/70 mb-1"
					>
						Nombre para mostrar
					</label>
					<input
						id="roleDisplayName"
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						placeholder="ej: Marketing, Soporte Técnico"
						className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				<div>
					<label
						htmlFor="roleDescription"
						className="block text-sm font-medium text-foreground/70 mb-1"
					>
						Descripción (opcional)
					</label>
					<textarea
						id="roleDescription"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Describe las responsabilidades de este rol..."
						rows={2}
						className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-foreground/70 mb-2">
						Permisos
					</label>
					<div className="max-h-[300px] overflow-y-auto border border-border rounded-lg p-2">
						<PermissionsMatrix
							selectedPermissions={permissions}
							onChange={setPermissions}
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-4 border-t border-border">
					<Button variant="outline" onClick={handleClose} disabled={isCreating}>
						Cancelar
					</Button>
					<Button onClick={handleCreate} disabled={isCreating}>
						{isCreating ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Plus className="w-4 h-4 mr-2" />
						)}
						Crear Rol
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ============================================================================
// COMPONENTE: DeleteConfirmModal
// ============================================================================

function DeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	roleName,
	isDeleting,
}: {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	roleName: string;
	isDeleting: boolean;
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Confirmar Eliminación">
			<div className="space-y-4">
				<p className="text-foreground/70">
					¿Estás seguro de que deseas eliminar el rol{" "}
					<span className="font-semibold text-foreground">{roleName}</span>?
				</p>
				<p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg">
					⚠️ Esta acción no se puede deshacer. Asegúrate de que no haya usuarios
					asignados a este rol.
				</p>
				<div className="flex justify-end gap-2 pt-4 border-t border-border">
					<Button variant="outline" onClick={onClose} disabled={isDeleting}>
						Cancelar
					</Button>
					<Button
						variant="danger"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4 mr-2" />
						)}
						Eliminar Rol
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL: RolesManager
// ============================================================================

export function RolesManager() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
	const [editedDisplayName, setEditedDisplayName] = useState("");
	const [editedDescription, setEditedDescription] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Cargar roles
	const fetchRoles = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await adminGet<RolesResponse>("/api/admin/roles");
			setRoles(result.roles);
		} catch (error) {
			console.error("Error cargando roles:", error);
			toast.error("Error al cargar los roles");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRoles();
	}, [fetchRoles]);

	// Seleccionar rol
	const handleSelectRole = (role: Role) => {
		if (hasChanges) {
			if (!confirm("Tienes cambios sin guardar. ¿Deseas continuar?")) {
				return;
			}
		}
		setSelectedRole(role);
		setEditedPermissions([...role.permissions]);
		setEditedDisplayName(role.displayName);
		setEditedDescription(role.description || "");
		setHasChanges(false);
	};

	// Detectar cambios
	useEffect(() => {
		if (!selectedRole) {
			setHasChanges(false);
			return;
		}

		const permissionsChanged =
			JSON.stringify([...editedPermissions].sort()) !==
			JSON.stringify([...selectedRole.permissions].sort());
		const displayNameChanged = editedDisplayName !== selectedRole.displayName;
		const descriptionChanged =
			editedDescription !== (selectedRole.description || "");

		setHasChanges(permissionsChanged || displayNameChanged || descriptionChanged);
	}, [selectedRole, editedPermissions, editedDisplayName, editedDescription]);

	// Guardar cambios
	const handleSave = async () => {
		if (!selectedRole) return;

		setIsSaving(true);
		try {
			const response = await adminFetch(`/api/admin/roles/${selectedRole.id}`, {
				method: "PUT",
				body: JSON.stringify({
					displayName: editedDisplayName,
					description: editedDescription || undefined,
					permissions: editedPermissions,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al guardar");
			}

			toast.success("Rol actualizado exitosamente");
			setHasChanges(false);
			await fetchRoles();

			// Actualizar el rol seleccionado con los nuevos datos
			const updatedRole = roles.find((r) => r.id === selectedRole.id);
			if (updatedRole) {
				setSelectedRole({
					...updatedRole,
					displayName: editedDisplayName,
					description: editedDescription,
					permissions: editedPermissions,
				});
			}
		} catch (error) {
			console.error("Error guardando rol:", error);
			toast.error(
				error instanceof Error ? error.message : "Error al guardar el rol"
			);
		} finally {
			setIsSaving(false);
		}
	};

	// Eliminar rol
	const handleDelete = async () => {
		if (!selectedRole) return;

		setIsDeleting(true);
		try {
			const response = await adminFetch(`/api/admin/roles/${selectedRole.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Error al eliminar");
			}

			toast.success("Rol eliminado exitosamente");
			setShowDeleteModal(false);
			setSelectedRole(null);
			await fetchRoles();
		} catch (error) {
			console.error("Error eliminando rol:", error);
			toast.error(
				error instanceof Error ? error.message : "Error al eliminar el rol"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Columna izquierda: Lista de roles */}
			<Card className="lg:col-span-1">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Shield className="w-5 h-5" />
						Roles
					</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowCreateModal(true)}
					>
						<Plus className="w-4 h-4 mr-1" />
						Crear
					</Button>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{roles.length === 0 ? (
							<p className="text-center text-foreground/60 py-8">
								No hay roles configurados
							</p>
						) : (
							roles.map((role) => (
								<RoleCard
									key={role.id}
									role={role}
									isSelected={selectedRole?.id === role.id}
									onClick={() => handleSelectRole(role)}
								/>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Columna derecha: Editor de rol */}
			<Card className="lg:col-span-2">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg">
						{selectedRole ? "Editar Rol" : "Selecciona un Rol"}
					</CardTitle>
					{selectedRole && (
						<div className="flex items-center gap-2">
							{hasChanges && (
								<Badge variant="warning">Cambios sin guardar</Badge>
							)}
							{!selectedRole.isSystem && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowDeleteModal(true)}
									className="text-destructive hover:text-destructive"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							)}
							<Button
								size="sm"
								onClick={handleSave}
								disabled={!hasChanges || isSaving}
							>
								{isSaving ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Save className="w-4 h-4 mr-2" />
								)}
								Guardar
							</Button>
						</div>
					)}
				</CardHeader>
				<CardContent>
					{selectedRole ? (
						<div className="space-y-6">
							{/* Info del rol */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-foreground/70 mb-1">
										Identificador
									</label>
									<input
										type="text"
										value={selectedRole.name}
										disabled
										className="w-full px-3 py-2 rounded-lg border border-border bg-surface-muted text-foreground/60"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground/70 mb-1">
										Nombre para mostrar
									</label>
									<input
										type="text"
										value={editedDisplayName}
										onChange={(e) => setEditedDisplayName(e.target.value)}
										disabled={selectedRole.isSystem}
										className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-surface-muted disabled:text-foreground/60"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-foreground/70 mb-1">
									Descripción
								</label>
								<textarea
									value={editedDescription}
									onChange={(e) => setEditedDescription(e.target.value)}
									disabled={selectedRole.isSystem}
									rows={2}
									className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:bg-surface-muted disabled:text-foreground/60"
								/>
							</div>

							{selectedRole.isSystem && (
								<div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
									<Lock className="w-4 h-4" />
									Este es un rol de sistema. Solo puedes modificar los permisos.
								</div>
							)}

							{/* Matriz de permisos */}
							<div>
								<h3 className="text-sm font-medium text-foreground/70 mb-3">
									Permisos del Rol
								</h3>
								<PermissionsMatrix
									selectedPermissions={editedPermissions}
									onChange={setEditedPermissions}
								/>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-16 text-foreground/60">
							<Shield className="w-12 h-12 mb-4 opacity-30" />
							<p>Selecciona un rol de la lista para editarlo</p>
							<p className="text-sm mt-1">
								O crea uno nuevo con el botón &quot;+ Crear&quot;
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modals */}
			<CreateRoleModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onCreated={fetchRoles}
			/>

			{selectedRole && (
				<DeleteConfirmModal
					isOpen={showDeleteModal}
					onClose={() => setShowDeleteModal(false)}
					onConfirm={handleDelete}
					roleName={selectedRole.displayName}
					isDeleting={isDeleting}
				/>
			)}
		</div>
	);
}
