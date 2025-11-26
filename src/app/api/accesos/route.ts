/**
 * API Route: /api/accesos
 * CRUD para la colección 'accesses' en Firestore.
 * Registra entradas y salidas del parque.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { accesoCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "accesses",
  createSchema: accesoCreateSchema,
  resourceName: "Acceso",
});
