import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { createLogger } from "@/lib/logger";
import {
	ADMIN_METRIC_PERIOD,
	type AdminMetricPeriod,
	adminMetricsService,
} from "@/services/adminMetricsService";

const logger = createLogger("ApiAdminDetailedStats");

export const ADMIN_DETAILED_STATS_ROUTE_SOURCE = {
	AGGREGATE: "aggregate",
	LIVE: "live",
} as const;

export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminTokenWithPermission(
			request,
			"statistics:view",
		);
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);
		const period =
			(searchParams.get("period") as AdminMetricPeriod | null) ||
			ADMIN_METRIC_PERIOD.MONTH;
		const shouldRecompute = searchParams.get("recompute") === "true";
		const hardeningPolicy = resolveHardeningPolicy();

		let payload;
		if (!hardeningPolicy.aggregatesEnabled) {
			payload = await adminMetricsService.buildAdminLiveDetailedStatsResponse(period);
		} else {
			const result = await adminMetricsService.getDetailed(period, {
				forceRecompute: shouldRecompute,
			});
			if (result) {
				payload = {
					...result,
					meta: {
						source: ADMIN_DETAILED_STATS_ROUTE_SOURCE.AGGREGATE,
						fallbackApplied: false,
					},
				};
			} else {
				const fallback = await adminMetricsService.buildAdminLiveDetailedStatsResponse(period);
				payload = {
					...fallback,
					meta: {
						source: ADMIN_DETAILED_STATS_ROUTE_SOURCE.LIVE,
						fallbackApplied: true,
					},
				};
			}
		}

		return NextResponse.json(payload);
	} catch (error) {
		logger.error("Error obteniendo estadisticas detalladas", error);
		return NextResponse.json(
			{ error: "Error al obtener estadísticas" },
			{ status: 500 },
		);
	}
}
