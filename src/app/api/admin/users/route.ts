import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyAdminToken } from "@/lib/adminAuth";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
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
    });

    const usersQuery = db.collection("users").orderBy("createdAt", "desc");

    const snapshot = await usersQuery.limit(500).get();

    let users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        minorsCount: data.minors?.length || 0,
        minors: data.minors || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      users = users.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(query.search!) ||
          user.uid?.includes(query.search!)
      );
    }

    const total = users.length;
    const paginatedUsers = users.slice(query.offset, query.offset + query.limit);

    return NextResponse.json({
      users: paginatedUsers,
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
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
