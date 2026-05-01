import { z } from "zod";
import { apiSuccess, withAdminAuth } from "@/lib/api-middleware";
import { resolveHardeningPolicy } from "@/lib/hardeningPolicy";
import { userService } from "@/services/userService";

function buildAdminListFreshness() {
	return {
		computedAt: new Date().toISOString(),
		source: "live" as const,
		stale: false,
	};
}

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	cursor: z.string().optional(),
});

export function resolveAdminUsersListQuery(
	searchParams: URLSearchParams,
	cursorEnabled: boolean,
) {
	const query = querySchema.parse({
		search: searchParams.get("search") || undefined,
		limit: searchParams.get("limit") || 20,
		offset: searchParams.get("offset") || 0,
		cursor: searchParams.get("cursor") || undefined,
	});

	return {
		...query,
		useCursor: cursorEnabled && (!query.search || !!query.cursor),
	};
}

export async function buildAdminUsersListResponse(
	searchParams: URLSearchParams,
	options: {
		cursorEnabled: boolean;
		listUsers?: typeof userService.list;
	},
) {
	const query = resolveAdminUsersListQuery(searchParams, options.cursorEnabled);
	const listUsers = options.listUsers ?? userService.list.bind(userService);
	const result = await listUsers(query);

	return {
		users: result.items,
		pagination: result.pagination,
		pageInfo: result.pageInfo,
		meta: result.meta,
		freshness: buildAdminListFreshness(),
	};
}

/**
 * GET /api/admin/users
 * Lista usuarios (visitantes) con búsqueda y paginación.
 */
export const GET = withAdminAuth(
	async (req) => {
		const { searchParams } = new URL(req.url);
		const hardeningPolicy = resolveHardeningPolicy();
		const payload = await buildAdminUsersListResponse(searchParams, {
			cursorEnabled: hardeningPolicy.cursorEnabled,
		});

		return apiSuccess(payload);
	},
	{ permission: "users:view" },
);
