/**
 * API Route: /api/admin/consents/[id]/resend
 * Reenvía el PDF del consentimiento al email del cliente.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { sendConsentEmail } from "@/services/emailService";
import { generateConsentPdf } from "@/services/pdfService";
import type { Consent } from "@/types/firestore";

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function POST(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
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
		console.log(`[Resend Consent] Generando PDF para consentimiento ${id}`);

		// El objeto consent de Firestore ya tiene la estructura Consent
		const consentForPdf: Consent = {
			...consent,
			id: consentDoc.id,
		};

		const pdfBuffer = await generateConsentPdf(consentForPdf);

		// Enviar el email
		console.log(`[Resend Consent] Enviando email a ${email}`);

		const emailResult = await sendConsentEmail({
			to: email,
			fullName: consent.adultSnapshot.fullName,
			consecutivo: consent.consecutivo,
			pdfBuffer,
		});

		if (!emailResult.success) {
			console.error(
				`[Resend Consent] Error enviando email: ${emailResult.error}`,
			);
			return NextResponse.json(
				{ error: emailResult.error || "Error al enviar el email" },
				{ status: 500 },
			);
		}

		console.log(`[Resend Consent] Email reenviado exitosamente a ${email}`);

		return NextResponse.json({
			success: true,
			message: `Consentimiento reenviado a ${email}`,
			email,
		});
	} catch (error) {
		console.error("[API /admin/consents/[id]/resend] Error:", error);
		return NextResponse.json(
			{ error: "Error al reenviar el consentimiento" },
			{ status: 500 },
		);
	}
}
