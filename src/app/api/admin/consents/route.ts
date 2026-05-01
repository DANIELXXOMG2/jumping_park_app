import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { listAdminConsents } from "@/services/adminConsentListService";

const logger = createLogger("ApiAdminConsents");

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	cursor: z.string().optional(),
	userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"consents:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);
		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
			cursor: searchParams.get("cursor") || undefined,
			userId: searchParams.get("userId") || undefined,
		});

		const result = await listAdminConsents(query);
		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Parámetros inválidos", details: error.issues },
				{ status: 400 },
			);
		}

		logger.error("Error obteniendo consentimientos", error);
		return NextResponse.json(
			{ error: "Error al obtener consentimientos" },
			{ status: 500 },
		);
	}
}
