/**
 * API Route: /api/servicios
 * CRUD para la colección 'services' en Firestore.
 * Catálogo de servicios ofrecidos en el parque.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { servicioCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "services",
  createSchema: servicioCreateSchema,
  resourceName: "Servicio",
});
