/**
 * API Route: /api/admin/consents/[id]/resend
 * Reenvía el PDF del consentimiento al email del cliente.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { createLogger } from "@/lib/logger";
import { sendConsentEmail } from "@/services/emailService";
import { generateConsentPdf } from "@/services/pdfService";
import type { Consent } from "@/types/firestore";

const logger = createLogger("ApiAdminConsentResend");

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function POST(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	try {
		// Verificar autenticación y permiso consents:view (reenviar requiere poder ver)
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"consents:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "ID de consentimiento requerido" },
				{ status: 400 },
			);
		}

		// Obtener el consentimiento
		const consentDoc = await db.collection("consents").doc(id).get();

		if (!consentDoc.exists) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		const consent = consentDoc.data() as Consent;

		// Verificar que tenga email
		const email = consent.adultSnapshot?.email;
		if (!email) {
			return NextResponse.json(
				{ error: "El consentimiento no tiene email asociado" },
				{ status: 400 },
			);
		}

		// Regenerar el PDF - pasamos el consentimiento completo
		logger.info(`Generando PDF para consentimiento ${id}`);

		// El objeto consent de Firestore ya tiene la estructura Consent
		const consentForPdf: Consent = {
			...consent,
			id: consentDoc.id,
		};

		const pdfBuffer = await generateConsentPdf(consentForPdf);

		// Enviar el email
		logger.info(`Enviando email a ${email}`);

		const emailResult = await sendConsentEmail({
			to: email,
			fullName: consent.adultSnapshot.fullName,
			consecutivo: consent.consecutivo,
			pdfBuffer,
		});

		if (!emailResult.success) {
			logger.error(`Error enviando email: ${emailResult.error ?? "unknown"}`);
			return NextResponse.json(
				{ error: emailResult.error || "Error al enviar el email" },
				{ status: 500 },
			);
		}

		logger.info(`Email reenviado exitosamente a ${email}`);

		return NextResponse.json({
			success: true,
			message: `Consentimiento reenviado a ${email}`,
			email,
		});
	} catch (error) {
		logger.error("Error reenviando consentimiento", error);
		return NextResponse.json(
			{ error: "Error al reenviar el consentimiento" },
			{ status: 500 },
		);
	}
}
