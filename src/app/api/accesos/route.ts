
import { createCrudRoutes } from "@/lib/createCrudRoutes";
import { accesoCreateSchema } from "@/lib/schemas/crud.schema";

export const { GET, POST } = createCrudRoutes({
  collection: "accesses",
  createSchema: accesoCreateSchema,
  resourceName: "Acceso",
});
