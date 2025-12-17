import { Timestamp } from "firebase-admin/firestore";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/adminAuth";
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

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/admin/settings/consent
 *
 * Obtiene el contenido actual del consentimiento desde Firestore.
 * Requiere autenticación de admin.
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const docRef = db.collection("settings").doc("consent_v1");
		const docSnap = await docRef.get();

		if (!docSnap.exists) {
			return NextResponse.json({
				success: true,
				data: null,
				message:
					"No hay configuración personalizada, usando valores por defecto",
			});
		}

		const data = docSnap.data();

		return NextResponse.json({
			success: true,
			data,
			updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
			updatedBy: data?.updatedBy || null,
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
 * Guarda/actualiza el contenido del consentimiento en Firestore.
 * Requiere autenticación de admin.
 */
export async function POST(request: NextRequest) {
	try {
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const body = await request.json();

		// Validar estructura del contenido
		const validation = ConsentContentSchema.safeParse(body);
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

		const contentData = validation.data;

		// Actualizar metadata
		const dataToSave = {
			...contentData,
			meta: {
				...contentData.meta,
				lastUpdated: new Date().toISOString().split("T")[0],
			},
			updatedAt: Timestamp.now(),
			updatedBy: {
				uid: authResult.uid,
				email: authResult.email,
			},
		};

		// Guardar en Firestore
		const docRef = db.collection("settings").doc("consent_v1");
		await docRef.set(dataToSave, { merge: false });

		return NextResponse.json({
			success: true,
			message: "Configuración guardada exitosamente",
			data: dataToSave,
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
 * Elimina la configuración personalizada (vuelve a usar el contenido por defecto).
 * Requiere autenticación de admin.
 */
export async function DELETE(request: NextRequest) {
	try {
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const docRef = db.collection("settings").doc("consent_v1");
		await docRef.delete();

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
