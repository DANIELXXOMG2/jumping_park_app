import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { adminMetricsService } from "@/services/adminMetricsService";
import type {
	AdminMetricRecentConsent,
	AdminMetricRecentUser,
} from "@/types/firestore";

export const ADMIN_STATS_ROUTE_SOURCE = {
	AGGREGATE: "aggregate",
	LIVE: "live",
} as const;

type AdminStatsRouteSource =
	(typeof ADMIN_STATS_ROUTE_SOURCE)[keyof typeof ADMIN_STATS_ROUTE_SOURCE];

interface AdminStatsRoutePayload {
	stats: {
		totalUsers: number;
		totalConsents: number;
		totalMinors: number;
		usersToday: number;
		consentsToday: number;
		minorsToday: number;
	};
	recentUsers: AdminMetricRecentUser[];
	recentConsents: AdminMetricRecentConsent[];
	chartData: Array<{ name: string; value: number }>;
	freshness: {
		computedAt: string;
		source: AdminStatsRouteSource;
		stale?: boolean;
	};
	meta: {
		source: AdminStatsRouteSource;
		fallbackApplied: boolean;
	};
	unknownDateBuckets?: {
		users: number;
		consents: number;
	};
}

export function shouldForceAdminStatsRecompute(requestUrl: string): boolean {
	return new URL(requestUrl).searchParams.get("recompute") === "true";
}

export function buildAdminAggregateStatsResponse(
	overview: Awaited<ReturnType<typeof adminMetricsService.getOverview>>,
): AdminStatsRoutePayload {
	return {
		stats: overview.stats,
		recentUsers: overview.recentUsers,
		recentConsents: overview.recentConsents,
		chartData: overview.chartData,
		freshness: overview.freshness,
		meta: {
			source: ADMIN_STATS_ROUTE_SOURCE.AGGREGATE,
			fallbackApplied: false,
		},
		unknownDateBuckets: overview.unknownDateBuckets,
	};
}

export async function buildAdminStatsRouteResponse(options: {
	aggregatesEnabled: boolean;
	requestUrl: string;
	getOverview?: (options?: {
		forceRecompute?: boolean;
	}) => Promise<Awaited<
		ReturnType<typeof adminMetricsService.getOverview>
	> | null>;
	getLiveStats?: typeof adminMetricsService.buildAdminLiveStatsResponse;
}): Promise<AdminStatsRoutePayload> {
	const getLiveStats =
		options.getLiveStats ??
		adminMetricsService.buildAdminLiveStatsResponse.bind(adminMetricsService);
	if (!options.aggregatesEnabled) {
		return getLiveStats();
	}

	const getOverview =
		options.getOverview ??
		adminMetricsService.getOverview.bind(adminMetricsService);
	const overview = await getOverview({
		forceRecompute: shouldForceAdminStatsRecompute(options.requestUrl),
	});
	if (overview) {
		return buildAdminAggregateStatsResponse(overview);
	}

	const fallbackPayload = await getLiveStats();
	return {
		...fallbackPayload,
		meta: {
			source: ADMIN_STATS_ROUTE_SOURCE.LIVE,
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

		const hardeningPolicy = resolveHardeningPolicy();

		const payload = await buildAdminStatsRouteResponse({
			aggregatesEnabled: hardeningPolicy.aggregatesEnabled,
			requestUrl: request.url,
		});

		return NextResponse.json(payload);
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener estadísticas" },
			{ status: 500 },
		);
	}
}
