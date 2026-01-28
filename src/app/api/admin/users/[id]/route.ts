import {
	apiError,
	apiSuccess,
	withAdminAuthParams,
} from "@/lib/api-middleware";
import { userService } from "@/services/userService";

/**
 * GET /api/admin/users/[id]
 * Obtiene detalles de un usuario con sus consentimientos.
 */
export const GET = withAdminAuthParams(
	async (_req, _session, params) => {
		const result = await userService.getById(params.id);

		if (!result) {
			return apiError("Usuario no encontrado", 404);
		}

		const consents = await userService.getConsents(result.user.uid);

		return apiSuccess({
			user: {
				id: result.user.id,
				uid: result.user.uid,
				fullName: result.user.fullName,
				email: result.user.email,
				phone: result.user.phone,
				minors: result.user.minors,
				createdAt: result.user.createdAt,
				updatedAt: result.user.updatedAt,
			},
			consents,
			stats: {
				totalConsents: consents.length,
				minorsCount: result.user.minorsCount,
			},
		});
	},
	{ permission: "users:view" },
);

/**
 * DELETE /api/admin/users/[id]
 * Elimina un usuario y opcionalmente sus datos relacionados.
 * Solo accesible por usuarios con rol 'admin'.
 */
export const DELETE = withAdminAuthParams(
	async (_req, _session, params) => {
		const result = await userService.delete(params.id);

		if (!result) {
			return apiError("Usuario no encontrado", 404);
		}

		return apiSuccess({
			success: true,
			message: "Usuario eliminado correctamente",
			deletedId: result.deletedId,
		});
	},
	{ permission: "users:delete" },
);
