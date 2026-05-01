import {
	apiError,
	apiSuccess,
	withAdminAuthParams,
} from "@/lib/api-middleware";
import {
	buildAdminAuditActor,
	buildAdminAuditRequest,
} from "@/services/adminAuditService";
import { minorService } from "@/services/userService";

/**
 * GET /api/admin/minors/[id]
 * Obtiene los detalles de un menor específico.
 */
export const GET = withAdminAuthParams(
	async (_req, _session, params) => {
		const result = await minorService.getById(params.id);

		if (!result) {
			// Validar formato del ID
			const [userId, indexStr] = params.id.split("_");
			const minorIndex = Number.parseInt(indexStr, 10);

			if (!userId || Number.isNaN(minorIndex)) {
				return apiError("ID de menor inválido", 400);
			}

			return apiError("Menor no encontrado", 404);
		}

		return apiSuccess({
			minor: result.minor,
			parent: result.parent,
		});
	},
	{ permission: "minors:view" },
);

/**
 * DELETE /api/admin/minors/[id]
 * Elimina un menor del array de menores del usuario padre.
 * Solo accesible por usuarios con permiso 'minors:edit'.
 */
export const DELETE = withAdminAuthParams(
	async (req, session, params) => {
		const result = await minorService.delete(params.id, {
			action: "minor.delete",
			actor: buildAdminAuditActor(session),
			target: {
				collection: "minors_index",
				id: params.id,
				label: params.id,
			},
			request: buildAdminAuditRequest(req),
		});

		if ("error" in result) {
			return apiError(result.error, result.status);
		}

		return apiSuccess({
			success: true,
			message: "Participante eliminado correctamente",
			deletedMinor: result.deletedMinor,
		});
	},
	{ permission: "minors:edit" },
);
