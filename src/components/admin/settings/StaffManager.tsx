"use client";

import {
	ChevronRight,
	Eye,
	EyeOff,
	Loader2,
	Plus,
	Shield,
	Trash2,
	User,
	Users,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/admin/Badge";
import { Button } from "@/components/admin/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/Card";
import { Modal } from "@/components/admin/Modal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth, isSuperAdmin } from "@/contexts/AuthContext";
import { adminFetch, adminGet, adminPost, adminDelete } from "@/lib/adminApi";
import { cn } from "@/lib/utils";
import { ALL_PERMISSIONS, type Permission } from "@/types/auth";

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
}

interface RolesResponse {
	roles: Role[];
	availablePermissions: string[];
	total: number;
}

interface StaffMember {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone?: string | null;
	role: string; // Ahora es string dinámico, no UserRole hardcodeado
	avatar?: string | null;
	customPermissions: Permission[];
	createdAt?: string | null;
}

interface StaffResponse {
	staff: StaffMember[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

interface CreateStaffData {
	email: string;
	password: string;
	fullName: string;
	role: string; // Ahora es string dinámico
	phone?: string;
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

// ============================================================================
// COMPONENTE DE TARJETA DE STAFF
// ============================================================================

function StaffCard({
	member,
	roles,
	onClick,
	showDelete,
	onDelete,
}: {
	member: StaffMember;
	roles: Role[];
	onClick: () => void;
	showDelete?: boolean;
	onDelete?: (member: StaffMember) => void;
}) {
	// Buscar el rol en la lista de roles dinámicos
	const roleData = roles.find((r) => r.name === member.role);
	const roleLabel = roleData?.displayName || member.role;
	// Determinar variante del badge basada en el nombre del rol
	const roleVariant =
		member.role === "admin" ? "success" : member.role === "cashier" ? "info" : "default";

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation(); // Evitar que se abra el panel de permisos
		onDelete?.(member);
	};

	return (
		<div className="group relative w-full bg-surface rounded-xl border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
			<button
				type="button"
				onClick={onClick}
				className="w-full text-left p-5"
			>
				<div className="flex items-start gap-4">
					<UserAvatar name={member.email} size={56} />
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
							{member.fullName}
						</h3>
						<p className="text-sm text-foreground/60 truncate mt-0.5">
							{member.email}
						</p>
						<div className="flex items-center gap-2 mt-3">
							<Badge variant={roleVariant}>{roleLabel}</Badge>
							{member.customPermissions.length > 0 && (
								<Badge variant="info" className="text-xs">
									+{member.customPermissions.length} permisos
								</Badge>
							)}
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
				</div>
			</button>
			{/* Botón de eliminar - Solo visible para Super Admin */}
			{showDelete && !isSuperAdmin(member.email) && (
				<button
					type="button"
					onClick={handleDeleteClick}
					className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
					title="Eliminar miembro"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			)}
		</div>
	);
}

// ============================================================================
// PANEL LATERAL (SHEET) DE PERMISOS
// ============================================================================

function PermissionsSheet({
	isOpen,
	onClose,
	member,
	roles,
	onSaved,
}: {
	isOpen: boolean;
	onClose: () => void;
	member: StaffMember | null;
	roles: Role[];
	onSaved: () => void;
}) {
	const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Obtener permisos del rol desde la DB
	const roleData = roles.find((r) => r.name === member?.role);
	const rolePermissions = (roleData?.permissions || []) as Permission[];
	const roleLabel = roleData?.displayName || member?.role || "Sin rol";

	// Cargar permisos cuando se abre el panel
	useEffect(() => {
		if (member) {
			setCustomPermissions(member.customPermissions || []);
			setHasChanges(false);
		}
	}, [member]);

	// Bloquear scroll del body
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen || !member) return null;

	const isRolePermission = (permission: Permission): boolean => {
		return rolePermissions.includes(permission);
	};

	const hasCustomPermission = (permission: Permission): boolean => {
		return customPermissions.includes(permission);
	};

	const togglePermission = (permission: Permission) => {
		if (isRolePermission(permission)) return;

		setCustomPermissions((prev) => {
			const newPermissions = prev.includes(permission)
				? prev.filter((p) => p !== permission)
				: [...prev, permission];
			return newPermissions;
		});
		setHasChanges(true);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const response = await adminFetch(
				`/api/admin/users/${member.uid}/permissions`,
				{
					method: "PATCH",
					body: JSON.stringify({ permissions: customPermissions }),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Error al guardar permisos");
			}

			toast.success("Permisos actualizados", {
				description: `Los permisos de ${member.fullName} han sido guardados.`,
			});
			setHasChanges(false);
			onSaved();
			onClose();
		} catch (error) {
			toast.error("Error al guardar permisos", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const formatPermissionLabel = (permission: Permission): string => {
		const actionLabels: Record<string, string> = {
			view: "Ver",
			create: "Crear",
			edit: "Editar",
			delete: "Eliminar",
			export: "Exportar",
			manage: "Administrar",
			access: "Acceder",
			sign: "Firmar",
		};

		const moduleLabels: Record<string, string> = {
			dashboard: "Dashboard",
			users: "Usuarios",
			consents: "Consentimientos",
			minors: "Menores",
			statistics: "Estadísticas",
			settings: "Configuración",
			roles: "Roles",
			kiosk: "Kiosco",
			consent: "Consentimiento",
		};

		const [module, action] = permission.split(":");
		const moduleLabel = moduleLabels[module] || module;
		const actionLabel = actionLabels[action] || action;

		return `${actionLabel} ${moduleLabel}`;
	};

	return (
		<div className="fixed inset-0 z-100">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Sheet Panel */}
			<div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted shrink-0">
					<div className="flex items-center gap-3">
						<UserAvatar name={member.email} size={40} />
						<div>
							<h2 className="font-semibold text-foreground">{member.fullName}</h2>
							<p className="text-xs text-foreground/60">{member.email}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-surface transition-colors"
						aria-label="Cerrar"
					>
						<X className="w-5 h-5 text-foreground/60" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Info del Rol */}
					<div className="flex items-center justify-between p-4 bg-surface-muted rounded-lg">
						<span className="text-sm text-foreground/70">Rol asignado:</span>
						<Badge
							variant={
								member.role === "admin"
									? "success"
									: member.role === "cashier"
										? "info"
										: "default"
							}
							className="text-sm"
						>
							{roleLabel}
						</Badge>
					</div>

					{/* Leyenda */}
					<div className="flex flex-wrap gap-3 text-xs text-foreground/70 p-3 bg-surface-muted rounded-lg">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded border-2 border-primary bg-primary/30" />
							<span>Por Rol</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded border-2 border-border bg-surface" />
							<span>Personalizado</span>
						</div>
					</div>

					{/* Módulos de Permisos */}
					<div className="space-y-4">
						{Object.entries(ALL_PERMISSIONS).map(([module, permissions]) => (
							<div
								key={module}
								className="border border-border rounded-lg overflow-hidden"
							>
								<div className="px-4 py-2.5 bg-surface-muted border-b border-border">
									<h4 className="font-medium text-sm text-foreground flex items-center gap-2">
										<span>{MODULE_ICONS[module] || "📁"}</span>
										{module}
									</h4>
								</div>
								<div className="p-3 space-y-2">
									{permissions.map((permission) => {
										const isFromRole = isRolePermission(permission);
										const isChecked = isFromRole || hasCustomPermission(permission);

										return (
											<label
												key={permission}
												className={cn(
													"flex items-center gap-3 p-2 rounded-lg transition-colors",
													isFromRole
														? "bg-primary/5 cursor-not-allowed"
														: "hover:bg-surface-muted cursor-pointer"
												)}
											>
												<input
													type="checkbox"
													checked={isChecked}
													onChange={() => togglePermission(permission)}
													disabled={isFromRole}
													className={cn(
														"w-4 h-4 rounded border-2 transition-colors accent-primary",
														isFromRole
															? "border-primary bg-primary/30 cursor-not-allowed"
															: "border-border cursor-pointer"
													)}
												/>
												<span
													className={cn(
														"text-sm flex-1",
														isFromRole ? "text-foreground/70" : "text-foreground"
													)}
												>
													{formatPermissionLabel(permission)}
												</span>
												{isFromRole && (
													<span className="text-xs text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
														Por Rol
													</span>
												)}
											</label>
										);
									})}
								</div>
							</div>
						))}
					</div>

					{/* Resumen de Permisos Personalizados */}
					{customPermissions.length > 0 && (
						<div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
							<h4 className="text-sm font-medium text-foreground mb-2">
								Permisos Personalizados ({customPermissions.length})
							</h4>
							<div className="flex flex-wrap gap-2">
								{customPermissions.map((permission) => (
									<Badge key={permission} variant="info" className="text-xs">
										{formatPermissionLabel(permission)}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-border bg-surface-muted shrink-0 flex justify-end gap-3">
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Cancelar
					</Button>
					<Button
						variant="primary"
						onClick={handleSave}
						isLoading={isSaving}
						disabled={!hasChanges}
					>
						{hasChanges ? "Guardar Cambios" : "Sin Cambios"}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// MODAL DE CREACIÓN
// ============================================================================

function CreateStaffModal({
	isOpen,
	onClose,
	onCreated,
	roles,
}: {
	isOpen: boolean;
	onClose: () => void;
	onCreated: () => void;
	roles: Role[];
}) {
	// Filtrar solo roles que pueden ser asignados a staff (excluir 'visitor')
	const assignableRoles = roles.filter((r) => r.name !== "visitor");
	const defaultRole = assignableRoles.find((r) => r.name === "cashier")?.name || assignableRoles[0]?.name || "";

	const [formData, setFormData] = useState<CreateStaffData>({
		email: "",
		password: "",
		fullName: "",
		role: defaultRole,
		phone: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [errors, setErrors] = useState<Partial<Record<keyof CreateStaffData, string>>>({});

	// Actualizar rol por defecto cuando cambien los roles disponibles
	useEffect(() => {
		if (defaultRole && !formData.role) {
			setFormData((prev) => ({ ...prev, role: defaultRole }));
		}
	}, [defaultRole, formData.role]);

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof CreateStaffData, string>> = {};

		if (!formData.email.trim()) {
			newErrors.email = "El email es requerido";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Email inválido";
		}

		if (!formData.password) {
			newErrors.password = "La contraseña es requerida";
		} else if (formData.password.length < 6) {
			newErrors.password = "Mínimo 6 caracteres";
		}

		if (!formData.fullName.trim()) {
			newErrors.fullName = "El nombre es requerido";
		} else if (formData.fullName.trim().length < 2) {
			newErrors.fullName = "Mínimo 2 caracteres";
		}

		if (!formData.role) {
			newErrors.role = "El rol es requerido";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsCreating(true);
		try {
			await adminPost("/api/admin/staff", formData);

			const roleLabel = roles.find((r) => r.name === formData.role)?.displayName || formData.role;
			toast.success("Miembro creado", {
				description: `${formData.fullName} ha sido agregado como ${roleLabel}.`,
			});

			onCreated();
			onClose();
			resetForm();
		} catch (error) {
			toast.error("Error al crear usuario", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsCreating(false);
		}
	};

	const resetForm = () => {
		setFormData({
			email: "",
			password: "",
			fullName: "",
			role: defaultRole,
			phone: "",
		});
		setErrors({});
		setShowPassword(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Agregar Miembro del Equipo">
			<form onSubmit={handleSubmit} className="space-y-5">
				{/* Nombre Completo */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-1.5">
						Nombre Completo *
					</label>
					<input
						type="text"
						value={formData.fullName}
						onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
						placeholder="Juan Pérez"
						className={cn(
							"w-full px-4 py-2.5 text-sm bg-surface-muted border rounded-lg focus:outline-none focus:ring-1",
							errors.fullName
								? "border-red-500 focus:border-red-500 focus:ring-red-500"
								: "border-border focus:border-primary focus:ring-primary"
						)}
					/>
					{errors.fullName && (
						<p className="text-xs text-red-400 mt-1">{errors.fullName}</p>
					)}
				</div>

				{/* Email */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-1.5">
						Email *
					</label>
					<input
						type="email"
						value={formData.email}
						onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
						placeholder="correo@ejemplo.com"
						className={cn(
							"w-full px-4 py-2.5 text-sm bg-surface-muted border rounded-lg focus:outline-none focus:ring-1",
							errors.email
								? "border-red-500 focus:border-red-500 focus:ring-red-500"
								: "border-border focus:border-primary focus:ring-primary"
						)}
					/>
					{errors.email && (
						<p className="text-xs text-red-400 mt-1">{errors.email}</p>
					)}
				</div>

				{/* Teléfono */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-1.5">
						Teléfono (opcional)
					</label>
					<input
						type="tel"
						value={formData.phone}
						onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
						placeholder="+57 300 123 4567"
						className="w-full px-4 py-2.5 text-sm bg-surface-muted border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>

				{/* Contraseña */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-1.5">
						Contraseña *
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							value={formData.password}
							onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
							placeholder="Mínimo 6 caracteres"
							className={cn(
								"w-full px-4 py-2.5 pr-12 text-sm bg-surface-muted border rounded-lg focus:outline-none focus:ring-1",
								errors.password
									? "border-red-500 focus:border-red-500 focus:ring-red-500"
									: "border-border focus:border-primary focus:ring-primary"
							)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded transition-colors"
						>
							{showPassword ? (
								<EyeOff className="w-4 h-4 text-foreground/60" />
							) : (
								<Eye className="w-4 h-4 text-foreground/60" />
							)}
						</button>
					</div>
					{errors.password && (
						<p className="text-xs text-red-400 mt-1">{errors.password}</p>
					)}
				</div>

				{/* Rol */}
				<div>
					<label className="block text-sm font-medium text-foreground mb-1.5">
						Rol *
					</label>
					{assignableRoles.length === 0 ? (
						<p className="text-sm text-foreground/60 p-4 bg-surface-muted rounded-lg">
							No hay roles disponibles. Crea un rol en "Gestión de Roles" primero.
						</p>
					) : (
						<div className="grid grid-cols-2 gap-3">
							{assignableRoles.map((role) => (
								<button
									key={role.id}
									type="button"
									onClick={() => setFormData((prev) => ({ ...prev, role: role.name }))}
									className={cn(
										"p-4 rounded-lg border-2 transition-all text-left",
										formData.role === role.name
											? "border-primary bg-primary/5"
											: "border-border hover:border-primary/50"
									)}
								>
									<div className="flex items-center gap-2 mb-1">
										{role.name === "admin" ? (
											<Shield className="w-4 h-4 text-green-400" />
										) : role.name === "cashier" ? (
											<User className="w-4 h-4 text-blue-400" />
										) : (
											<Shield className="w-4 h-4 text-foreground/60" />
										)}
										<span className="font-medium text-foreground">{role.displayName}</span>
									</div>
									{role.description && (
										<p className="text-xs text-foreground/60 line-clamp-2">
											{role.description}
										</p>
									)}
									<p className="text-xs text-foreground/40 mt-1">
										{role.permissions.length} permisos
									</p>
								</button>
							))}
						</div>
					)}
					{errors.role && (
						<p className="text-xs text-red-400 mt-1">{errors.role}</p>
					)}
				</div>

				{/* Botones */}
				<div className="flex justify-end gap-3 pt-4 border-t border-border">
					<Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
						Cancelar
					</Button>
					<Button type="submit" variant="primary" isLoading={isCreating}>
						Crear Miembro
					</Button>
				</div>
			</form>
		</Modal>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StaffManager() {
	const { user } = useAuth();
	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Verificar si el usuario actual es Super Admin
	const currentUserIsSuperAdmin = isSuperAdmin(user?.email);

	// Cargar roles desde la API
	const loadRoles = useCallback(async () => {
		try {
			const response = await adminGet<RolesResponse>("/api/admin/roles");
			setRoles(response.roles);
		} catch (error) {
			console.error("Error cargando roles:", error);
			toast.error("Error al cargar roles", {
				description: "No se pudieron cargar los roles disponibles",
			});
		}
	}, []);

	// Cargar staff
	const loadStaff = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await adminGet<StaffResponse>("/api/admin/staff");
			setStaff(response.staff);
		} catch (error) {
			toast.error("Error al cargar equipo", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Cargar datos iniciales
	useEffect(() => {
		Promise.all([loadRoles(), loadStaff()]);
	}, [loadRoles, loadStaff]);

	const handleOpenSheet = (member: StaffMember) => {
		setSelectedMember(member);
		setIsSheetOpen(true);
	};

	const handleCloseSheet = () => {
		setIsSheetOpen(false);
		setSelectedMember(null);
	};

	const handleStaffCreated = () => {
		loadStaff();
	};

	const handlePermissionsSaved = () => {
		loadStaff();
	};

	const handleDeleteRequest = (member: StaffMember) => {
		setMemberToDelete(member);
	};

	const handleDeleteConfirm = async () => {
		if (!memberToDelete) return;

		setIsDeleting(true);
		try {
			await adminDelete(`/api/admin/staff/${memberToDelete.id}`);
			toast.success("Miembro eliminado", {
				description: `${memberToDelete.fullName} ha sido eliminado del equipo.`,
			});
			setMemberToDelete(null);
			loadStaff();
		} catch (error) {
			toast.error("Error al eliminar", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setMemberToDelete(null);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="w-5 h-5 text-primary" />
						Equipo Administrativo
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<p className="text-sm text-foreground/70">
							Gestiona los miembros del equipo con acceso al panel de administración.
							Haz clic en una tarjeta para editar los permisos.
						</p>
						<Button
							variant="primary"
							onClick={() => setIsCreateModalOpen(true)}
							className="shrink-0"
						>
							<Plus className="w-4 h-4" />
							Agregar Miembro
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Grid de Staff */}
			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="w-8 h-8 text-primary animate-spin" />
				</div>
			) : staff.length === 0 ? (
				<Card>
					<CardContent className="py-16">
						<div className="flex flex-col items-center justify-center text-center">
							<div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-4">
								<Users className="w-10 h-10 text-foreground/30" />
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">
								Sin miembros del equipo
							</h3>
							<p className="text-sm text-foreground/60 max-w-md mb-6">
								Aún no hay administradores o cajeros registrados. Agrega el primer
								miembro del equipo para comenzar.
							</p>
							<Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
								<Plus className="w-4 h-4" />
								Agregar Primer Miembro
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{staff.map((member) => (
						<StaffCard
							key={member.id}
							member={member}
							roles={roles}
							onClick={() => handleOpenSheet(member)}
							showDelete={currentUserIsSuperAdmin}
							onDelete={handleDeleteRequest}
						/>
					))}
				</div>
			)}

			{/* Modal de Confirmación de Eliminación */}
			<Modal
				isOpen={!!memberToDelete}
				onClose={handleDeleteCancel}
				title="Confirmar Eliminación"
			>
				<div className="space-y-4">
					<p className="text-foreground/80">
						¿Estás seguro de que deseas eliminar a{" "}
						<span className="font-semibold text-foreground">
							{memberToDelete?.fullName}
						</span>{" "}
						del equipo?
					</p>
					<p className="text-sm text-foreground/60">
						Esta acción no se puede deshacer. El usuario perderá acceso al panel
						de administración.
					</p>
					<div className="flex justify-end gap-3 pt-4 border-t border-border">
						<Button
							variant="outline"
							onClick={handleDeleteCancel}
							disabled={isDeleting}
						>
							Cancelar
						</Button>
						<Button
							variant="primary"
							onClick={handleDeleteConfirm}
							isLoading={isDeleting}
							className="bg-red-500 hover:bg-red-600"
						>
							<Trash2 className="w-4 h-4" />
							Eliminar
						</Button>
					</div>
				</div>
			</Modal>

			{/* Modal de Creación */}
			<CreateStaffModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onCreated={handleStaffCreated}
				roles={roles}
			/>

			{/* Panel de Permisos */}
			<PermissionsSheet
				isOpen={isSheetOpen}
				onClose={handleCloseSheet}
				member={selectedMember}
				roles={roles}
				onSaved={handlePermissionsSaved}
			/>
		</div>
	);
}
