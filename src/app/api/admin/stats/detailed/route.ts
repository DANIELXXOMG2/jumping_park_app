import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { createLogger } from "@/lib/logger";
import {
	ADMIN_METRIC_PERIOD,
	type AdminDetailedStats,
	type AdminMetricPeriod,
	adminMetricsService,
} from "@/services/adminMetricsService";

const logger = createLogger("ApiAdminDetailedStats");

export const ADMIN_DETAILED_STATS_ROUTE_SOURCE = {
	AGGREGATE: "aggregate",
	LIVE: "live",
} as const;

type AdminDetailedStatsRoutePayload = AdminDetailedStats & {
	meta: {
		source: "aggregate" | "live";
		fallbackApplied: boolean;
	};
};

export async function buildAdminLiveDetailedStatsResponse(
	period: AdminMetricPeriod,
): Promise<AdminDetailedStatsRoutePayload> {
	return adminMetricsService.buildAdminLiveDetailedStatsResponse(
		period,
	) as Promise<AdminDetailedStatsRoutePayload>;
}

export async function buildAdminDetailedStatsRouteResponse(options: {
	aggregatesEnabled: boolean;
	period: AdminMetricPeriod;
	shouldRecompute: boolean;
	getDetailed?: (
		period: AdminMetricPeriod,
		options?: { forceRecompute?: boolean },
	) => Promise<Awaited<
		ReturnType<typeof adminMetricsService.getDetailed>
	> | null>;
	getLiveDetailed?: typeof buildAdminLiveDetailedStatsResponse;
}): Promise<AdminDetailedStatsRoutePayload> {
	const getLiveDetailed =
		options.getLiveDetailed ?? buildAdminLiveDetailedStatsResponse;
	if (!options.aggregatesEnabled) {
		return getLiveDetailed(options.period);
	}

	const getDetailed =
		options.getDetailed ??
		adminMetricsService.getDetailed.bind(adminMetricsService);
	const result = await getDetailed(options.period, {
		forceRecompute: options.shouldRecompute,
	});
	if (result) {
		return {
			...result,
			meta: {
				source: ADMIN_DETAILED_STATS_ROUTE_SOURCE.AGGREGATE,
				fallbackApplied: false,
			},
		};
	}

	const fallbackPayload = await getLiveDetailed(options.period);
	return {
		...fallbackPayload,
		meta: {
			source: ADMIN_DETAILED_STATS_ROUTE_SOURCE.LIVE,
			fallbackApplied: true,
		},
	};
}

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

		const payload = await buildAdminDetailedStatsRouteResponse({
			aggregatesEnabled: hardeningPolicy.aggregatesEnabled,
			period,
			shouldRecompute,
		});

		return NextResponse.json(payload);
	} catch (error) {
		logger.error("Error obteniendo estadisticas detalladas", error);
		return NextResponse.json(
			{ error: "Error al obtener estadísticas" },
			{ status: 500 },
		);
	}
}
