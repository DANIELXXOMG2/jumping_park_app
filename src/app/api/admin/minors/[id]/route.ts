import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db, admin } from "@/lib/firebaseAdmin";

interface RouteParams {
	params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/minors/[id]
 * Obtiene los detalles de un menor específico.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso minors:view
		const authResult = await verifyAdminTokenWithPermission(request, "minors:view");
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		// El ID tiene formato: {userId}_{index}
		const [userId, indexStr] = id.split("_");
		const minorIndex = Number.parseInt(indexStr, 10);

		if (!userId || Number.isNaN(minorIndex)) {
			return NextResponse.json(
				{ error: "ID de menor inválido" },
				{ status: 400 },
			);
		}

		// Buscar usuario por UID
		const userSnap = await db
			.collection("users")
			.where("uid", "==", userId)
			.limit(1)
			.get();

		if (userSnap.empty) {
			return NextResponse.json(
				{ error: "Usuario padre no encontrado" },
				{ status: 404 },
			);
		}

		const userDoc = userSnap.docs[0];
		const userData = userDoc.data();

		if (!userData.minors || !userData.minors[minorIndex]) {
			return NextResponse.json(
				{ error: "Menor no encontrado" },
				{ status: 404 },
			);
		}

		const minor = userData.minors[minorIndex];

		return NextResponse.json({
			minor: {
				id,
				fullName: minor.fullName || `${minor.firstName || ""} ${minor.lastName || ""}`.trim(),
				firstName: minor.firstName,
				lastName: minor.lastName,
				birthDate: minor.birthDate,
				relationship: minor.relationship,
				eps: minor.eps,
				idType: minor.idType,
				idNumber: minor.idNumber,
			},
			parent: {
				id: userDoc.id,
				uid: userData.uid,
				fullName: userData.fullName,
				email: userData.email,
				phone: userData.phone,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener detalles del menor" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/minors/[id]
 * Elimina un menor del array de menores del usuario padre.
 * Solo accesible por usuarios con permiso 'minors:edit'.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación y permiso minors:edit
		const authResult = await verifyAdminTokenWithPermission(request, "minors:edit");
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		// El ID tiene formato: {userId}_{index}
		const [userId, indexStr] = id.split("_");
		const minorIndex = Number.parseInt(indexStr, 10);

		if (!userId || Number.isNaN(minorIndex)) {
			return NextResponse.json(
				{ error: "ID de menor inválido" },
				{ status: 400 },
			);
		}

		// Buscar usuario por UID
		const userSnap = await db
			.collection("users")
			.where("uid", "==", userId)
			.limit(1)
			.get();

		if (userSnap.empty) {
			return NextResponse.json(
				{ error: "Usuario padre no encontrado" },
				{ status: 404 },
			);
		}

		const userDoc = userSnap.docs[0];
		const userData = userDoc.data();

		if (!userData.minors || !userData.minors[minorIndex]) {
			return NextResponse.json(
				{ error: "Menor no encontrado" },
				{ status: 404 },
			);
		}

		// Guardar info del menor para confirmar
		const deletedMinor = userData.minors[minorIndex];

		// Crear copia del array sin el menor
		const updatedMinors = [...userData.minors];
		updatedMinors.splice(minorIndex, 1);

		// Actualizar el documento del usuario
		await userDoc.ref.update({
			minors: updatedMinors,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return NextResponse.json({
			success: true,
			message: "Participante eliminado correctamente",
			deletedMinor: {
				fullName: deletedMinor.fullName || `${deletedMinor.firstName || ""} ${deletedMinor.lastName || ""}`.trim(),
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar el participante" },
			{ status: 500 },
		);
	}
}
