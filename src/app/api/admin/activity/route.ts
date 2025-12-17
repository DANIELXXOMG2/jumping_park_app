/**
 * API Route: /api/admin/activity
 * Retorna la actividad del día actual con los últimos consentimientos.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		// Fecha de inicio del día (medianoche hora Colombia)
		const now = new Date();
		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);

		// Obtener estadísticas del día
		const todaySnapshot = await db
			.collection("consents")
			.where("signedAt", ">=", todayStart)
			.get();

		const consentsToday = todaySnapshot.size;

		// Calcular total de menores hoy
		let minorsToday = 0;
		todaySnapshot.docs.forEach((doc) => {
			const data = doc.data();
			minorsToday += data.minorsSnapshot?.length || 0;
		});

		// Últimos 10 consentimientos (para el feed en tiempo real)
		const latestSnapshot = await db
			.collection("consents")
			.orderBy("signedAt", "desc")
			.limit(10)
			.get();

		const latestConsents = latestSnapshot.docs.map((doc) => {
			const data = doc.data();

			// Convertir timestamp a ISO string
			let signedAt = null;
			if (data.signedAt) {
				if (data.signedAt instanceof Date) {
					signedAt = data.signedAt.toISOString();
				} else if (typeof data.signedAt.toDate === "function") {
					signedAt = data.signedAt.toDate().toISOString();
				}
			}

			return {
				id: doc.id,
				consecutivo: data.consecutivo,
				adultName: data.adultSnapshot?.fullName || "N/A",
				minorsCount: data.minorsSnapshot?.length || 0,
				signedAt,
			};
		});

		// Estadísticas por hora del día (para ver flujo)
		const hourlyStats: Record<number, number> = {};
		todaySnapshot.docs.forEach((doc) => {
			const data = doc.data();
			if (data.signedAt) {
				const signedDate =
					data.signedAt instanceof Date
						? data.signedAt
						: data.signedAt.toDate();
				const hour = signedDate.getHours();
				hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
			}
		});

		// Convertir a array ordenado
		const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
			hour,
			label: `${hour.toString().padStart(2, "0")}:00`,
			count: hourlyStats[hour] || 0,
		})).filter((h) => h.hour >= 8 && h.hour <= 22); // Solo horario comercial 8am-10pm

		return NextResponse.json({
			success: true,
			stats: {
				consentsToday,
				minorsToday,
				timestamp: now.toISOString(),
			},
			latestConsents,
			hourlyData,
		});
	} catch (error) {
		console.error("[API /admin/activity] Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener actividad" },
			{ status: 500 },
		);
	}
}
