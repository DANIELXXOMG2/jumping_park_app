import {
	apiError,
	apiSuccess,
	type AdminSession,
	withAdminAuthParams,
} from "@/lib/api-middleware";
import {
	buildAdminAuditActor,
	buildAdminAuditRequest,
	writeAdminAuditLog,
} from "@/services/adminAuditService";
import { userService } from "@/services/userService";

export async function buildAdminUserDeleteResponse(
	request: Parameters<typeof buildAdminAuditRequest>[0],
	session: AdminSession,
	params: { id: string },
	options: {
		deleteUser?: typeof userService.delete;
		writeAuditLog?: typeof writeAdminAuditLog;
	} = {},
) {
	const deleteUser = options.deleteUser ?? userService.delete.bind(userService);
	const writeAuditLog = options.writeAuditLog ?? writeAdminAuditLog;
	const result = await deleteUser(params.id);

	if (!result) {
		return null;
	}

	await writeAuditLog({
		action: "user.delete",
		actor: buildAdminAuditActor(session),
		target: { collection: "users", id: result.deletedId, label: params.id },
		request: buildAdminAuditRequest(request),
	});

	return {
		success: true,
		message: "Usuario eliminado correctamente",
		deletedId: result.deletedId,
	};
}

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
 * Requiere permiso 'users:delete'.
 */
export const DELETE = withAdminAuthParams(
	async (req, session, params) => {
		const payload = await buildAdminUserDeleteResponse(req, session, params);

		if (!payload) {
			return apiError("Usuario no encontrado", 404);
		}

		return apiSuccess(payload);
	},
	{ permission: "users:delete" },
);
