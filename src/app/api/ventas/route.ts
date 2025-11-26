/**
 * API Route: /api/ventas
 * CRUD para la colección 'sales' en Firestore.
 * Transacciones de venta del parque.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { ventaCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "sales",
  createSchema: ventaCreateSchema,
  resourceName: "Venta",
});
