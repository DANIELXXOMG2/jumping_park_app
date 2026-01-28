import { type NextRequest, NextResponse } from "next/server";
import {
	CONSENT_CONTENT_BY_LANGUAGE,
	type ConsentContentStructure,
	DEFAULT_CONSENT_CONTENT,
	getConsentContent,
} from "@/lib/data/legalContent";
import { db } from "@/lib/firebaseAdmin";
import type { Language } from "@/lib/i18n/dictionary";

/**
 * GET /api/settings/consent
 *
 * Endpoint público que devuelve el contenido del consentimiento informado.
 * Soporta parámetro de idioma: ?lang=es | ?lang=en
 * Si no existe en Firestore, devuelve el contenido por defecto en el idioma solicitado.
 *
 * Respuesta:
 * - 200: ConsentContentStructure
 * - 500: Error interno
 */
export async function GET(request: NextRequest) {
	// Obtener idioma del query param (default: 'es')
	const { searchParams } = new URL(request.url);
	const langParam = searchParams.get("lang");
	const language: Language = langParam === "en" ? "en" : "es";

	try {
		// Intentar obtener desde Firestore (con sufijo de idioma)
		const docId = language === "en" ? "consent_v1_en" : "consent_v1";
		const docRef = db.collection("settings").doc(docId);
		const docSnap = await docRef.get();

		if (docSnap.exists) {
			const data = docSnap.data() as ConsentContentStructure;

			return NextResponse.json({
				success: true,
				data,
				source: "firestore",
				language,
			});
		}

		// Fallback al contenido por defecto en el idioma solicitado
		const defaultContent = getConsentContent(language);
		return NextResponse.json({
			success: true,
			data: defaultContent,
			source: "default",
			language,
		});
	} catch (error) {
		console.error("Error fetching consent settings:", error);

		// En caso de error, devolver el contenido por defecto en el idioma solicitado
		const fallbackContent = CONSENT_CONTENT_BY_LANGUAGE[language] || DEFAULT_CONSENT_CONTENT;
		return NextResponse.json({
			success: true,
			data: fallbackContent,
			source: "default-fallback",
			language,
			warning: "Error al conectar con Firestore, usando contenido por defecto",
		});
	}
}
