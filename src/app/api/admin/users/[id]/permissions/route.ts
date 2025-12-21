import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { AVAILABLE_PERMISSIONS, type Permission } from "@/types/auth";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * Schema de validación para actualizar permisos.
 */
const updatePermissionsSchema = z.object({
	permissions: z
		.array(z.string())
		.refine(
			(perms) =>
				perms.every((p) =>
					AVAILABLE_PERMISSIONS.includes(p as Permission)
				),
			{
				message:
					"Uno o más permisos no son válidos. Consulta el catálogo de permisos disponibles.",
			}
		),
});

/**
 * PATCH /api/admin/users/[id]/permissions
 *
 * Actualiza los permisos personalizados (customPermissions) de un usuario.
 * Modelo ADITIVO: estos permisos se suman a los del rol base.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		// 1. Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		// 2. Parsear y validar body
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ error: "El body de la solicitud debe ser JSON válido" },
				{ status: 400 }
			);
		}

		const parseResult = updatePermissionsSchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Datos inválidos",
					details: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { permissions } = parseResult.data;

		// 3. Buscar el usuario en Firestore
		let userRef = db.collection("users").doc(id);
		let userDoc = await userRef.get();

		// Si no existe por ID de documento, buscar por campo uid
		if (!userDoc.exists) {
			const byUid = await db
				.collection("users")
				.where("uid", "==", id)
				.limit(1)
				.get();

			if (byUid.empty) {
				return NextResponse.json(
					{ error: "Usuario no encontrado" },
					{ status: 404 }
				);
			}

			userRef = byUid.docs[0].ref;
			userDoc = byUid.docs[0];
		}

		const userData = userDoc.data();
		if (!userData) {
			return NextResponse.json(
				{ error: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		// 4. Actualizar customPermissions en Firestore
		await userRef.update({
			customPermissions: permissions,
			updatedAt: new Date(),
		});

		return NextResponse.json({
			success: true,
			message: "Permisos actualizados correctamente",
			data: {
				userId: userData.uid,
				customPermissions: permissions,
			},
		});
	} catch (error) {
		console.error("[PATCH /api/admin/users/[id]/permissions] Error:", error);

		return NextResponse.json(
			{
				error: "Error interno del servidor",
				details:
					process.env.NODE_ENV === "development" && error instanceof Error
						? error.message
						: undefined,
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/admin/users/[id]/permissions
 *
 * Obtiene los permisos personalizados de un usuario.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// 1. Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		// 2. Buscar el usuario en Firestore
		let userDoc = await db.collection("users").doc(id).get();

		if (!userDoc.exists) {
			const byUid = await db
				.collection("users")
				.where("uid", "==", id)
				.limit(1)
				.get();

			if (byUid.empty) {
				return NextResponse.json(
					{ error: "Usuario no encontrado" },
					{ status: 404 }
				);
			}

			userDoc = byUid.docs[0];
		}

		const userData = userDoc.data();
		if (!userData) {
			return NextResponse.json(
				{ error: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			userId: userData.uid,
			role: userData.role || "visitor",
			customPermissions: userData.customPermissions || [],
			availablePermissions: AVAILABLE_PERMISSIONS,
		});
	} catch (error) {
		console.error("[GET /api/admin/users/[id]/permissions] Error:", error);

		return NextResponse.json(
			{
				error: "Error interno del servidor",
				details:
					process.env.NODE_ENV === "development" && error instanceof Error
						? error.message
						: undefined,
			},
			{ status: 500 }
		);
	}
}
