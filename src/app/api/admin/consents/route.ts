import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyAdminToken } from "@/lib/adminAuth";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminToken(request);
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

    let consentsQuery = db.collection("consents").orderBy("createdAt", "desc");

    if (query.userId) {
      consentsQuery = db
        .collection("consents")
        .where("userId", "==", query.userId);
    }

    const snapshot = await consentsQuery.limit(500).get();

    let consents = snapshot.docs
      .map((doc) => {
        const data = doc.data();
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
      })
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      consents = consents.filter(
        (consent) =>
          consent.adultName?.toLowerCase().includes(searchLower) ||
          consent.adultEmail?.toLowerCase().includes(searchLower) ||
          consent.userId?.includes(query.search!) ||
          consent.consecutivo?.toString().includes(query.search!)
      );
    }

    const total = consents.length;
    const paginatedConsents = consents.slice(
      query.offset,
      query.offset + query.limit
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al obtener consentimientos" },
      { status: 500 }
    );
  }
}
