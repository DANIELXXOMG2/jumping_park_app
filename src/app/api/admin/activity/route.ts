/**
 * API Route: /api/admin/activity
 * Retorna la actividad del día actual con los últimos consentimientos.
 * OPTIMIZADO: Usa .select() para reducir lecturas de campos innecesarios.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { adminMetricsService } from "@/services/adminMetricsService";

const logger = createLogger("ApiAdminActivity");

export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"dashboard:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const now = new Date();
		const activity = await adminMetricsService.getAdminActivity();

		return NextResponse.json(
			{
				success: true,
				stats: {
					consentsToday: activity.consentsToday,
					minorsToday: activity.minorsToday,
					timestamp: now.toISOString(),
				},
				latestConsents: activity.latestConsents,
				hourlyData: activity.hourlyData,
			},
			{
				headers: {
					"Cache-Control": "private, max-age=30, stale-while-revalidate=60",
				},
			},
		);
	} catch (error) {
		logger.error("Error obteniendo actividad", error);
		return NextResponse.json(
			{ error: "Error al obtener actividad" },
			{ status: 500 },
		);
	}
}
