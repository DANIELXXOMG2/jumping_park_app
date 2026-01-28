/**
 * API Route: /api/admin/users/recent
 * Retorna usuarios registrados en los últimos N días.
 * 
 * 🔥 OPTIMIZADO: Este endpoint reemplaza las consultas directas de Firestore
 * desde el cliente, permitiendo caché SWR y reduciendo lecturas.
 */
import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso dashboard:view
		const authResult = await verifyAdminTokenWithPermission(request, "dashboard:view");
		if (!authResult.success) {
			return authResult.response;
		}

		// Obtener parámetro days (default: 3)
		const { searchParams } = new URL(request.url);
		const days = Math.min(parseInt(searchParams.get("days") || "3", 10), 30); // Máximo 30 días

		// Calcular fecha límite
		const dateThreshold = new Date();
		dateThreshold.setDate(dateThreshold.getDate() - days);
		dateThreshold.setHours(0, 0, 0, 0);

		// Query: usuarios creados en los últimos N días
		const usersSnapshot = await db
			.collection("users")
			.where("createdAt", ">=", dateThreshold)
			.orderBy("createdAt", "desc")
			.limit(100) // Limitar para evitar lecturas excesivas
			.get();

		const users = usersSnapshot.docs.map((doc) => ({
			uid: doc.id,
			...doc.data(),
		}));

		return NextResponse.json({
			success: true,
			users,
			count: users.length,
			daysRange: days,
		});
	} catch (error) {
		console.error("[API /admin/users/recent] Error:", error);
		return NextResponse.json(
			{ error: "Error al obtener usuarios recientes" },
			{ status: 500 }
		);
	}
}
