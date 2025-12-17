/**
 * API Route: /api/admin/export/users
 * Exporta usuarios en formato CSV.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

function formatDateTime(timestamp: unknown): string {
	if (!timestamp) return "";

	let date: Date;
	if (timestamp instanceof Date) {
		date = timestamp;
	} else if (
		typeof timestamp === "object" &&
		timestamp !== null &&
		"toDate" in timestamp
	) {
		date = (timestamp as { toDate: () => Date }).toDate();
	} else {
		return "";
	}

	return date.toLocaleString("es-CO", {
		timeZone: "America/Bogota",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function escapeCSV(value: string | number | undefined | null): string {
	if (value === null || value === undefined) return "";
	const str = String(value);
	if (str.includes(",") || str.includes('"') || str.includes("\n")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const snapshot = await db
			.collection("users")
			.orderBy("createdAt", "desc")
			.limit(5000)
			.get();

		// Headers del CSV
		const headers = [
			"Cédula",
			"Nombre Completo",
			"Email",
			"Teléfono",
			"Dirección",
			"Cantidad Menores",
			"Fecha Registro",
			"Última Actualización",
		];

		// Generar filas
		const rows = snapshot.docs.map((doc) => {
			const data = doc.data();

			return [
				escapeCSV(data.uid || doc.id),
				escapeCSV(data.fullName),
				escapeCSV(data.email),
				escapeCSV(data.phone),
				escapeCSV(data.address),
				escapeCSV(data.minors?.length || 0),
				escapeCSV(formatDateTime(data.createdAt)),
				escapeCSV(formatDateTime(data.updatedAt)),
			].join(",");
		});

		// Construir CSV con BOM para compatibilidad con Excel
		const BOM = "\uFEFF";
		const csv = BOM + [headers.join(","), ...rows].join("\n");

		// Nombre del archivo con fecha
		const today = formatDate(new Date());
		const filename = `usuarios_${today}.csv`;

		// Retornar como archivo CSV
		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[API /admin/export/users] Error:", error);
		return NextResponse.json(
			{ error: "Error al exportar usuarios" },
			{ status: 500 },
		);
	}
}
