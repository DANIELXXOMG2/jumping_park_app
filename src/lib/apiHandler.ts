import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

// ============================================================================
// TYPES
// ============================================================================

type RouteContext = {
  params: Promise<Record<string, string>>;
};

type ApiHandlerFn = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse>;

interface ApiHandlerOptions<TBody = unknown> {
  /**
   * Esquema Zod para validar el body de la request.
   * Solo se aplica a métodos POST, PUT, PATCH.
   */
  bodySchema?: ZodSchema<TBody>;
}

interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

/**
 * Error personalizado para respuestas HTTP controladas.
 * Úsalo cuando quieras retornar un código específico desde un servicio.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error 404 - Recurso no encontrado
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = "Recurso") {
    super(`${resource} no encontrado`, 404, "NOT_FOUND");
  }
}

/**
 * Error 400 - Datos inválidos
 */
export class ValidationError extends ApiError {
  constructor(message: string = "Datos inválidos", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/**
 * Error 401 - No autorizado
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "No autorizado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * Error 409 - Conflicto (ej. recurso duplicado)
 */
export class ConflictError extends ApiError {
  constructor(message: string = "El recurso ya existe") {
    super(message, 409, "CONFLICT");
  }
}

// ============================================================================
// VALIDATED BODY STORAGE
// ============================================================================

const validatedBodySymbol = Symbol("validatedBody");

/**
 * Obtiene el body ya validado por el apiHandler.
 * Solo úsalo dentro de handlers envueltos con apiHandler que tengan bodySchema.
 */
export function getValidatedBody<T>(req: NextRequest): T {
  const body = (req as unknown as Record<symbol, unknown>)[validatedBodySymbol];
  if (body === undefined) {
    throw new Error(
      "[apiHandler] No hay body validado. ¿Olvidaste pasar bodySchema en las opciones?"
    );
  }
  return body as T;
}

function setValidatedBody<T>(req: NextRequest, body: T): void {
  (req as unknown as Record<symbol, unknown>)[validatedBodySymbol] = body;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Crea una respuesta JSON exitosa.
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Crea una respuesta JSON de error.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
  code?: string
): NextResponse {
  const body: ApiErrorResponse = { error: message };
  if (details !== undefined) body.details = details;
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

// ============================================================================
// MAIN HANDLER WRAPPER
// ============================================================================

/**
 * Wrapper para API Routes que centraliza:
 * - Validación de body con Zod
 * - Manejo de errores (ZodError, ApiError, genéricos)
 * - Logging de errores
 *
 * @example
 * ```ts
 * export const POST = apiHandler(
 *   async (req) => {
 *     const data = getValidatedBody<MySchema>(req);
 *     const result = await myService.create(data);
 *     return successResponse(result, 201);
 *   },
 *   { bodySchema: myZodSchema }
 * );
 * ```
 */
export function apiHandler<TBody = unknown>(
  handler: ApiHandlerFn,
  options: ApiHandlerOptions<TBody> = {}
): ApiHandlerFn {
  return async (req: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      // Validar body si hay schema y el método lo requiere
      const method = req.method?.toUpperCase() ?? "";
      const methodsWithBody = ["POST", "PUT", "PATCH"];

      if (options.bodySchema && methodsWithBody.includes(method)) {
        let rawBody: unknown;
        
        try {
          rawBody = await req.json();
        } catch {
          return errorResponse(
            "El body de la request no es JSON válido",
            400,
            undefined,
            "INVALID_JSON"
          );
        }

        const parsed = options.bodySchema.safeParse(rawBody);

        if (!parsed.success) {
          return errorResponse(
            "Validación fallida",
            400,
            parsed.error.flatten(),
            "VALIDATION_ERROR"
          );
        }

        setValidatedBody(req, parsed.data);
      }

      // Ejecutar handler
      return await handler(req, context);

    } catch (error: unknown) {
      // Log del error para debugging
      console.error(
        `[API Error] ${req.method} ${req.nextUrl.pathname}:`,
        error
      );

      // Error de Zod (por si se lanza manualmente en el handler)
      if (error instanceof ZodError) {
        return errorResponse(
          "Datos inválidos",
          400,
          error.flatten(),
          "VALIDATION_ERROR"
        );
      }

      // Error controlado de API
      if (error instanceof ApiError) {
        return errorResponse(
          error.message,
          error.statusCode,
          error.details,
          error.code
        );
      }

      // Error genérico
      const message =
        error instanceof Error ? error.message : "Error interno del servidor";

      return errorResponse(message, 500, undefined, "INTERNAL_ERROR");
    }
  };
}
