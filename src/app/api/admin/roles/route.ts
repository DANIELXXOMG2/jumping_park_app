import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPermissionOrSuperAdmin, isSuperAdmin, verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { AVAILABLE_PERMISSIONS } from "@/types/auth";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const createRoleSchema = z.object({
	name: z
		.string()
		.min(2, "El nombre debe tener al menos 2 caracteres")
		.max(50, "El nombre no puede exceder 50 caracteres")
		.regex(
			/^[a-z_]+$/,
			"El nombre solo puede contener letras minúsculas y guiones bajos"
		),
	displayName: z
		.string()
		.min(2, "El nombre para mostrar debe tener al menos 2 caracteres")
		.max(100, "El nombre para mostrar no puede exceder 100 caracteres"),
	description: z
		.string()
		.max(500, "La descripción no puede exceder 500 caracteres")
		.optional(),
	permissions: z
		.array(z.string())
		.min(1, "Debe tener al menos un permiso"),
	isSystem: z.boolean().optional().default(false),
});

// ============================================================================
// TIPOS
// ============================================================================

export interface Role {
	id: string;
	name: string;
	displayName: string;
	description?: string;
	permissions: string[];
	isSystem: boolean;
	createdAt: string | null;
	updatedAt: string | null;
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

		// Si es admin, verificar en la colección roles
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
// GET /api/admin/roles
// Devuelve la lista de roles desde Firestore
// ============================================================================

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		// Obtener roles desde Firestore
		const rolesSnapshot = await db
			.collection("roles")
			.orderBy("name", "asc")
			.get();

		const roles: Role[] = rolesSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				name: data.name,
				displayName: data.displayName,
				description: data.description || undefined,
				permissions: data.permissions || [],
				isSystem: data.isSystem ?? false,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			};
		});

		// También devolver los permisos disponibles para la UI
		return NextResponse.json({
			roles,
			availablePermissions: AVAILABLE_PERMISSIONS,
			total: roles.length,
		});
	} catch (error) {
		console.error("[ROLES] Error en GET /api/admin/roles:", error);
		return NextResponse.json(
			{ error: "Error al obtener roles" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// POST /api/admin/roles
// Crea un nuevo rol en Firestore
// ============================================================================

export async function POST(request: NextRequest) {
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

		// Parsear y validar body
		const body = await request.json();
		const validatedData = createRoleSchema.parse(body);

		// Verificar que el nombre no exista
		const existingRole = await db
			.collection("roles")
			.where("name", "==", validatedData.name)
			.get();

		if (!existingRole.empty) {
			return NextResponse.json(
				{ error: `Ya existe un rol con el nombre '${validatedData.name}'` },
				{ status: 409 }
			);
		}

		// Validar que los permisos sean válidos
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

		// Crear el rol en Firestore
		const roleData = {
			name: validatedData.name,
			displayName: validatedData.displayName,
			description: validatedData.description || null,
			permissions: validatedData.permissions,
			isSystem: validatedData.isSystem,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
			createdBy: authResult.uid,
		};

		// Usar el nombre como ID para facilitar referencias
		const roleRef = db.collection("roles").doc(validatedData.name);
		await roleRef.set(roleData);

		// Obtener el documento creado
		const createdDoc = await roleRef.get();
		const data = createdDoc.data();

		const role: Role = {
			id: createdDoc.id,
			name: data?.name,
			displayName: data?.displayName,
			description: data?.description || undefined,
			permissions: data?.permissions || [],
			isSystem: data?.isSystem ?? false,
			createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
		};

		console.log(`[ROLES] Rol '${validatedData.name}' creado por ${authResult.email}`);

		return NextResponse.json(
			{
				message: "Rol creado exitosamente",
				role,
			},
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: error.issues },
				{ status: 400 }
			);
		}

		console.error("[ROLES] Error en POST /api/admin/roles:", error);
		return NextResponse.json(
			{ error: "Error al crear el rol" },
			{ status: 500 }
		);
	}
}
