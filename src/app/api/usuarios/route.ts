/**
 * API Route: /api/usuarios
 * CRUD para la colección 'users' en Firestore.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { usuarioCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "users",
  createSchema: usuarioCreateSchema,
  resourceName: "Usuario",
});
