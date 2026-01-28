import { z } from "zod";
import { apiSuccess, withAdminAuth } from "@/lib/api-middleware";
import { minorService } from "@/services/userService";

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/admin/minors
 * Lista todos los menores con información del padre.
 */
export const GET = withAdminAuth(
	async (req) => {
		const { searchParams } = new URL(req.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
		});

		const result = await minorService.list(query);

		return apiSuccess({
			minors: result.items,
			pagination: result.pagination,
		});
	},
	{ permission: "minors:view" },
);
