/**
 * API Route: /api/usuarios/[uid]/menores
 * Obtiene los menores asociados a un usuario específico.
 *
 * PROTEGIDO: Requiere sesión OTP válida (el usuario debe haber validado su identidad).
 * Usado para el historial de acompañantes en el kiosko.
 */
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyOtpSession } from "@/services/authService";

interface RouteParams {
	params: Promise<{ uid: string }>;
}

/**
 * GET /api/usuarios/[uid]/menores
 * Retorna los menores únicos asociados a un usuario desde sus consentimientos previos.
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

		// Buscar en la colección de usuarios primero
		const userDoc = await db.collection("users").doc(uid).get();

		// También buscar en consentimientos para obtener menores históricos
		const consentsSnapshot = await db
			.collection("consents")
			.where("userId", "==", uid)
			.orderBy("signedAt", "desc")
			.limit(20) // Últimos 20 consentimientos
			.get();

		// Mapa para evitar duplicados (por idNumber)
		const minorsMap = new Map<
			string,
			{
				firstName: string;
				lastName: string;
				birthDate: string;
				relationship: string;
				eps?: string;
				idType?: string;
				idNumber: string;
				medicalCondition?: string;
				lastUsed?: string; // Fecha del último consentimiento donde apareció
			}
		>();

		// Agregar menores del perfil de usuario
		if (userDoc.exists) {
			const userData = userDoc.data();
			const userMinors = userData?.minors || [];

			for (const minor of userMinors) {
				if (minor.idNumber) {
					minorsMap.set(minor.idNumber, {
						firstName: minor.firstName || "",
						lastName: minor.lastName || "",
						birthDate: minor.birthDate || "",
						relationship: minor.relationship || "otro",
						eps: minor.eps,
						idType: minor.idType || "ti",
						idNumber: minor.idNumber,
						medicalCondition: minor.medicalCondition,
					});
				}
			}
		}

		// Agregar menores de consentimientos previos (puede tener más info actualizada)
		for (const doc of consentsSnapshot.docs) {
			const consent = doc.data();
			const minorsSnapshot = consent.minorsSnapshot || [];
			const signedAt = consent.signedAt?.toDate?.() || new Date();

			for (const minor of minorsSnapshot) {
				if (minor.idNumber) {
					const existing = minorsMap.get(minor.idNumber);

					// Solo actualizar si no existe o si este es más reciente
					if (!existing || !existing.lastUsed) {
						minorsMap.set(minor.idNumber, {
							firstName: minor.firstName || "",
							lastName: minor.lastName || "",
							birthDate: minor.birthDate || "",
							relationship: minor.relationship || "otro",
							eps: minor.eps,
							idType: minor.idType || "ti",
							idNumber: minor.idNumber,
							medicalCondition: minor.medicalCondition,
							lastUsed: signedAt.toISOString(),
						});
					}
				}
			}
		}

		// Convertir a array y ordenar por último uso
		const minors = Array.from(minorsMap.values()).sort((a, b) => {
			if (!a.lastUsed && !b.lastUsed) return 0;
			if (!a.lastUsed) return 1;
			if (!b.lastUsed) return -1;
			return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
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
