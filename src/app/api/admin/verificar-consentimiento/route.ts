import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { consentService, getConsentSignatureAccessUrl } from "@/services/consentService";
import type { Consent } from "@/types/firestore";

const logger = createLogger("ApiVerifyConsent");

const querySchema = z.object({
	cedula: z.string().min(6, "La cédula debe tener al menos 6 dígitos"),
});

export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"dashboard:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

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
		const result = await consentService.findConsentByCedula(cedulaValue);

		if (!result) {
			return NextResponse.json({
				found: false,
				message: "No se encontró ningún consentimiento para esta cédula",
			});
		}

		const { consentDoc, consentData, isExpired, expiresAt, signedAt } = result;
		const signatureUrl = consentData
			? await getConsentSignatureAccessUrl(consentData as Consent)
			: null;

		return NextResponse.json({
			found: true,
			isExpired,
			consent: {
				id: consentDoc.id,
				consecutivo: consentData.consecutivo,
				adultSnapshot: consentData.adultSnapshot || {
					fullName: "Nombre no disponible",
					uid: cedulaValue,
				},
				minorsSnapshot: consentData.minorsSnapshot || [],
				signaturePath: consentData.signaturePath || null,
				signatureUrl,
				signedAt,
				expiresAt,
			},
		});
	} catch (error) {
		logger.error("Error al verificar consentimiento", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
