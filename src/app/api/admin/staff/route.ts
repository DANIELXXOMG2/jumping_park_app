import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { ROLE_PERMISSIONS, getEffectivePermissions, type UserRole } from "@/types/auth";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	role: z.string().min(1).optional(), // Roles dinámicos desde DB
});

const createStaffSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z
		.string()
		.min(6, "La contraseña debe tener al menos 6 caracteres"),
	fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	role: z.string().min(1, "El rol es requerido"), // Roles dinámicos desde DB
	avatar: z.string().optional(),
	phone: z.string().optional(),
	customPermissions: z.array(z.string()).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si el usuario autenticado tiene permisos para crear usuarios.
 * Solo Super Admins (con roles:manage) o usuarios con users:create pueden crear staff.
 * Retorna información detallada para debugging.
 */
async function hasCreateUserPermission(uid: string): Promise<{ hasPermission: boolean; role: string; permissions: string[] }> {
	try {
		console.log(`[STAFF] Intento de creación de staff por usuario: ${uid}`);

		// Buscar en admin_users (colección separada para staff)
		const userDoc = await db.collection("admin_users").doc(uid).get();
		if (!userDoc.exists) {
			console.log(`[STAFF] Usuario ${uid} no encontrado en admin_users`);
			return { hasPermission: false, role: "unknown", permissions: [] };
		}

		const userData = userDoc.data();
		const userRole = (userData?.role || "visitor") as UserRole;
		const customPermissions = userData?.customPermissions || [];

		console.log(`[STAFF] Rol detectado: ${userRole}`);

		// Usar getEffectivePermissions para obtener permisos combinados
		const effectivePermissions = getEffectivePermissions(userRole, customPermissions);

		console.log(`[STAFF] Permisos efectivos: ${JSON.stringify(effectivePermissions)}`);

		// Si el rol es 'admin', tiene acceso completo siempre
		if (userRole === "admin") {
			console.log(`[STAFF] Usuario es admin - acceso concedido automáticamente`);
			return { hasPermission: true, role: userRole, permissions: effectivePermissions };
		}

		// Verificar si tiene permiso para crear usuarios o gestionar roles
		const canCreate = effectivePermissions.includes("users:create") || effectivePermissions.includes("roles:manage");
		console.log(`[STAFF] Permiso users:create o roles:manage: ${canCreate}`);

		return { hasPermission: canCreate, role: userRole, permissions: effectivePermissions };
	} catch (error) {
		console.error(`[STAFF] Error verificando permisos para ${uid}:`, error);
		return { hasPermission: false, role: "error", permissions: [] };
	}
}

// ============================================================================
// GET /api/admin/staff
// Devuelve usuarios con rol 'admin' o 'cashier'
// ============================================================================

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
			role: searchParams.get("role") || undefined,
		});

		// Query para obtener staff de admin_users
		// Esta colección solo contiene admins y cajeros, separada de visitantes
		let usersQuery = db
			.collection("admin_users")
			.orderBy("createdAt", "desc");

		// Si se filtra por rol específico
		if (query.role) {
			usersQuery = db
				.collection("admin_users")
				.where("role", "==", query.role)
				.orderBy("createdAt", "desc");
		}

		const snapshot = await usersQuery.limit(500).get();

		let staff = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				uid: data.uid || doc.id,
				fullName: data.fullName,
				email: data.email,
				phone: data.phone || null,
				role: data.role,
				avatar: data.avatar || null,
				customPermissions: data.customPermissions || [],
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			};
		});

		// Filtrar por búsqueda si se proporciona
		if (query.search) {
			const searchLower = query.search.toLowerCase();
			staff = staff.filter(
				(user) =>
					user.fullName?.toLowerCase().includes(searchLower) ||
					user.email?.toLowerCase().includes(searchLower) ||
					user.phone?.includes(query.search!),
			);
		}

		const total = staff.length;
		const paginatedStaff = staff.slice(query.offset, query.offset + query.limit);

		return NextResponse.json({
			staff: paginatedStaff,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Parámetros inválidos", details: error.issues },
				{ status: 400 },
			);
		}
		console.error("Error en GET /api/admin/staff:", error);
		return NextResponse.json(
			{ error: "Error al obtener personal administrativo" },
			{ status: 500 },
		);
	}
}

// ============================================================================
// POST /api/admin/staff
// Crea un nuevo usuario administrativo (admin o cashier)
// ============================================================================

export async function POST(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		// Verificar permisos para crear usuarios
		const permissionResult = await hasCreateUserPermission(authResult.uid);
		if (!permissionResult.hasPermission) {
			console.warn(`[STAFF] Acceso denegado para usuario ${authResult.uid}. Rol: ${permissionResult.role}, Permisos: ${JSON.stringify(permissionResult.permissions)}`);
			return NextResponse.json(
				{ 
					error: "No tienes permisos para crear usuarios administrativos",
					details: {
						role: permissionResult.role,
						requiredPermission: "users:create",
						userPermissions: permissionResult.permissions
					}
				},
				{ status: 403 },
			);
		}

		// Parsear y validar body
		const body = await request.json();
		const validatedData = createStaffSchema.parse(body);

		// Verificar si el email ya existe en admin_users
		const existingUser = await db
			.collection("admin_users")
			.where("email", "==", validatedData.email)
			.limit(1)
			.get();

		if (!existingUser.empty) {
			return NextResponse.json(
				{ error: "Ya existe un usuario administrativo con ese email" },
				{ status: 409 },
			);
		}

		// Crear usuario en Firebase Auth
		const userRecord = await adminAuth.createUser({
			email: validatedData.email,
			password: validatedData.password,
			displayName: validatedData.fullName,
		});

		// Asignar custom claim de admin
		await adminAuth.setCustomUserClaims(userRecord.uid, {
			admin: true,
			role: validatedData.role,
		});

		// Crear documento en admin_users (colección separada para staff)
		const now = FieldValue.serverTimestamp();
		const staffData = {
			uid: userRecord.uid,
			fullName: validatedData.fullName,
			email: validatedData.email,
			phone: validatedData.phone || null,
			role: validatedData.role,
			avatar: validatedData.avatar || null,
			customPermissions: validatedData.customPermissions || [],
			createdAt: now,
			updatedAt: now,
			createdBy: authResult.uid,
		};

		await db.collection("admin_users").doc(userRecord.uid).set(staffData);

		return NextResponse.json(
			{
				message: "Usuario administrativo creado exitosamente",
				staff: {
					id: userRecord.uid,
					uid: userRecord.uid,
					fullName: validatedData.fullName,
					email: validatedData.email,
					phone: validatedData.phone || null,
					role: validatedData.role,
					avatar: validatedData.avatar || null,
					customPermissions: validatedData.customPermissions || [],
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: error.issues },
				{ status: 400 },
			);
		}

		// Manejo de errores específicos de Firebase Auth
		if (error instanceof Error) {
			if (error.message.includes("email-already-exists")) {
				return NextResponse.json(
					{ error: "El email ya está registrado en Firebase Auth" },
					{ status: 409 },
				);
			}
			if (error.message.includes("invalid-email")) {
				return NextResponse.json(
					{ error: "El formato del email es inválido" },
					{ status: 400 },
				);
			}
			if (error.message.includes("weak-password")) {
				return NextResponse.json(
					{ error: "La contraseña es muy débil" },
					{ status: 400 },
				);
			}
		}

		console.error("Error en POST /api/admin/staff:", error);
		return NextResponse.json(
			{ error: "Error al crear usuario administrativo" },
			{ status: 500 },
		);
	}
}
