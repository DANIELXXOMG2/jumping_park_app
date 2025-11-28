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

    const usersSnap = await db.collection("users").get();

    interface MinorWithUser {
      id: string;
      fullName: string;
      firstName?: string;
      lastName?: string;
      birthDate: string;
      relationship: string;
      eps?: string;
      idType?: string;
      idNumber?: string;
      parentId: string;
      parentName: string;
      parentEmail: string;
      parentPhone: string;
    }

    let allMinors: MinorWithUser[] = [];

    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.minors && Array.isArray(data.minors)) {
        data.minors.forEach((minor: Record<string, unknown>, index: number) => {
          allMinors.push({
            id: `${doc.id}_${index}`,
            fullName: (minor.fullName as string) || `${minor.firstName || ""} ${minor.lastName || ""}`.trim(),
            firstName: minor.firstName as string | undefined,
            lastName: minor.lastName as string | undefined,
            birthDate: minor.birthDate as string,
            relationship: minor.relationship as string,
            eps: minor.eps as string | undefined,
            idType: minor.idType as string | undefined,
            idNumber: minor.idNumber as string | undefined,
            parentId: data.uid,
            parentName: data.fullName,
            parentEmail: data.email,
            parentPhone: data.phone,
          });
        });
      }
    });

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      allMinors = allMinors.filter(
        (minor) =>
          minor.fullName?.toLowerCase().includes(searchLower) ||
          minor.idNumber?.includes(query.search!) ||
          minor.parentName?.toLowerCase().includes(searchLower) ||
          minor.parentId?.includes(query.search!)
      );
    }

    const total = allMinors.length;
    const paginatedMinors = allMinors.slice(
      query.offset,
      query.offset + query.limit
    );

    return NextResponse.json({
      minors: paginatedMinors,
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
      { error: "Error al obtener menores" },
      { status: 500 }
    );
  }
}
