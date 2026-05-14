import { z } from "zod";
import { apiSuccess, withAdminAuth } from "@/lib/api-middleware";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { minorService } from "@/services/userService";

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	cursor: z.string().optional(),
});

function buildAdminListFreshness() {
	return {
		computedAt: new Date().toISOString(),
		source: "live" as const,
		stale: false,
	};
}

export async function buildAdminMinorsListResponse(
	searchParams: URLSearchParams,
	options: {
		cursorEnabled: boolean;
		listMinors?: typeof minorService.list;
	},
) {
	const query = querySchema.parse({
		search: searchParams.get("search") || undefined,
		limit: searchParams.get("limit") || 20,
		offset: searchParams.get("offset") || 0,
		cursor: searchParams.get("cursor") || undefined,
	});
	const listMinors = options.listMinors ?? minorService.list.bind(minorService);
	const result = await listMinors({
		...query,
		useCursor: options.cursorEnabled && (!query.search || !!query.cursor),
	});

	return {
		minors: result.items,
		pagination: result.pagination,
		pageInfo: result.pageInfo,
		meta: result.meta,
		freshness: buildAdminListFreshness(),
	};
}

/**
 * GET /api/admin/minors
 * Lista todos los menores con información del padre.
 */
export const GET = withAdminAuth(
	async (req) => {
		const { searchParams } = new URL(req.url);
		const hardeningPolicy = resolveHardeningPolicy();
		const payload = await buildAdminMinorsListResponse(searchParams, {
			cursorEnabled: hardeningPolicy.cursorEnabled,
		});

		return apiSuccess(payload);
	},
	{ permission: "minors:view" },
);
