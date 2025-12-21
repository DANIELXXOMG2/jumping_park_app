import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPermissionOrSuperAdmin, isSuperAdmin, verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { AVAILABLE_PERMISSIONS } from "@/types/auth";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const updateRoleSchema = z.object({
	displayName: z
		.string()
		.min(2, "El nombre para mostrar debe tener al menos 2 caracteres")
		.max(100, "El nombre para mostrar no puede exceder 100 caracteres")
		.optional(),
	description: z
		.string()
		.max(500, "La descripción no puede exceder 500 caracteres")
		.optional(),
	permissions: z
		.array(z.string())
		.min(1, "Debe tener al menos un permiso")
		.optional(),
});

// ============================================================================
// TIPOS
// ============================================================================

interface RouteParams {
	params: Promise<{ id: string }>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si el usuario tiene permiso para gestionar roles.
 * Solo el Super Admin o usuarios con permiso 'roles:manage' pueden hacerlo.
 */
async function canManageRoles(uid: string, email: string): Promise<boolean> {
	// Super Admin siempre puede
	if (isSuperAdmin(email)) {
		return true;
	}

	// Buscar permisos del usuario en admin_users
	try {
		const userDoc = await db.collection("admin_users").doc(uid).get();
		if (!userDoc.exists) {
			return false;
		}

		const userData = userDoc.data();
		const userPermissions = userData?.customPermissions || [];
		const userRole = userData?.role;

		// Si tiene un rol, verificar sus permisos
		if (userRole) {
			const roleDoc = await db.collection("roles").doc(userRole).get();
			if (roleDoc.exists) {
				const roleData = roleDoc.data();
				const rolePermissions = roleData?.permissions || [];
				return hasPermissionOrSuperAdmin(email, "roles:manage", [
					...rolePermissions,
					...userPermissions,
				]);
			}
		}

		return hasPermissionOrSuperAdmin(email, "roles:manage", userPermissions);
	} catch (error) {
		console.error("[ROLES] Error verificando permisos:", error);
		return false;
	}
}

// ============================================================================
// GET /api/admin/roles/[id]
// Obtiene un rol específico por ID
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "ID del rol es requerido" },
				{ status: 400 }
			);
		}

		// Obtener rol desde Firestore
		const roleDoc = await db.collection("roles").doc(id).get();

		if (!roleDoc.exists) {
			return NextResponse.json(
				{ error: "Rol no encontrado" },
				{ status: 404 }
			);
		}

		const data = roleDoc.data();
		const role = {
			id: roleDoc.id,
			name: data?.name,
			displayName: data?.displayName,
			description: data?.description || undefined,
			permissions: data?.permissions || [],
			isSystem: data?.isSystem ?? false,
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
		};

		return NextResponse.json({ role });
	} catch (error) {
		console.error("[ROLES] Error en GET /api/admin/roles/[id]:", error);
		return NextResponse.json(
			{ error: "Error al obtener el rol" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// PUT /api/admin/roles/[id]
// Actualiza un rol existente
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		// Verificar permiso para gestionar roles
		const canManage = await canManageRoles(authResult.uid, authResult.email);
		if (!canManage) {
			return NextResponse.json(
				{ error: "No tienes permiso para gestionar roles" },
				{ status: 403 }
			);
		}

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "ID del rol es requerido" },
				{ status: 400 }
			);
		}

		// Verificar que el rol exista
		const roleRef = db.collection("roles").doc(id);
		const roleDoc = await roleRef.get();

		if (!roleDoc.exists) {
			return NextResponse.json(
				{ error: "Rol no encontrado" },
				{ status: 404 }
			);
		}

		const existingData = roleDoc.data();

		// Verificar si es un rol de sistema (solo el Super Admin puede modificarlos)
		if (existingData?.isSystem && !isSuperAdmin(authResult.email)) {
			return NextResponse.json(
				{ error: "Solo el Super Admin puede modificar roles de sistema" },
				{ status: 403 }
			);
		}

		// Parsear y validar body
		const body = await request.json();
		const validatedData = updateRoleSchema.parse(body);

		// Validar permisos si se proporcionan
		if (validatedData.permissions) {
			const invalidPermissions = validatedData.permissions.filter(
				(p) => !AVAILABLE_PERMISSIONS.includes(p as typeof AVAILABLE_PERMISSIONS[number])
			);

			if (invalidPermissions.length > 0) {
				return NextResponse.json(
					{
						error: "Permisos inválidos",
						invalidPermissions,
					},
					{ status: 400 }
				);
			}
		}

		// Construir datos de actualización
		const updateData: Record<string, unknown> = {
			updatedAt: FieldValue.serverTimestamp(),
			updatedBy: authResult.uid,
		};

		if (validatedData.displayName !== undefined) {
			updateData.displayName = validatedData.displayName;
		}

		if (validatedData.description !== undefined) {
			updateData.description = validatedData.description;
		}

		if (validatedData.permissions !== undefined) {
			updateData.permissions = validatedData.permissions;
		}

		// Actualizar el rol
		await roleRef.update(updateData);

		// Obtener el documento actualizado
		const updatedDoc = await roleRef.get();
		const data = updatedDoc.data();

		const role = {
			id: updatedDoc.id,
			name: data?.name,
			displayName: data?.displayName,
			description: data?.description || undefined,
			permissions: data?.permissions || [],
			isSystem: data?.isSystem ?? false,
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
		};

		console.log(`[ROLES] Rol '${id}' actualizado por ${authResult.email}`);

		return NextResponse.json({
			message: "Rol actualizado exitosamente",
			role,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("[ROLES] Error en PUT /api/admin/roles/[id]:", error);
		return NextResponse.json(
			{ error: "Error al actualizar el rol" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// DELETE /api/admin/roles/[id]
// Elimina un rol (con validaciones)
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		// Verificar permiso para gestionar roles
		const canManage = await canManageRoles(authResult.uid, authResult.email);
		if (!canManage) {
			return NextResponse.json(
				{ error: "No tienes permiso para gestionar roles" },
				{ status: 403 }
			);
		}

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "ID del rol es requerido" },
				{ status: 400 }
			);
		}

		// Verificar que el rol exista
		const roleRef = db.collection("roles").doc(id);
		const roleDoc = await roleRef.get();

		if (!roleDoc.exists) {
			return NextResponse.json(
				{ error: "Rol no encontrado" },
				{ status: 404 }
			);
		}

		const roleData = roleDoc.data();

		// Verificar si es un rol de sistema
		if (roleData?.isSystem) {
			return NextResponse.json(
				{ error: "No se pueden eliminar roles de sistema" },
				{ status: 403 }
			);
		}

		// Verificar que no haya usuarios usando este rol
		const usersWithRole = await db
			.collection("admin_users")
			.where("role", "==", id)
			.limit(1)
			.get();

		if (!usersWithRole.empty) {
			return NextResponse.json(
				{
					error: "No se puede eliminar el rol porque hay usuarios asignados a él",
					usersCount: usersWithRole.size,
				},
				{ status: 409 }
			);
		}

		// Eliminar el rol
		await roleRef.delete();

		console.log(`[ROLES] Rol '${id}' eliminado por ${authResult.email}`);

		return NextResponse.json({
			message: "Rol eliminado exitosamente",
			deletedRoleId: id,
		});
	} catch (error) {
		console.error("[ROLES] Error en DELETE /api/admin/roles/[id]:", error);
		return NextResponse.json(
			{ error: "Error al eliminar el rol" },
			{ status: 500 }
		);
	}
}
