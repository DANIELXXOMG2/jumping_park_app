import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db, adminAuth } from "@/lib/firebaseAdmin";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * Email del Super Admin que tiene permisos para eliminar staff.
 */
const SUPER_ADMIN_EMAIL = "jumpingadmin@gmail.com";

/**
 * Verifica si un email corresponde al Super Admin.
 */
function isSuperAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

// ============================================================================
// GET /api/admin/staff/[id]
// Obtiene detalles de un miembro del staff
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso users:view
		const authResult = await verifyAdminTokenWithPermission(request, "users:view");
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		const staffDoc = await db.collection("admin_users").doc(id).get();

		if (!staffDoc.exists) {
			return NextResponse.json(
				{ error: "Miembro del staff no encontrado" },
				{ status: 404 }
			);
		}

		const data = staffDoc.data();

		return NextResponse.json({
			staff: {
				id: staffDoc.id,
				uid: data?.uid || staffDoc.id,
				fullName: data?.fullName,
				email: data?.email,
				phone: data?.phone || null,
				role: data?.role,
				avatar: data?.avatar || null,
				customPermissions: data?.customPermissions || [],
				createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
			},
		});
	} catch (error) {
		console.error("Error en GET /api/admin/staff/[id]:", error);
		return NextResponse.json(
			{ error: "Error al obtener miembro del staff" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// DELETE /api/admin/staff/[id]
// Elimina un miembro del staff (SOLO SUPER ADMIN)
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso roles:manage (solo super admin)
		const authResult = await verifyAdminTokenWithPermission(request, "roles:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		// Obtener información del usuario autenticado
		const authUserDoc = await db.collection("admin_users").doc(authResult.uid).get();
		const authUserEmail = authUserDoc.data()?.email;

		// Solo Super Admin puede eliminar staff
		if (!isSuperAdmin(authUserEmail)) {
			return NextResponse.json(
				{ error: "Solo el Super Admin puede eliminar miembros del equipo" },
				{ status: 403 }
			);
		}

		const { id } = await params;

		// No permitir auto-eliminación
		if (id === authResult.uid) {
			return NextResponse.json(
				{ error: "No puedes eliminarte a ti mismo" },
				{ status: 400 }
			);
		}

		// Verificar que el staff existe
		const staffDoc = await db.collection("admin_users").doc(id).get();
		if (!staffDoc.exists) {
			return NextResponse.json(
				{ error: "Miembro del staff no encontrado" },
				{ status: 404 }
			);
		}

		const staffData = staffDoc.data();
		const staffEmail = staffData?.email;

		// Proteger al Super Admin de ser eliminado
		if (isSuperAdmin(staffEmail)) {
			return NextResponse.json(
				{ error: "No se puede eliminar al Super Admin" },
				{ status: 403 }
			);
		}

		// Eliminar de Firebase Auth
		try {
			await adminAuth.deleteUser(id);
		} catch (authError) {
			// Si el usuario no existe en Auth, continuamos (podría haberse eliminado manualmente)
			console.warn(`Usuario ${id} no encontrado en Firebase Auth:`, authError);
		}

		// Eliminar documento de admin_users
		await db.collection("admin_users").doc(id).delete();

		return NextResponse.json({
			message: "Miembro del equipo eliminado exitosamente",
			deletedId: id,
		});
	} catch (error) {
		console.error("Error en DELETE /api/admin/staff/[id]:", error);
		return NextResponse.json(
			{ error: "Error al eliminar miembro del equipo" },
			{ status: 500 }
		);
	}
}
