import { Timestamp } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFullAdminToken } from "@/lib/adminAuth";
import { adminAuth, db } from "@/lib/firebaseAdmin";
import { createLogger } from "@/lib/logger";
import {
	buildAdminAuditActor,
	buildAdminAuditRequest,
	commitAdminAuditBatch,
} from "@/services/adminAuditService";
import type { UserRole } from "@/types/auth";

const logger = createLogger("ApiAdminRoles");

/**
 * Schema de validación para asignar rol
 */
const setRoleSchema = z.object({
	email: z.string().email("Email inválido"),
	role: z
		.enum(["admin", "trabajador"])
		.refine((val) => ["admin", "trabajador"].includes(val), {
			message: "Rol inválido. Usar: admin o trabajador",
		}),
});

/**
 * Schema para revocar rol
 */
const revokeRoleSchema = z.object({
	email: z.string().email("Email inválido"),
});

/**
 * GET /api/admin/roles
 *
 * Lista todos los usuarios con roles administrativos.
 * Solo accesible por admins.
 */
export async function GET(request: NextRequest) {
	const auth = await verifyFullAdminToken(request);
	if (!auth.success) return auth.response;

	try {
		// Obtener todos los admin_users de Firestore
		const adminUsersSnapshot = await db.collection("admin_users").get();

		const users = adminUsersSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				uid: doc.id,
				email: data.email,
				displayName: data.displayName,
				photoURL: data.photoURL,
				role: data.role as UserRole,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
			};
		});

		return NextResponse.json({
			success: true,
			users,
			count: users.length,
		});
	} catch (error) {
		logger.error("Error listing admin users", error);
		return NextResponse.json(
			{ error: "Error al listar usuarios administrativos" },
			{ status: 500 },
		);
	}
}

/**
 * POST /api/admin/roles
 *
 * Asigna un rol a un usuario mediante Custom Claims.
 * Solo accesible por admins.
 *
 * Body: { email: string, role: "admin" | "trabajador" }
 */
export async function POST(request: NextRequest) {
	const auth = await verifyFullAdminToken(request);
	if (!auth.success) return auth.response;

	try {
		const body = await request.json();
		const { email, role } = setRoleSchema.parse(body);

		// Buscar usuario en Firebase Auth
		let user: Awaited<ReturnType<typeof adminAuth.getUserByEmail>> | undefined;
		try {
			user = await adminAuth.getUserByEmail(email);
		} catch {
			return NextResponse.json(
				{
					error: "Usuario no encontrado",
					message:
						"El usuario debe iniciar sesión al menos una vez antes de asignarle un rol.",
				},
				{ status: 404 },
			);
		}

		// No permitir que un admin se quite su propio rol de admin
		if (user.uid === auth.uid && role !== "admin") {
			return NextResponse.json(
				{ error: "No puedes cambiar tu propio rol de admin" },
				{ status: 400 },
			);
		}

		// Establecer Custom Claims con el rol
		await adminAuth.setCustomUserClaims(user.uid, {
			role: role,
			admin: role === "admin", // Mantener compatibilidad
		});

		// Guardar/actualizar en Firestore (backup y referencia)
		const adminUserRef = db.collection("admin_users").doc(user.uid);
		const adminUserDoc = await adminUserRef.get();

		const userData = {
			uid: user.uid,
			email: user.email || email,
			displayName: user.displayName || null,
			photoURL: user.photoURL || null,
			role: role,
			updatedAt: Timestamp.now(),
			updatedBy: auth.uid,
		};

		await commitAdminAuditBatch({
			apply: (batch) => {
				batch.set(adminUserRef, {
					...userData,
					...(adminUserDoc.exists
						? {}
						: {
								createdAt: Timestamp.now(),
								createdBy: auth.uid,
							}),
				});
			},
			audit: {
				action: "admin-role.assign",
				actor: buildAdminAuditActor(auth),
				target: { collection: "admin_users", id: user.uid, label: email },
				request: buildAdminAuditRequest(request),
				details: { role },
			},
		});

		return NextResponse.json({
			success: true,
			message: `Rol '${role}' asignado a ${email}`,
			user: {
				uid: user.uid,
				email: user.email,
				displayName: user.displayName,
				role,
			},
			note: "El usuario debe cerrar sesión y volver a iniciar para que los cambios surtan efecto.",
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: error.issues },
				{ status: 400 },
			);
		}

		logger.error("Error setting role", error);
		return NextResponse.json(
			{ error: "Error al asignar rol" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/roles
 *
 * Revoca el rol de un usuario (lo elimina del panel admin).
 * Solo accesible por admins.
 *
 * Body: { email: string }
 */
export async function DELETE(request: NextRequest) {
	const auth = await verifyFullAdminToken(request);
	if (!auth.success) return auth.response;

	try {
		const body = await request.json();
		const { email } = revokeRoleSchema.parse(body);

		// Buscar usuario en Firebase Auth
		let user: Awaited<ReturnType<typeof adminAuth.getUserByEmail>> | undefined;
		try {
			user = await adminAuth.getUserByEmail(email);
		} catch {
			return NextResponse.json(
				{ error: "Usuario no encontrado" },
				{ status: 404 },
			);
		}

		// No permitir que un admin se revoque a sí mismo
		if (user.uid === auth.uid) {
			return NextResponse.json(
				{ error: "No puedes revocar tu propio acceso de admin" },
				{ status: 400 },
			);
		}

		// Limpiar Custom Claims
		await adminAuth.setCustomUserClaims(user.uid, {
			role: null,
			admin: false,
		});

		const adminUserRef = db.collection("admin_users").doc(user.uid);
		await commitAdminAuditBatch({
			apply: (batch) => {
				batch.delete(adminUserRef);
			},
			audit: {
				action: "admin-role.revoke",
				actor: buildAdminAuditActor(auth),
				target: { collection: "admin_users", id: user.uid, label: email },
				request: buildAdminAuditRequest(request),
			},
		});

		return NextResponse.json({
			success: true,
			message: `Acceso administrativo revocado para ${email}`,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Datos inválidos", details: error.issues },
				{ status: 400 },
			);
		}

		logger.error("Error revoking role", error);
		return NextResponse.json(
			{ error: "Error al revocar rol" },
			{ status: 500 },
		);
	}
}
