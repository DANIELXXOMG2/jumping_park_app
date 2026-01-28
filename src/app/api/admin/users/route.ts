import { z } from "zod";
import { apiSuccess, withAdminAuth } from "@/lib/api-middleware";
import { userService } from "@/services/userService";

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/admin/users
 * Lista usuarios (visitantes) con búsqueda y paginación.
 */
export const GET = withAdminAuth(
	async (req) => {
		const { searchParams } = new URL(req.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
		});

		const result = await userService.list(query);

		return apiSuccess({
			users: result.items,
			pagination: result.pagination,
		});
	},
	{ permission: "users:view" },
);
