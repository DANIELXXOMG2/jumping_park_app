import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { getConsentSignatureAccessUrl } from "@/services/consentService";
import type { Consent } from "@/types/firestore";

const querySchema = z.object({
	cedula: z.string().min(6, "La cédula debe tener al menos 6 dígitos"),
});

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso dashboard:view (usado en el visor de verificación)
		const authResult = await verifyAdminTokenWithPermission(request, "dashboard:view");
		if (!authResult.success) {
			return authResult.response;
		}

		// Obtener y validar parámetro de cédula
		const { searchParams } = new URL(request.url);
		const cedula = searchParams.get("cedula");

		const validation = querySchema.safeParse({ cedula });
		if (!validation.success) {
			return NextResponse.json(
				{ error: "Cédula inválida", details: validation.error.flatten() },
				{ status: 400 },
			);
		}

		const cedulaValue = validation.data.cedula;

		// Buscar por cédula del adulto (userId) o del menor (searchTokens)
		// Usar Promise.allSettled para que si una falla, la otra siga funcionando
		const [adultResult, minorResult] = await Promise.allSettled([
			db
				.collection("consents")
				.where("userId", "==", cedulaValue)
				.orderBy("signedAt", "desc")
				.limit(1)
				.get(),
			db
				.collection("consents")
				.where("searchTokens", "array-contains", cedulaValue)
				.limit(50)
				.get(),
		]);

		// Combinar resultados y encontrar el más reciente
		let consentDoc: FirebaseFirestore.DocumentSnapshot | null = null;
		let consentData: FirebaseFirestore.DocumentData | null = null;
		let latestSignedAt: Date | null = null;

		// Procesar resultados del adulto (userId)
		if (adultResult.status === "fulfilled" && !adultResult.value.empty) {
			consentDoc = adultResult.value.docs[0];
			consentData = consentDoc.data() || null;
			latestSignedAt = consentData?.signedAt?.toDate?.() || null;
		}

		// Procesar resultados del menor (searchTokens) - ordenar manualmente
		if (minorResult.status === "fulfilled" && !minorResult.value.empty) {
			// Ordenar manualmente por signedAt descendente
			const sortedDocs = minorResult.value.docs.sort((a, b) => {
				const aDate = a.data().signedAt?.toDate?.() || new Date(0);
				const bDate = b.data().signedAt?.toDate?.() || new Date(0);
				return bDate.getTime() - aDate.getTime();
			});

			const minorDoc = sortedDocs[0];
			const minorData = minorDoc.data() || null;
			const minorSignedAt = minorData?.signedAt?.toDate?.() || null;

			// Si no hay consentimiento de adulto, usar el del menor
			// O si el del menor es más reciente
			if (!consentDoc) {
				consentDoc = minorDoc;
				consentData = minorData;
			} else if (minorSignedAt && (!latestSignedAt || minorSignedAt > latestSignedAt)) {
				consentDoc = minorDoc;
				consentData = minorData;
			}
		}

		// Debug: log si hay errores en las consultas
		if (adultResult.status === "rejected") {
			console.error("[verificar-consentimiento] Error buscando por userId:", adultResult.reason);
		}
		if (minorResult.status === "rejected") {
			console.error("[verificar-consentimiento] Error buscando por searchTokens:", minorResult.reason);
		}

		// Si no hay consentimientos
		if (!consentDoc) {
			return NextResponse.json({
				found: false,
				message: "No se encontró ningún consentimiento para esta cédula",
			});
		}

		// Verificar si el consentimiento ha expirado usando el campo validUntil
		const now = new Date();
		let isExpired = true;
		let expiresAt: string | null = null;

		// Usar validUntil que ya existe en el documento
		if (consentData?.validUntil) {
			const validUntilDate = consentData.validUntil.toDate?.()
				? consentData.validUntil.toDate()
				: new Date(consentData.validUntil);
			expiresAt = validUntilDate.toISOString();
			isExpired = now > validUntilDate;
		}

		// Obtener fecha de firma
		const signedAt =
			consentData?.signedAt?.toDate?.()?.toISOString() ||
			consentData?.createdAt?.toDate?.()?.toISOString() ||
			null;
		const signatureUrl = consentData
			? await getConsentSignatureAccessUrl(consentData as Consent)
			: null;

		// Retornar resultado
		return NextResponse.json({
			found: true,
			isExpired,
			consent: {
				id: consentDoc.id,
				consecutivo: consentData?.consecutivo,
				adultSnapshot: consentData?.adultSnapshot || {
					fullName: "Nombre no disponible",
					uid: cedulaValue,
				},
				minorsSnapshot: consentData?.minorsSnapshot || [],
				signaturePath: consentData?.signaturePath || null,
				signatureUrl,
				signedAt,
				expiresAt,
			},
		});
	} catch (error) {
		console.error("Error al verificar consentimiento:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
