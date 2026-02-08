/**
 * API Route: /api/admin/activity
 * Retorna la actividad del día actual con los últimos consentimientos.
 * OPTIMIZADO: Usa .select() para reducir lecturas de campos innecesarios.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { getTodayStartColombia } from "@/lib/utils/dateUtils";

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso dashboard:view
		const authResult = await verifyAdminTokenWithPermission(request, "dashboard:view");
		if (!authResult.success) {
			return authResult.response;
		}

		// Fecha de inicio del día (medianoche hora Colombia - compatible con UTC del servidor)
		const now = new Date();
		const todayStart = getTodayStartColombia();

		// OPTIMIZADO: Ejecutar queries en paralelo y usar .select() para solo traer campos necesarios
		const [todaySnapshot, latestSnapshot] = await Promise.all([
			// Consentimientos de hoy - solo campos necesarios para stats
			db
				.collection("consents")
				.where("signedAt", ">=", todayStart)
				.select("signedAt", "minorsSnapshot")
				.get(),
			// Últimos 10 consentimientos - solo campos necesarios para el feed
			db
				.collection("consents")
				.orderBy("signedAt", "desc")
				.limit(10)
				.select("consecutivo", "signedAt", "adultSnapshot", "minorsSnapshot")
				.get(),
		]);

		const consentsToday = todaySnapshot.size;

		// Calcular total de menores hoy
		let minorsToday = 0;
		const hourlyStats: Record<number, number> = {};

		todaySnapshot.docs.forEach((doc) => {
			const data = doc.data();
			minorsToday += data.minorsSnapshot?.length || 0;

			// Estadísticas por hora
			if (data.signedAt) {
				const signedDate =
					data.signedAt instanceof Date
						? data.signedAt
						: data.signedAt.toDate();
				const hour = signedDate.getHours();
				hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
			}
		});

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

		// Convertir a array ordenado (solo horario comercial 8am-10pm)
		const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
			hour,
			label: `${hour.toString().padStart(2, "0")}:00`,
			count: hourlyStats[hour] || 0,
		})).filter((h) => h.hour >= 8 && h.hour <= 22);

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
