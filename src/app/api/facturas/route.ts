/**
 * API Route: /api/facturas
 * CRUD para la colección 'invoices' en Firestore.
 * Gestión de documentos de facturación.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { facturaCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "invoices",
  createSchema: facturaCreateSchema,
  resourceName: "Factura",
});
