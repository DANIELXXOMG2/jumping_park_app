import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyAdminToken } from "@/lib/adminAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación de admin
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    let userDoc = await db.collection("users").doc(id).get();

    if (!userDoc.exists) {
      const byUid = await db
        .collection("users")
        .where("uid", "==", id)
        .limit(1)
        .get();

      if (byUid.empty) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }
      userDoc = byUid.docs[0];
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const consentsSnap = await db
      .collection("consents")
      .where("userId", "==", userData.uid)
      .get();

    const consents = consentsSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          consecutivo: data.consecutivo,
          policyVersion: data.policyVersion,
          signatureUrl: data.signatureUrl,
          minorsCount: data.minorsSnapshot?.length || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          signedAt: data.signedAt?.toDate?.()?.toISOString() || null,
          validUntil: data.validUntil?.toDate?.()?.toISOString() || null,
        };
      })
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return NextResponse.json({
      user: {
        id: userDoc.id,
        uid: userData.uid,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        minors: userData.minors || [],
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || null,
      },
      consents,
      stats: {
        totalConsents: consents.length,
        minorsCount: userData.minors?.length || 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener detalles del usuario" },
      { status: 500 }
    );
  }
}
