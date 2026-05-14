/**
 * API Route: GET /api/admin/consents/[id]/pdf
 *
 * Regenera el PDF del consentimiento en vuelo usando los datos de Firestore.
 * No guarda archivos en Storage para ahorrar costos.
 *
 * Requiere: Token de administrador válido.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { admin } from "@/lib/firebaseAdmin";
import { createLogger } from "@/lib/logger";
import { loadConsentSignatureBuffer } from "@/services/consentService";
import { generateConsentPdf } from "@/services/pdfService";
import type { Consent } from "@/types/firestore";

const db = admin.firestore();
const logger = createLogger("ApiAdminConsentPdf");

interface RouteParams {
	params: Promise<{ id: string }>;
}

export async function GET(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	// 1. Verificar autenticación y permiso consents:view
	const authResult = await verifyAdminTokenWithPermission(
		request,
		"consents:view",
	);
	if (!authResult.success) {
		return authResult.response;
	}

	try {
		// 2. Obtener ID del consentimiento
		const { id } = await params;

		if (!id || typeof id !== "string") {
			return NextResponse.json(
				{ error: "ID de consentimiento requerido" },
				{ status: 400 },
			);
		}

		// 3. Buscar documento en Firestore
		const consentDoc = await db.collection("consents").doc(id).get();

		if (!consentDoc.exists) {
			return NextResponse.json(
				{ error: "Consentimiento no encontrado" },
				{ status: 404 },
			);
		}

		const consentData = {
			id: consentDoc.id,
			...consentDoc.data(),
		} as Consent;

		let signatureBuffer: Buffer | undefined;

		try {
			signatureBuffer = await loadConsentSignatureBuffer(consentData);
		} catch (error) {
			logger.warn("No se pudo obtener la firma", error);
		}

		// 5. Generar PDF
		const pdfBuffer = await generateConsentPdf(consentData, signatureBuffer);

		// 6. Retornar PDF con headers adecuados
		const consecutivo =
			consentData.consecutivo || consentData.id?.slice(0, 8) || "sin-numero";
		const filename = `consentimiento-${consecutivo}.pdf`;

		// Convertir Buffer a Uint8Array para compatibilidad con NextResponse
		const pdfUint8Array = new Uint8Array(pdfBuffer);

		return new NextResponse(pdfUint8Array, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `inline; filename="${filename}"`,
				"Content-Length": pdfBuffer.length.toString(),
				"Cache-Control": "private, max-age=300", // Cache 5 minutos
			},
		});
	} catch (error) {
		logger.error("Error generando PDF administrativo", error);
		const errorMessage =
			error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json(
			{ error: "Error al generar el PDF", details: errorMessage },
			{ status: 500 },
		);
	}
}
