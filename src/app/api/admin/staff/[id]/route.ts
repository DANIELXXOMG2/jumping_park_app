import {
	apiError,
	apiSuccess,
	withAdminAuthParams,
} from "@/lib/api-middleware";
import {
	buildAdminAuditActor,
	buildAdminAuditRequest,
} from "@/services/adminAuditService";
import { staffService } from "@/services/userService";

// ============================================================================
// GET /api/admin/staff/[id]
// Obtiene detalles de un miembro del staff
// ============================================================================

export const GET = withAdminAuthParams(
	async (_req, _session, params) => {
		const staff = await staffService.getById(params.id);

		if (!staff) {
			return apiError("Miembro del staff no encontrado", 404);
		}

		return apiSuccess({ staff });
	},
	{ permission: "users:view" },
);

// ============================================================================
// DELETE /api/admin/staff/[id]
// Elimina un miembro del staff (SOLO SUPER ADMIN)
// ============================================================================

export const DELETE = withAdminAuthParams(
	async (req, session, params) => {
		const result = await staffService.delete(params.id, session.uid, {
			action: "staff.delete",
			actor: buildAdminAuditActor(session),
			target: {
				collection: "admin_users",
				id: params.id,
				label: params.id,
			},
			request: buildAdminAuditRequest(req),
		});

		if ("error" in result) {
			return apiError(result.error, result.status);
		}

		return apiSuccess({
			message: "Miembro del equipo eliminado exitosamente",
			deletedId: result.deletedId,
		});
	},
	{ permission: "roles:manage" },
);
