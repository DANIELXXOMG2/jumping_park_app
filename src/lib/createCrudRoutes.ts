import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { createDoc, getDocs, getDocById } from "./firestoreService";
import {
  apiHandler,
  getValidatedBody,
  successResponse,
  NotFoundError,
} from "./apiHandler";

// ============================================================================
// TYPES
// ============================================================================

interface CrudConfig<TCreate = unknown> {
  /**
   * Nombre de la colección en Firestore.
   */
  collection: string;

  /**
   * Esquema Zod para validar el body del POST.
   * Si no se provee, el body pasa sin validación (no recomendado).
   */
  createSchema?: ZodSchema<TCreate>;

  /**
   * Límite de documentos a retornar en GET (list).
   * Default: 100
   */
  listLimit?: number;

  /**
   * Nombre del recurso para mensajes de error (ej. "Usuario", "Acceso").
   * Default: "Recurso"
   */
  resourceName?: string;
}

// ============================================================================
// CRUD FACTORY
// ============================================================================

/**
 * Factory que genera handlers GET y POST para operaciones CRUD básicas.
 *
 * @example
 * ```ts
 * // src/app/api/usuarios/route.ts
 * import { createCrudRoutes } from "@/lib/createCrudRoutes";
 * import { userCreateSchema } from "@/lib/schemas/user.schema";
 *
 * export const { GET, POST } = createCrudRoutes({
 *   collection: "users",
 *   createSchema: userCreateSchema,
 *   resourceName: "Usuario",
 * });
 * ```
 */
export function createCrudRoutes<TCreate = unknown>(config: CrudConfig<TCreate>) {
  const {
    collection,
    createSchema,
    listLimit = 100,
    resourceName = "Recurso",
  } = config;

  // -------------------------------------------------------------------------
  // GET: Listar todos o buscar por ID
  // -------------------------------------------------------------------------
  const GET = apiHandler(async (req: NextRequest) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // GET by ID
    if (id) {
      const doc = await getDocById(collection, id);

      if (!doc) {
        throw new NotFoundError(resourceName);
      }

      return successResponse(doc);
    }

    // GET list
    const docs = await getDocs(collection, listLimit);
    return successResponse(docs);
  });

  // -------------------------------------------------------------------------
  // POST: Crear nuevo documento
  // -------------------------------------------------------------------------
  const POST = apiHandler(
    async (req: NextRequest) => {
      // Si hay schema, el body ya está validado por apiHandler
      // Si no hay schema, parseamos el body directamente
      const body = createSchema
        ? getValidatedBody<TCreate>(req)
        : await req.json();

      const created = await createDoc(collection, body as Record<string, unknown>);

      return successResponse(created, 201);
    },
    { bodySchema: createSchema }
  );

  return { GET, POST };
}

// ============================================================================
// EXTENDED CRUD (futuro: PUT, DELETE, PATCH)
// ============================================================================

/**
 * Versión extendida que incluye operaciones de actualización y eliminación.
 * Implementar cuando sea necesario.
 */
// export function createFullCrudRoutes<TCreate, TUpdate>(config: FullCrudConfig<TCreate, TUpdate>) {
//   // TODO: Implementar PUT, DELETE, PATCH
// }
