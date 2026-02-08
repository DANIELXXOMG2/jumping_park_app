/**
 * API Route: /api/usuarios/[uid]/menores
 * Obtiene los menores asociados a un usuario específico.
 *
 * PROTEGIDO: Requiere sesión OTP válida (el usuario debe haber validado su identidad).
 * Usado para el historial de participantes en el kiosko.
 * 
 * OPTIMIZADO: Usa la colección denormalizada minors_index en lugar de leer
 * múltiples consentimientos. Reduce de ~21 lecturas a ~N lecturas (N = cantidad de menores).
 */
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyOtpSession } from "@/services/authService";

interface RouteParams {
	params: Promise<{ uid: string }>;
}

/**
 * GET /api/usuarios/[uid]/menores
 * Retorna los menores únicos asociados a un usuario desde minors_index.
 *
 * SEGURIDAD: Solo accesible si el usuario validó su OTP en los últimos 15 minutos.
 */
export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	try {
		const { uid } = await params;

		if (!uid || uid.length < 5) {
			return NextResponse.json(
				{ error: "ID de usuario inválido" },
				{ status: 400 },
			);
		}

		// 🔒 VERIFICACIÓN DE SEGURIDAD: Validar sesión OTP
		const hasValidSession = await verifyOtpSession(uid);

		if (!hasValidSession) {
			console.warn(
				`[API /usuarios/${uid}/menores] Acceso denegado - Sin sesión OTP válida`,
			);
			return NextResponse.json(
				{ error: "No autorizado. Debe validar su identidad primero." },
				{ status: 401 },
			);
		}

		// OPTIMIZADO: Usar minors_index en lugar de leer users + múltiples consents
		// Esto reduce de ~21 lecturas a solo N lecturas (N = cantidad de menores del usuario)
		const minorsSnapshot = await db
			.collection("minors_index")
			.where("parentId", "==", uid)
			.orderBy("updatedAt", "desc")
			.limit(50) // Máximo 50 menores por usuario (más que suficiente)
			.get();

		const minors = minorsSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				firstName: data.firstName || "",
				lastName: data.lastName || "",
				birthDate: data.birthDate || "",
				relationship: data.relationship || "otro",
				eps: data.eps,
				idType: data.idType || "ti",
				idNumber: data.idNumber || doc.id,
				medicalCondition: data.medicalCondition,
				lastUsed: data.updatedAt?.toDate?.()?.toISOString(),
			};
		});

		return NextResponse.json({
			success: true,
			minors,
			total: minors.length,
		});
	} catch (error) {
		console.error("[API /usuarios/[uid]/menores] Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener historial de menores" },
			{ status: 500 },
		);
	}
}
