import { Timestamp } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const ConsentClauseSchema = z.object({
	id: z.number(),
	text: z.string().min(1, "El texto de la cláusula es requerido"),
	highlight: z.boolean().optional(),
	icon: z.string().optional(),
	highlightLabel: z.string().optional(),
});

const ParkRuleSchema = z.object({
	id: z.number(),
	text: z.string().min(1, "El texto de la regla es requerido"),
	highlight: z.boolean().optional(),
	icon: z.string().optional(),
	highlightLabel: z.string().optional(),
});

const ConsentContentSchema = z.object({
	meta: z.object({
		version: z.string(),
		lastUpdated: z.string(),
		companyName: z.string().min(1, "El nombre de la empresa es requerido"),
	}),
	consent: z.object({
		title: z.string().min(1, "El título es requerido"),
		subtitle: z.string().min(1, "El subtítulo es requerido"),
		introduction: z.string().min(1, "La introducción es requerida"),
		clauses: z
			.array(ConsentClauseSchema)
			.min(1, "Se requiere al menos una cláusula"),
		closingStatement: z
			.string()
			.min(1, "La declaración de cierre es requerida"),
	}),
	rules: z.object({
		title: z.string().min(1, "El título de reglas es requerido"),
		introduction: z.string().min(1, "La introducción de reglas es requerida"),
		items: z.array(ParkRuleSchema).min(1, "Se requiere al menos una regla"),
		closingMessage: z.string().min(1, "El mensaje de cierre es requerido"),
	}),
});

// Schema para el contenido multilenguaje
const MultiLanguageContentSchema = z.object({
	es: ConsentContentSchema,
	en: ConsentContentSchema,
});

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/admin/settings/consent
 *
 * Obtiene el contenido actual del consentimiento desde Firestore (ambos idiomas).
 * Requiere autenticación de admin.
 */
export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso settings:manage
		const authResult = await verifyAdminTokenWithPermission(request, "settings:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		// Leer ambos documentos en paralelo
		const [esDocSnap, enDocSnap] = await Promise.all([
			db.collection("settings").doc("consent_v1").get(),
			db.collection("settings").doc("consent_v1_en").get(),
		]);

		// Si no existe ninguno, devolver null
		if (!esDocSnap.exists && !enDocSnap.exists) {
			return NextResponse.json({
				success: true,
				data: null,
				message:
					"No hay configuración personalizada, usando valores por defecto",
			});
		}

		// Construir objeto multilenguaje
		const esData = esDocSnap.exists ? esDocSnap.data() : null;
		const enData = enDocSnap.exists ? enDocSnap.data() : null;

		// Si existe al menos uno, construir respuesta
		const responseData = {
			...(esData && { es: esData }),
			...(enData && { en: enData }),
		};

		return NextResponse.json({
			success: true,
			data: responseData,
			updatedAt: esData?.updatedAt?.toDate?.()?.toISOString() || enData?.updatedAt?.toDate?.()?.toISOString() || null,
			updatedBy: esData?.updatedBy || enData?.updatedBy || null,
		});
	} catch (error) {
		console.error("Error fetching consent settings:", error);
		return NextResponse.json(
			{ success: false, error: "Error al obtener configuración" },
			{ status: 500 },
		);
	}
}

/**
 * POST /api/admin/settings/consent
 *
 * Guarda/actualiza el contenido del consentimiento en Firestore (ambos idiomas).
 * Acepta estructura { es: ConsentContent, en: ConsentContent }
 * Requiere autenticación de admin.
 */
export async function POST(request: NextRequest) {
	try {
		// Verificar autenticación y permiso settings:manage
		const authResult = await verifyAdminTokenWithPermission(request, "settings:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		const body = await request.json();

		// Validar estructura del contenido multilenguaje
		const validation = MultiLanguageContentSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Datos inválidos",
					details: validation.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const { es, en } = validation.data;
		const now = Timestamp.now();
		const lastUpdated = new Date().toISOString().split("T")[0];
		const updatedBy = {
			uid: authResult.uid,
			email: authResult.email,
		};

		// Preparar datos para español
		const esDataToSave = {
			...es,
			meta: { ...es.meta, lastUpdated },
			updatedAt: now,
			updatedBy,
		};

		// Preparar datos para inglés
		const enDataToSave = {
			...en,
			meta: { ...en.meta, lastUpdated },
			updatedAt: now,
			updatedBy,
		};

		// Guardar ambos idiomas en paralelo
		await Promise.all([
			db.collection("settings").doc("consent_v1").set(esDataToSave, { merge: false }),
			db.collection("settings").doc("consent_v1_en").set(enDataToSave, { merge: false }),
		]);

		return NextResponse.json({
			success: true,
			message: "Configuración guardada exitosamente en todos los idiomas",
			data: { es: esDataToSave, en: enDataToSave },
		});
	} catch (error) {
		console.error("Error saving consent settings:", error);
		return NextResponse.json(
			{ success: false, error: "Error al guardar configuración" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/admin/settings/consent
 *
 * Elimina la configuración personalizada de ambos idiomas.
 * Requiere autenticación de admin.
 */
export async function DELETE(request: NextRequest) {
	try {
		// Verificar autenticación y permiso settings:manage
		const authResult = await verifyAdminTokenWithPermission(request, "settings:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		// Eliminar ambos documentos en paralelo
		await Promise.all([
			db.collection("settings").doc("consent_v1").delete(),
			db.collection("settings").doc("consent_v1_en").delete(),
		]);

		return NextResponse.json({
			success: true,
			message: "Configuración eliminada. Se usará el contenido por defecto.",
		});
	} catch (error) {
		console.error("Error deleting consent settings:", error);
		return NextResponse.json(
			{ success: false, error: "Error al eliminar configuración" },
			{ status: 500 },
		);
	}
}
