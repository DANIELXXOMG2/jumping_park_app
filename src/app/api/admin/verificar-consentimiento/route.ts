import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyAdminToken } from "@/lib/adminAuth";
import { z } from "zod";

const querySchema = z.object({
  cedula: z.string().min(6, "La cédula debe tener al menos 6 dígitos"),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return authResult.response;
    }

    // Obtener y validar parámetro de cédula
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get("cedula");

    const validation = querySchema.safeParse({ cedula });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Cédula inválida", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const cedulaValue = validation.data.cedula;

    // Buscar el último consentimiento del usuario ordenado por fecha de firma
    // CORREGIDO: El campo correcto es "userId", no "adultId"
    const consentsSnap = await db
      .collection("consents")
      .where("userId", "==", cedulaValue)
      .orderBy("signedAt", "desc")
      .limit(1)
      .get();

    // Si no hay consentimientos
    if (consentsSnap.empty) {
      return NextResponse.json({
        found: false,
        message: "No se encontró ningún consentimiento para esta cédula",
      });
    }

    const consentDoc = consentsSnap.docs[0];
    const consentData = consentDoc.data();

    // Verificar si el consentimiento ha expirado usando el campo validUntil
    const now = new Date();
    let isExpired = true;
    let expiresAt: string | null = null;

    // Usar validUntil que ya existe en el documento
    if (consentData.validUntil) {
      const validUntilDate = consentData.validUntil.toDate?.() 
        ? consentData.validUntil.toDate() 
        : new Date(consentData.validUntil);
      expiresAt = validUntilDate.toISOString();
      isExpired = now > validUntilDate;
    }

    // Obtener fecha de firma
    const signedAt = consentData.signedAt?.toDate?.()?.toISOString() 
      || consentData.createdAt?.toDate?.()?.toISOString() 
      || null;

    // Retornar resultado
    return NextResponse.json({
      found: true,
      isExpired,
      consent: {
        id: consentDoc.id,
        consecutivo: consentData.consecutivo,
        adultSnapshot: consentData.adultSnapshot || {
          fullName: "Nombre no disponible",
          uid: cedulaValue,
        },
        minorsSnapshot: consentData.minorsSnapshot || [],
        pdfUrl: consentData.pdfUrl || null,
        signatureUrl: consentData.signatureUrl || null,
        signedAt,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Error al verificar consentimiento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
