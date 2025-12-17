/**
 * API Route: /api/menores
 * CRUD para la colección 'minors' en Firestore.
 */
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { menorCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
	collection: "minors",
	createSchema: menorCreateSchema,
	resourceName: "Menor",
});
