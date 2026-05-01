import { type NextRequest, NextResponse } from "next/server";
import type { ZodError, ZodSchema } from "zod";
import {
	type AuthResult,
	verifyAdminTokenWithAnyPermission,
	verifyAdminTokenWithPermission,
} from "@/lib/adminAuth";
import type { Permission } from "@/types/auth";

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Sesión autenticada disponible en el handler.
 */
export interface AdminSession {
	uid: string;
	email: string;
	role: string;
}

/**
 * Request enriquecido con datos parseados y validados.
 */
export interface EnrichedRequest<T = unknown> extends NextRequest {
	/**
	 * Body parseado y validado por el schema Zod (si se proporcionó).
	 */
	validatedBody?: T;
}

/**
 * Opciones de configuración para el middleware.
 */
export interface WithAdminAuthOptions<T = unknown> {
	/**
	 * Permiso único requerido para acceder al endpoint.
	 * Se verifica con verifyAdminTokenWithPermission.
	 */
	permission?: Permission;

	/**
	 * Lista de permisos (el usuario debe tener al menos uno).
	 * Se verifica con verifyAdminTokenWithAnyPermission.
	 */
	permissions?: Permission[];

	/**
	 * Schema Zod para validar el body de la request.
	 * Si se proporciona, el body parseado estará disponible en `req.validatedBody`.
	 */
	schema?: ZodSchema<T>;
}

/**
 * Handler protegido con autenticación de admin.
 */
type AdminHandler<T = unknown> = (
	req: EnrichedRequest<T>,
	session: AdminSession,
) => Promise<NextResponse>;

/**
 * Handler protegido para rutas dinámicas con params.
 */
type AdminHandlerWithParams<T = unknown, P = { id: string }> = (
	req: EnrichedRequest<T>,
	session: AdminSession,
	params: P,
) => Promise<NextResponse>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea errores de Zod para respuesta JSON estandarizada.
 */
function formatZodError(error: ZodError): { error: string; details: unknown } {
	return {
		error: "Datos inválidos",
		details: error.flatten().fieldErrors,
	};
}

/**
 * Crea una respuesta de error estandarizada.
 */
export function apiError(
	message: string,
	status: number,
	details?: unknown,
): NextResponse {
	const body: Record<string, unknown> = { error: message };
	if (details !== undefined) {
		body.details = details;
	}
	return NextResponse.json(body, { status });
}

/**
 * Crea una respuesta de éxito estandarizada.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
	return NextResponse.json(data, { status });
}

// ============================================================================
// MIDDLEWARE HOF
// ============================================================================

/**
 * Higher-Order Function que encapsula:
 * - Verificación de sesión con permisos
 * - Validación de schema Zod (opcional)
 * - Manejo de errores try/catch global
 * - Respuestas JSON estandarizadas
 *
 * @example
 * // Uso básico con un permiso
 * export const GET = withAdminAuth(async (req, session) => {
 *   const users = await userService.list();
 *   return apiSuccess({ users });
 * }, { permission: "users:view" });
 *
 * @example
 * // Con validación de schema
 * export const POST = withAdminAuth(async (req, session) => {
 *   const data = req.validatedBody!;
 *   const user = await userService.create(data);
 *   return apiSuccess(user, 201);
 * }, { permission: "users:create", schema: createUserSchema });
 */
export function withAdminAuth<T = unknown>(
	handler: AdminHandler<T>,
	options: WithAdminAuthOptions<T> = {},
): (req: NextRequest) => Promise<NextResponse> {
	return async (req: NextRequest): Promise<NextResponse> => {
		try {
			// 1. Verificar autenticación y permisos
			let authResult: AuthResult | { success: false; response: NextResponse };

			if (options.permissions && options.permissions.length > 0) {
				authResult = await verifyAdminTokenWithAnyPermission(
					req,
					options.permissions,
				);
			} else if (options.permission) {
				authResult = await verifyAdminTokenWithPermission(
					req,
					options.permission,
				);
			} else {
				// Sin permisos especificados, solo verificar autenticación básica
				authResult = await verifyAdminTokenWithPermission(
					req,
					"dashboard:view",
				);
			}

			if (!authResult.success) {
				return authResult.response;
			}

			const session: AdminSession = {
				uid: authResult.uid,
				email: authResult.email,
				role: authResult.role,
			};

			// 2. Validar body con schema Zod (si se proporcionó)
			const enrichedReq = req as EnrichedRequest<T>;

			if (options.schema) {
				try {
					const body = await req.json();
					const parsed = options.schema.parse(body);
					enrichedReq.validatedBody = parsed;
				} catch (error) {
					if (error && typeof error === "object" && "issues" in error) {
						return NextResponse.json(formatZodError(error as ZodError), {
							status: 400,
						});
					}
					return apiError("El body de la solicitud debe ser JSON válido", 400);
				}
			}

			// 3. Ejecutar handler
			return await handler(enrichedReq, session);
		} catch (error) {
			// Capturar errores de Zod que puedan escapar
			if (error && typeof error === "object" && "issues" in error) {
				return NextResponse.json(formatZodError(error as ZodError), {
					status: 400,
				});
			}

			// Error genérico (no logueamos para evitar console.log en producción)
			return apiError("Error interno del servidor", 500);
		}
	};
}

/**
 * Versión del middleware para rutas dinámicas con parámetros.
 * Soporta el nuevo formato de Next.js 15 donde params es una Promise.
 *
 * @example
 * export const GET = withAdminAuthParams(async (req, session, params) => {
 *   const user = await userService.getById(params.id);
 *   return apiSuccess({ user });
 * }, { permission: "users:view" });
 */
export function withAdminAuthParams<T = unknown, P = { id: string }>(
	handler: AdminHandlerWithParams<T, P>,
	options: WithAdminAuthOptions<T> = {},
): (
	req: NextRequest,
	context: { params: Promise<P> },
) => Promise<NextResponse> {
	return async (
		req: NextRequest,
		context: { params: Promise<P> },
	): Promise<NextResponse> => {
		try {
			// 1. Verificar autenticación y permisos
			let authResult: AuthResult | { success: false; response: NextResponse };

			if (options.permissions && options.permissions.length > 0) {
				authResult = await verifyAdminTokenWithAnyPermission(
					req,
					options.permissions,
				);
			} else if (options.permission) {
				authResult = await verifyAdminTokenWithPermission(
					req,
					options.permission,
				);
			} else {
				authResult = await verifyAdminTokenWithPermission(
					req,
					"dashboard:view",
				);
			}

			if (!authResult.success) {
				return authResult.response;
			}

			const session: AdminSession = {
				uid: authResult.uid,
				email: authResult.email,
				role: authResult.role,
			};

			// 2. Resolver params (Next.js 15+)
			const params = await context.params;

			// 3. Validar body con schema Zod (si se proporcionó)
			const enrichedReq = req as EnrichedRequest<T>;

			if (options.schema) {
				try {
					const body = await req.json();
					const parsed = options.schema.parse(body);
					enrichedReq.validatedBody = parsed;
				} catch (error) {
					if (error && typeof error === "object" && "issues" in error) {
						return NextResponse.json(formatZodError(error as ZodError), {
							status: 400,
						});
					}
					return apiError("El body de la solicitud debe ser JSON válido", 400);
				}
			}

			// 4. Ejecutar handler con params
			return await handler(enrichedReq, session, params);
		} catch (error) {
			if (error && typeof error === "object" && "issues" in error) {
				return NextResponse.json(formatZodError(error as ZodError), {
					status: 400,
				});
			}

			return apiError("Error interno del servidor", 500);
		}
	};
}
