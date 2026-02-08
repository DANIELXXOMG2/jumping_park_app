import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminTokenWithPermission } from "@/lib/adminAuth";
import { db } from "@/lib/firebaseAdmin";

const querySchema = z.object({
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(100).default(20),
	offset: z.coerce.number().min(0).default(0),
	userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
	try {
		// Verificar autenticación y permiso consents:view
		const authResult = await verifyAdminTokenWithPermission(request, "consents:view");
		if (!authResult.success) {
			return authResult.response;
		}

		const { searchParams } = new URL(request.url);

		const query = querySchema.parse({
			search: searchParams.get("search") || undefined,
			limit: searchParams.get("limit") || 20,
			offset: searchParams.get("offset") || 0,
			userId: searchParams.get("userId") || undefined,
		});

		// Helper para mapear documento a respuesta
		const mapConsent = (doc: FirebaseFirestore.DocumentSnapshot) => {
			const data = doc.data();
			if (!data) return null;
			return {
				id: doc.id,
				consecutivo: data.consecutivo,
				userId: data.userId,
				adultName: data.adultSnapshot?.fullName || "N/A",
				adultEmail: data.adultSnapshot?.email || "N/A",
				adultPhone: data.adultSnapshot?.phone || "N/A",
				minorsCount: data.minorsSnapshot?.length || 0,
				minors: data.minorsSnapshot || [],
				signatureUrl: data.signatureUrl,
				policyVersion: data.policyVersion,
				ipAddress: data.ipAddress,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
				validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
			};
		};

		// Filtrar por userId específico
		if (query.userId) {
			const snapshot = await db
				.collection("consents")
				.where("userId", "==", query.userId)
				.orderBy("createdAt", "desc")
				.get();

			const consents = snapshot.docs
				.map(mapConsent)
				.filter(Boolean);

			return NextResponse.json({
				consents,
				pagination: {
					total: consents.length,
					limit: query.limit,
					offset: 0,
					hasMore: false,
				},
			});
		}

		// Con búsqueda: cargar limitado y filtrar en memoria
		if (query.search) {
			const snapshot = await db
				.collection("consents")
				.orderBy("createdAt", "desc")
				.limit(100)
				.get();

			const searchLower = query.search.toLowerCase();
			let consents = snapshot.docs
				.map(mapConsent)
				.filter(Boolean)
				.filter(
					(consent) =>
						consent!.adultName?.toLowerCase().includes(searchLower) ||
						consent!.adultEmail?.toLowerCase().includes(searchLower) ||
						consent!.userId?.includes(searchLower) ||
						consent!.consecutivo?.toString().includes(query.search ?? ""),
				);

			const total = consents.length;
			const paginatedConsents = consents.slice(
				query.offset,
				query.offset + query.limit,
			);

			return NextResponse.json({
				consents: paginatedConsents,
				pagination: {
					total,
					limit: query.limit,
					offset: query.offset,
					hasMore: query.offset + query.limit < total,
				},
			});
		}

		// Sin búsqueda: paginación real de Firestore (OPTIMIZADO)
		const [countSnap, snapshot] = await Promise.all([
			db.collection("consents").count().get(),
			db.collection("consents")
				.orderBy("createdAt", "desc")
				.offset(query.offset)
				.limit(query.limit)
				.get(),
		]);

		const total = countSnap.data().count;
		const consents = snapshot.docs.map(mapConsent).filter(Boolean);

		return NextResponse.json({
			consents,
			pagination: {
				total,
				limit: query.limit,
				offset: query.offset,
				hasMore: query.offset + query.limit < total,
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Parámetros inválidos", details: error.issues },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: "Error al obtener consentimientos" },
			{ status: 500 },
		);
	}
}
