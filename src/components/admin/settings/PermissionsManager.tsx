"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Search, Shield, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/Card";
import { Button } from "@/components/admin/Button";
import { Badge } from "@/components/admin/Badge";
import { adminGet, adminFetch } from "@/lib/adminApi";
import { cn } from "@/lib/utils";
import {
	ALL_PERMISSIONS,
	ROLE_PERMISSIONS,
	type Permission,
	type UserRole,
} from "@/types/auth";

// ============================================================================
// TIPOS
// ============================================================================

interface UserSearchResult {
	id: string;
	uid: string;
	fullName: string;
	email: string;
	phone?: string;
	role?: UserRole;
	customPermissions?: Permission[];
}

interface UserPermissionsResponse {
	userId: string;
	role: UserRole;
	customPermissions: Permission[];
	availablePermissions: Permission[];
}

// ============================================================================
// HELPERS
// ============================================================================

const ROLE_LABELS: Record<UserRole, string> = {
	admin: "Administrador",
	cashier: "Cajero",
	visitor: "Visitante",
};

const ROLE_VARIANTS: Record<UserRole, "success" | "info" | "default"> = {
	admin: "success",
	cashier: "info",
	visitor: "default",
};

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
// COMPONENTE PRINCIPAL
// ============================================================================

export function PermissionsManager() {
	// Estados de búsqueda
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// Estados de usuario seleccionado
	const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
	const [userRole, setUserRole] = useState<UserRole>("visitor");
	const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
	const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

	// Estado de guardado
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// -------------------------------------------------------------------------
	// BÚSQUEDA DE USUARIOS
	// -------------------------------------------------------------------------

	const handleSearch = useCallback(async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await adminGet<{
				users: UserSearchResult[];
				pagination: { total: number };
			}>(`/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=10`);

			setSearchResults(response.users);
		} catch (error) {
			toast.error("Error al buscar usuarios", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, [searchQuery]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// -------------------------------------------------------------------------
	// SELECCIÓN DE USUARIO
	// -------------------------------------------------------------------------

	const handleSelectUser = async (user: UserSearchResult) => {
		setSelectedUser(user);
		setSearchResults([]);
		setSearchQuery("");
		setIsLoadingPermissions(true);

		try {
			const response = await adminGet<UserPermissionsResponse>(
				`/api/admin/users/${user.uid}/permissions`
			);

			setUserRole(response.role);
			setCustomPermissions(response.customPermissions);
			setHasChanges(false);
		} catch (error) {
			toast.error("Error al cargar permisos", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
			// Usar valores por defecto
			setUserRole(user.role || "visitor");
			setCustomPermissions([]);
		} finally {
			setIsLoadingPermissions(false);
		}
	};

	const handleClearUser = () => {
		setSelectedUser(null);
		setUserRole("visitor");
		setCustomPermissions([]);
		setHasChanges(false);
	};

	// -------------------------------------------------------------------------
	// GESTIÓN DE PERMISOS
	// -------------------------------------------------------------------------

	const isRolePermission = (permission: Permission): boolean => {
		return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
	};

	const hasCustomPermission = (permission: Permission): boolean => {
		return customPermissions.includes(permission);
	};

	const togglePermission = (permission: Permission) => {
		// No permitir modificar permisos del rol base
		if (isRolePermission(permission)) return;

		setCustomPermissions((prev) => {
			const newPermissions = prev.includes(permission)
				? prev.filter((p) => p !== permission)
				: [...prev, permission];
			return newPermissions;
		});
		setHasChanges(true);
	};

	// -------------------------------------------------------------------------
	// GUARDADO
	// -------------------------------------------------------------------------

	const handleSave = async () => {
		if (!selectedUser) return;

		setIsSaving(true);
		try {
			const response = await adminFetch(
				`/api/admin/users/${selectedUser.uid}/permissions`,
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
				description: `Los permisos de ${selectedUser.fullName} han sido guardados.`,
			});
			setHasChanges(false);
		} catch (error) {
			toast.error("Error al guardar permisos", {
				description: error instanceof Error ? error.message : "Error desconocido",
			});
		} finally {
			setIsSaving(false);
		}
	};

	// -------------------------------------------------------------------------
	// RENDERIZADO
	// -------------------------------------------------------------------------

	return (
		<div className="space-y-6">
			{/* Buscador de Usuarios */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="w-5 h-5 text-primary" />
						Gestión de Permisos Granulares
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Buscar usuario por email, nombre o documento..."
								className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-muted border border-border rounded-lg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								disabled={isSearching}
							/>
							<Button
								variant="primary"
								size="sm"
								onClick={handleSearch}
								isLoading={isSearching}
								className="absolute right-2 top-1/2 -translate-y-1/2"
							>
								Buscar
							</Button>
						</div>

						{/* Resultados de búsqueda */}
						{searchResults.length > 0 && (
							<div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
								{searchResults.map((user) => (
									<button
										key={user.id}
										type="button"
										onClick={() => handleSelectUser(user)}
										className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-muted transition-colors text-left"
									>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<User className="w-5 h-5 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{user.fullName}
											</p>
											<p className="text-xs text-foreground/60 truncate">
												{user.email}
											</p>
										</div>
										{user.role && (
											<Badge variant={ROLE_VARIANTS[user.role]}>
												{ROLE_LABELS[user.role]}
											</Badge>
										)}
									</button>
								))}
							</div>
						)}

						{/* Sin resultados */}
						{searchResults.length === 0 && searchQuery && !isSearching && (
							<p className="text-sm text-foreground/60 text-center py-4">
								No se encontraron usuarios con ese criterio de búsqueda.
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Tarjeta de Usuario Seleccionado */}
			{selectedUser && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between w-full">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<User className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">
										{selectedUser.fullName}
									</h3>
									<p className="text-sm text-foreground/60">{selectedUser.email}</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Badge variant={ROLE_VARIANTS[userRole]} className="text-sm">
									{ROLE_LABELS[userRole]}
								</Badge>
								<button
									type="button"
									onClick={handleClearUser}
									className="p-2 hover:bg-surface-muted rounded-lg transition-colors"
									aria-label="Cerrar"
								>
									<X className="w-4 h-4 text-foreground/60" />
								</button>
							</div>
						</div>
					</CardHeader>
				</Card>
			)}

			{/* Matriz de Permisos */}
			{selectedUser && (
				<Card>
					<CardHeader>
						<CardTitle>Permisos del Usuario</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingPermissions ? (
							<div className="flex items-center justify-center py-12">
								<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						) : (
							<div className="space-y-6">
								{/* Leyenda */}
								<div className="flex flex-wrap gap-4 text-sm text-foreground/70 p-3 bg-surface-muted rounded-lg">
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded border-2 border-primary bg-primary/20" />
										<span>Incluido por Rol (no editable)</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 rounded border-2 border-border bg-surface" />
										<span>Permiso Personalizado (editable)</span>
									</div>
								</div>

								{/* Módulos de Permisos */}
								<div className="grid gap-4 md:grid-cols-2">
									{Object.entries(ALL_PERMISSIONS).map(([module, permissions]) => (
										<div
											key={module}
											className="border border-border rounded-lg overflow-hidden"
										>
											<div className="px-4 py-3 bg-surface-muted border-b border-border">
												<h4 className="font-medium text-foreground flex items-center gap-2">
													<span>{MODULE_ICONS[module] || "📁"}</span>
													{module}
												</h4>
											</div>
											<div className="p-4 space-y-3">
												{permissions.map((permission) => {
													const isFromRole = isRolePermission(permission);
													const isChecked = isFromRole || hasCustomPermission(permission);

													return (
														<label
															key={permission}
															className={cn(
																"flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
																isFromRole
																	? "bg-primary/5 cursor-not-allowed"
																	: "hover:bg-surface-muted"
															)}
														>
															<input
																type="checkbox"
																checked={isChecked}
																onChange={() => togglePermission(permission)}
																disabled={isFromRole}
																className={cn(
																	"w-4 h-4 rounded border-2 transition-colors",
																	isFromRole
																		? "border-primary bg-primary/20 cursor-not-allowed accent-primary"
																		: "border-border cursor-pointer accent-primary"
																)}
															/>
															<span
																className={cn(
																	"text-sm flex-1",
																	isFromRole
																		? "text-foreground/70"
																		: "text-foreground"
																)}
															>
																{formatPermissionLabel(permission)}
															</span>
															{isFromRole && (
																<Badge variant="default" className="text-xs">
																	Por Rol
																</Badge>
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
												<Badge key={permission} variant="info">
													{formatPermissionLabel(permission)}
												</Badge>
											))}
										</div>
									</div>
								)}

								{/* Botón de Guardar */}
								<div className="flex justify-end gap-3 pt-4 border-t border-border">
									<Button
										variant="outline"
										onClick={handleClearUser}
										disabled={isSaving}
									>
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
						)}
					</CardContent>
				</Card>
			)}

			{/* Estado inicial - sin usuario seleccionado */}
			{!selectedUser && (
				<Card>
					<CardContent className="py-12">
						<div className="flex flex-col items-center justify-center text-center">
							<div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-4">
								<Shield className="w-8 h-8 text-foreground/40" />
							</div>
							<h3 className="text-lg font-medium text-foreground mb-2">
								Selecciona un Usuario
							</h3>
							<p className="text-sm text-foreground/60 max-w-md">
								Busca un usuario por email, nombre o documento para gestionar sus
								permisos granulares. Los permisos son aditivos al rol base del
								usuario.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea un permiso técnico a un label legible.
 * Ej: "users:create" -> "Crear Usuarios"
 */
function formatPermissionLabel(permission: Permission): string {
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
}
