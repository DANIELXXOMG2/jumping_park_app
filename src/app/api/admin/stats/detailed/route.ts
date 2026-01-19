import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { getDateRangeColombia } from "@/lib/utils/dateUtils";

type Period = "today" | "week" | "month" | "year" | "all";

interface DailyData {
	date: string;
	consents: number;
	users: number;
	minors: number;
}

function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
	const { start: currentStart, end: currentEnd } = getDateRangeColombia(period);
	const duration = currentEnd.getTime() - currentStart.getTime();

	return {
		start: new Date(currentStart.getTime() - duration),
		end: new Date(currentStart.getTime() - 1),
	};
}

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación de admin
		const authResult = await verifyAdminToken(request);
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);
		const period = (searchParams.get("period") || "month") as Period;

		// Usar zona horaria de Colombia para los rangos de fecha
		const { start, end } = getDateRangeColombia(period);
		const previousRange = getPreviousPeriodRange(period);
		const now = new Date();

		// =========================================================================
		// EJECUTAR TODAS LAS CONSULTAS EN PARALELO
		// =========================================================================

		const [
			consentsSnap,
			usersSnap,
			prevConsentsSnap,
			prevUsersSnap,
			totalUsersCount,
			totalConsentsCount,
		] = await Promise.all([
			// Período actual
			db
				.collection("consents")
				.where("signedAt", ">=", start)
				.where("signedAt", "<=", end)
				.select("signedAt", "minorsSnapshot", "validUntil") // Solo campos necesarios
				.get(),

			db
				.collection("users")
				.where("createdAt", ">=", start)
				.where("createdAt", "<=", end)
				.select("createdAt") // Solo campos necesarios
				.get(),

			// Período anterior (solo contar, no necesitamos todos los datos)
			db
				.collection("consents")
				.where("signedAt", ">=", previousRange.start)
				.where("signedAt", "<=", previousRange.end)
				.select("minorsSnapshot")
				.get(),

			db
				.collection("users")
				.where("createdAt", ">=", previousRange.start)
				.where("createdAt", "<=", previousRange.end)
				.count()
				.get(),

			// Totales globales (usando count() es más rápido)
			db
				.collection("users")
				.count()
				.get(),
			db.collection("consents").count().get(),
		]);

		// =========================================================================
		// PROCESAR DATOS DEL PERÍODO ACTUAL
		// =========================================================================

		let minorsInPeriod = 0;
		let activeConsents = 0;
		let expiredConsents = 0;
		const uniqueMinorsIds = new Set<string>();
		const dayActivity: Record<string, { consents: number; minors: number }> =
			{};

		consentsSnap.docs.forEach((doc) => {
			const data = doc.data();
			const minorsSnapshot = data.minorsSnapshot || [];
			const minorsCount = minorsSnapshot.length;

			minorsInPeriod += minorsCount;

			// Menores únicos
			minorsSnapshot.forEach((m: { idNumber?: string }) => {
				if (m.idNumber) uniqueMinorsIds.add(m.idNumber);
			});

			// Vigente/Vencido
			const validUntil = data.validUntil?.toDate?.();
			if (validUntil && validUntil > now) {
				activeConsents++;
			} else {
				expiredConsents++;
			}

			// Actividad por día
			const signedAt = data.signedAt?.toDate?.();
			if (signedAt) {
				const dayKey = signedAt.toISOString().split("T")[0];
				if (!dayActivity[dayKey]) {
					dayActivity[dayKey] = { consents: 0, minors: 0 };
				}
				dayActivity[dayKey].consents++;
				dayActivity[dayKey].minors += minorsCount;
			}
		});

		// Actividad de usuarios por día
		const userDayActivity: Record<string, number> = {};
		usersSnap.docs.forEach((doc) => {
			const createdAt = doc.data().createdAt?.toDate?.();
			if (createdAt) {
				const dayKey = createdAt.toISOString().split("T")[0];
				userDayActivity[dayKey] = (userDayActivity[dayKey] || 0) + 1;
			}
		});

		// =========================================================================
		// PROCESAR PERÍODO ANTERIOR
		// =========================================================================

		let prevMinors = 0;
		prevConsentsSnap.docs.forEach((doc) => {
			prevMinors += (doc.data().minorsSnapshot || []).length;
		});

		// =========================================================================
		// GENERAR DATOS DEL GRÁFICO
		// =========================================================================

		const dailyData: DailyData[] = [];
		const dayMs = 24 * 60 * 60 * 1000;
		const daysToShow =
			period === "today"
				? 1
				: period === "week"
					? 7
					: period === "month"
						? 30
						: period === "year"
							? 12
							: 30;

		if (period === "year") {
			// Agrupar por mes
			for (let i = 11; i >= 0; i--) {
				const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const _monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
				const monthKey = monthStart.toISOString().slice(0, 7); // YYYY-MM

				let consents = 0;
				let users = 0;
				let minors = 0;

				// Sumar días del mes
				Object.entries(dayActivity).forEach(([day, data]) => {
					if (day.startsWith(monthKey)) {
						consents += data.consents;
						minors += data.minors;
					}
				});

				Object.entries(userDayActivity).forEach(([day, count]) => {
					if (day.startsWith(monthKey)) {
						users += count;
					}
				});

				dailyData.push({
					date: monthStart.toLocaleDateString("es-CO", {
						month: "short",
						year: "2-digit",
					}),
					consents,
					users,
					minors,
				});
			}
		} else {
			// Agrupar por día
			for (let i = daysToShow - 1; i >= 0; i--) {
				const dayStart = new Date(now.getTime() - i * dayMs);
				const dayKey = dayStart.toISOString().split("T")[0];

				dailyData.push({
					date: dayStart.toLocaleDateString("es-CO", {
						day: "2-digit",
						month: "short",
					}),
					consents: dayActivity[dayKey]?.consents || 0,
					users: userDayActivity[dayKey] || 0,
					minors: dayActivity[dayKey]?.minors || 0,
				});
			}
		}

		// =========================================================================
		// TOP DÍAS
		// =========================================================================

		const topDays = Object.entries(dayActivity)
			.sort((a, b) => b[1].consents - a[1].consents)
			.slice(0, 5)
			.map(([date, data]) => ({
				date: new Date(date).toLocaleDateString("es-CO", {
					weekday: "short",
					day: "numeric",
					month: "short",
				}),
				count: data.consents,
			}));

		// =========================================================================
		// TOTALES DE MENORES (consulta lazy solo si es necesario)
		// =========================================================================

		// Para los totales de menores, hacemos una consulta más ligera
		// Solo necesitamos el count, no todos los datos
		let totalMinors = 0;
		const minorsCountSnap = await db
			.collection("users")
			.select("minors")
			.limit(1000) // Limitar para evitar leer demasiados docs
			.get();

		minorsCountSnap.docs.forEach((doc) => {
			totalMinors += (doc.data().minors || []).length;
		});

		// =========================================================================
		// CALCULAR VARIACIONES
		// =========================================================================

		const calculateChange = (current: number, previous: number): number => {
			if (previous === 0) return current > 0 ? 100 : 0;
			return Math.round(((current - previous) / previous) * 100);
		};

		// =========================================================================
		// RESPUESTA
		// =========================================================================

		return NextResponse.json({
			period,
			dateRange: {
				start: start.toISOString(),
				end: end.toISOString(),
			},
			kpis: {
				consents: {
					value: consentsSnap.size,
					change: calculateChange(consentsSnap.size, prevConsentsSnap.size),
					previousValue: prevConsentsSnap.size,
				},
				users: {
					value: usersSnap.size,
					change: calculateChange(usersSnap.size, prevUsersSnap.data().count),
					previousValue: prevUsersSnap.data().count,
				},
				minors: {
					value: minorsInPeriod,
					change: calculateChange(minorsInPeriod, prevMinors),
					previousValue: prevMinors,
				},
				uniqueMinors: {
					value: uniqueMinorsIds.size,
					label: "Participantes únicos",
				},
				activeConsents: {
					value: activeConsents,
					label: "Vigentes",
				},
				expiredConsents: {
					value: expiredConsents,
					label: "Vencidos",
				},
			},
			totals: {
				users: totalUsersCount.data().count,
				consents: totalConsentsCount.data().count,
				minors: totalMinors,
			},
			chartData: dailyData,
			topDays,
			averages: {
				consentsPerDay:
					daysToShow > 0
						? Math.round((consentsSnap.size / daysToShow) * 10) / 10
						: 0,
				minorsPerConsent:
					consentsSnap.size > 0
						? Math.round((minorsInPeriod / consentsSnap.size) * 10) / 10
						: 0,
			},
		});
	} catch (error) {
		console.error("[API /admin/stats/detailed] Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener estadísticas" },
			{ status: 500 },
		);
	}
}
