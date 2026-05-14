import { type NextRequest, NextResponse } from "next/server";
import {
	CONSENT_CONTENT_BY_LANGUAGE,
	type ConsentContentStructure,
	DEFAULT_CONSENT_CONTENT,
	getConsentContent,
} from "@/lib/data/legalContent";
import type { Language } from "@/lib/i18n/dictionary";
import { createLogger } from "@/lib/logger";
import { consentService } from "@/services/consentService";

const logger = createLogger("ApiSettingsConsent");

/**
 * GET /api/settings/consent
 *
 * Endpoint público que devuelve el contenido del consentimiento informado.
 * Soporta parámetro de idioma: ?lang=es | ?lang=en
 * Si no existe en Firestore, devuelve el contenido por defecto en el idioma solicitado.
 *
 * Respuesta:
 * - 200: ConsentContentStructure (con source: "firestore" | "default" | "default-fallback")
 */
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const langParam = searchParams.get("lang");
	const language: Language = langParam === "en" ? "en" : "es";

	try {
		const data = await consentService.getConsentSettings(language);

		if (data) {
			return NextResponse.json({
				success: true,
				data: data as ConsentContentStructure,
				source: "firestore",
				language,
			});
		}

		const defaultContent = getConsentContent(language);
		return NextResponse.json({
			success: true,
			data: defaultContent,
			source: "default",
			language,
		});
	} catch (error) {
		logger.error("Error fetching consent settings", error);

		const fallbackContent =
			CONSENT_CONTENT_BY_LANGUAGE[language] || DEFAULT_CONSENT_CONTENT;
		return NextResponse.json({
			success: true,
			data: fallbackContent,
			source: "default-fallback",
			language,
			warning: "Error al conectar con Firestore, usando contenido por defecto",
		});
	}
}
