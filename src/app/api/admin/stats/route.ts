import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";
import { getTodayStartColombia } from "@/lib/utils/dateUtils";

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso statistics:view
		const authResult = await verifyAdminTokenWithPermission(request, "statistics:view");
		if (!authResult.success) {
			return authResult.response;
		}

		// Usar zona horaria de Colombia para "hoy"
		const today = getTodayStartColombia();

		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);

		// OPTIMIZADO: Usar contadores y limitar lecturas
		const [
			usersCountSnap,
			consentsCountSnap,
			minorsCountSnap,
			usersTodaySnap,
			consentsTodaySnap,
			recentUsersSnap,
			recentConsentsSnap,
			// OPTIMIZADO: Limitar a 50 consentimientos de la semana para el gráfico
			weeklyConsentsSnap,
		] = await Promise.all([
			db.collection("users").count().get(),
			db.collection("consents").count().get(),
			// OPTIMIZADO: Usar contador de minors_index (colección denormalizada)
			db.collection("minors_index").count().get(),
			db.collection("users").where("createdAt", ">=", today).count().get(),
			db.collection("consents").where("createdAt", ">=", today).count().get(),
			db.collection("users").orderBy("createdAt", "desc").limit(5).get(),
			db.collection("consents").orderBy("createdAt", "desc").limit(5).get(),
			// OPTIMIZADO: Limitar documentos de la semana (suficiente para gráfico)
			db.collection("consents")
				.where("createdAt", ">=", weekAgo)
				.orderBy("createdAt", "desc")
				.limit(100)
				.get(),
		]);

		const totalUsers = usersCountSnap.data().count;
		const totalConsents = consentsCountSnap.data().count;
		const totalMinors = minorsCountSnap.data().count;

		const recentUsers = recentUsersSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				uid: data.uid,
				fullName: data.fullName,
				email: data.email,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			};
		});

		const recentConsents = recentConsentsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				consecutivo: data.consecutivo,
				adultSnapshot: data.adultSnapshot,
				minorsSnapshot: data.minorsSnapshot,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			};
		});

		const dailyStats: Record<string, number> = {};
		const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

		weeklyConsentsSnap.docs.forEach((doc) => {
			const data = doc.data();
			if (data.createdAt) {
				const date = data.createdAt.toDate();
				const dayName = days[date.getDay()];
				dailyStats[dayName] = (dailyStats[dayName] || 0) + 1;
			}
		});

		const chartData = days.map((day) => ({
			name: day,
			value: dailyStats[day] || 0,
		}));

		return NextResponse.json({
			stats: {
				totalUsers,
				totalConsents,
				totalMinors,
				usersToday: usersTodaySnap.data().count,
				consentsToday: consentsTodaySnap.data().count,
			},
			recentUsers,
			recentConsents,
			chartData,
		});
	} catch {
		return NextResponse.json(
			{ error: "Error al obtener estadísticas" },
			{ status: 500 },
		);
	}
}
