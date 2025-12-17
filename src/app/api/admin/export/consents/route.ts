/**
 * API Route: /api/admin/export/consents
 * Exporta consentimientos en formato CSV.
 */
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

const querySchema = z.object({
	from: z.string().optional(), // Fecha inicio YYYY-MM-DD
	to: z.string().optional(), // Fecha fin YYYY-MM-DD
});

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
	// Si contiene comas, comillas o saltos de línea, envolver en comillas
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

		const { searchParams } = new URL(request.url);
		const query = querySchema.parse({
			from: searchParams.get("from") || undefined,
			to: searchParams.get("to") || undefined,
		});

		// Construir query
		let consentsQuery = db.collection("consents").orderBy("signedAt", "desc");

		// Filtrar por fechas si se proporcionan
		if (query.from) {
			const fromDate = new Date(query.from);
			fromDate.setHours(0, 0, 0, 0);
			consentsQuery = consentsQuery.where("signedAt", ">=", fromDate);
		}

		if (query.to) {
			const toDate = new Date(query.to);
			toDate.setHours(23, 59, 59, 999);
			consentsQuery = consentsQuery.where("signedAt", "<=", toDate);
		}

		const snapshot = await consentsQuery.limit(5000).get();

		// Headers del CSV
		const headers = [
			"Consecutivo",
			"Fecha Firma",
			"Cédula Responsable",
			"Nombre Responsable",
			"Email",
			"Teléfono",
			"Cantidad Menores",
			"Menores",
			"Válido Hasta",
			"Estado",
		];

		// Generar filas
		const rows = snapshot.docs.map((doc) => {
			const data = doc.data();
			const validUntil = data.validUntil;
			let isValid = false;

			if (validUntil) {
				const validDate =
					validUntil instanceof Date
						? validUntil
						: (validUntil as { toDate: () => Date }).toDate();
				isValid = validDate > new Date();
			}

			// Lista de menores como string
			const minorsList = (data.minorsSnapshot || [])
				.map(
					(m: { fullName?: string; firstName?: string; lastName?: string }) =>
						m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim(),
				)
				.join("; ");

			return [
				escapeCSV(data.consecutivo),
				escapeCSV(formatDateTime(data.signedAt)),
				escapeCSV(data.adultSnapshot?.uid),
				escapeCSV(data.adultSnapshot?.fullName),
				escapeCSV(data.adultSnapshot?.email),
				escapeCSV(data.adultSnapshot?.phone),
				escapeCSV(data.minorsSnapshot?.length || 0),
				escapeCSV(minorsList),
				escapeCSV(formatDateTime(data.validUntil)),
				escapeCSV(isValid ? "Vigente" : "Vencido"),
			].join(",");
		});

		// Construir CSV con BOM para compatibilidad con Excel
		const BOM = "\uFEFF";
		const csv = BOM + [headers.join(","), ...rows].join("\n");

		// Nombre del archivo con fecha
		const today = formatDate(new Date());
		const filename =
			query.from || query.to
				? `consentimientos_${query.from || "inicio"}_a_${query.to || today}.csv`
				: `consentimientos_${today}.csv`;

		// Retornar como archivo CSV
		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[API /admin/export/consents] Error:", error);
		return NextResponse.json(
			{ error: "Error al exportar consentimientos" },
			{ status: 500 },
		);
	}
}
