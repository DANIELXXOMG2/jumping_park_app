import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		const consentDoc = await db.collection("consents").doc(id).get();

		if (!consentDoc.exists) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		const data = consentDoc.data();
		if (!data) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		let currentUser = null;
		if (data.userId) {
			const userSnap = await db
				.collection("users")
				.where("uid", "==", data.userId)
				.limit(1)
				.get();

			if (!userSnap.empty) {
				const userData = userSnap.docs[0].data();
				currentUser = {
					id: userSnap.docs[0].id,
					uid: userData.uid,
					fullName: userData.fullName,
					email: userData.email,
					phone: userData.phone,
					minorsCount: userData.minors?.length || 0,
				};
			}
		}

		return NextResponse.json({
			consent: {
				id: consentDoc.id,
				consecutivo: data.consecutivo,
				userId: data.userId,
				adultSnapshot: data.adultSnapshot,
				minorsSnapshot: data.minorsSnapshot || [],
				signatureUrl: data.signatureUrl,
				policyVersion: data.policyVersion,
				ipAddress: data.ipAddress,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
				validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
			},
			currentUser,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener detalles del consentimiento" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/consents/[id]
 * Elimina un consentimiento.
 * Solo accesible por usuarios con rol 'admin'.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Verificar autenticación de admin con rol específico
		const authResult = await verifyAdminToken(request, "admin");
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		// Verificar que el consentimiento existe
		const consentDoc = await db.collection("consents").doc(id).get();

		if (!consentDoc.exists) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		// Eliminar el consentimiento
		await db.collection("consents").doc(id).delete();

		return NextResponse.json({
			success: true,
			message: "Consentimiento eliminado correctamente",
			deletedId: id,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al eliminar el consentimiento" },
			{ status: 500 },
		);
	}
}
