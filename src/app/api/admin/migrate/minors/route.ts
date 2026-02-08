import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { minorIndexService } from "@/services/minorIndexService";

/**
 * POST /api/admin/migrate/minors
 * Migra los menores embebidos en users a la colección optimizada minors_index.
 * USAR SOLO UNA VEZ.
 * Requiere rol super_admin.
 */
export async function POST(request: NextRequest) {
	try {
		// Verificar autenticación y permiso admin (solo super_admin debería ejecutar esto)
		const authResult = await verifyAdminTokenWithPermission(request, "settings:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		console.log("[Migration] Iniciando migración de menores a minors_index...");

		const result = await minorIndexService.migrateFromUsers();

		console.log(
			`[Migration] Migración completada: ${result.usersProcessed} usuarios procesados, ${result.minorsMigrated} menores migrados`,
		);

		if (result.errors.length > 0) {
			console.warn("[Migration] Errores durante migración:", result.errors);
		}

		return NextResponse.json({
			success: true,
			message: "Migración completada exitosamente",
			stats: {
				usersProcessed: result.usersProcessed,
				minorsMigrated: result.minorsMigrated,
				errorsCount: result.errors.length,
			},
			errors: result.errors.slice(0, 50), // Limitar errores mostrados
		});
	} catch (error) {
		console.error("[Migration] Error durante migración:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}

/**
 * GET /api/admin/migrate/minors
 * Obtiene el estado de la colección minors_index.
 */
export async function GET(request: NextRequest) {
	try {
		const authResult = await verifyAdminTokenWithPermission(request, "settings:manage");
		if (!authResult.success) {
			return authResult.response;
		}

		const count = await minorIndexService.getMinorsCount();

		return NextResponse.json({
			success: true,
			minorsIndexCount: count,
			message: count > 0 
				? "La colección minors_index tiene datos" 
				: "La colección minors_index está vacía - ejecutar migración",
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Error desconocido",
			},
			{ status: 500 },
		);
	}
}
