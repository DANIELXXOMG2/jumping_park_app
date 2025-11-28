import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      usersCountSnap,
      consentsCountSnap,
      usersTodaySnap,
      consentsTodaySnap,
      recentUsersSnap,
      recentConsentsSnap,
      weeklyConsentsSnap,
    ] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("consents").count().get(),
      db.collection("users").where("createdAt", ">=", today).count().get(),
      db.collection("consents").where("createdAt", ">=", today).count().get(),
      db.collection("users").orderBy("createdAt", "desc").limit(5).get(),
      db.collection("consents").orderBy("createdAt", "desc").limit(5).get(),
      db.collection("consents").where("createdAt", ">=", weekAgo).get(),
    ]);

    const totalUsers = usersCountSnap.data().count;
    const totalConsents = consentsCountSnap.data().count;

    let totalMinors = 0;
    const recentUsers = recentUsersSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.minors && Array.isArray(data.minors)) {
        totalMinors += data.minors.length;
      }
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
      { status: 500 }
    );
  }
}
