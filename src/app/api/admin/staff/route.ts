import { z } from "zod";
import { apiError, apiSuccess, withAdminAuth } from "@/lib/api-middleware";
import { type CreateStaffData, staffService } from "@/services/userService";

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	role: z.string().min(1).optional(),
});

const createStaffSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
	fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	role: z.string().min(1, "El rol es requerido"),
	avatar: z.string().optional(),
	phone: z.string().optional(),
	customPermissions: z.array(z.string()).optional(),
});

// ============================================================================
// GET /api/admin/staff
// Devuelve usuarios con rol 'admin' o 'cashier'
// ============================================================================

export const GET = withAdminAuth(
	async (req) => {
		const { searchParams } = new URL(req.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
			role: searchParams.get("role") || undefined,
		});

		const result = await staffService.list(query);

		return apiSuccess({
			staff: result.items,
			pagination: result.pagination,
		});
	},
	{ permission: "users:view" },
);

// ============================================================================
// POST /api/admin/staff
// Crea un nuevo usuario administrativo (admin o cashier)
// ============================================================================

export const POST = withAdminAuth<CreateStaffData>(
	async (req, session) => {
		// validatedBody siempre existe cuando se proporciona schema
		const data = req.validatedBody as CreateStaffData;

		const result = await staffService.create(data, session.uid);

		if ("error" in result) {
			return apiError(result.error, result.status);
		}

		return apiSuccess(
			{
				message: "Usuario administrativo creado exitosamente",
				staff: result.staff,
			},
			201,
		);
	},
	{ permission: "users:create", schema: createStaffSchema },
);
