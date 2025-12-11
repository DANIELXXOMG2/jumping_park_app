/**
 * API Route: GET /api/admin/consents/[id]/pdf
 * 
 * Regenera el PDF del consentimiento en vuelo usando los datos de Firestore.
 * No guarda archivos en Storage para ahorrar costos.
 * 
 * Requiere: Token de administrador válido.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminAuth";
import { admin } from "@/lib/firebaseAdmin";
import { generateConsentPdf } from "@/services/pdfService";
import type { Consent } from "@/types/firestore";

const db = admin.firestore();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  // 1. Verificar autenticación de admin
  const authResult = await verifyAdminToken(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    // 2. Obtener ID del consentimiento
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de consentimiento requerido" },
        { status: 400 }
      );
    }

    // 3. Buscar documento en Firestore
    const consentDoc = await db.collection("consents").doc(id).get();

    if (!consentDoc.exists) {
      return NextResponse.json(
        { error: "Consentimiento no encontrado" },
        { status: 404 }
      );
    }

    const consentData = {
      id: consentDoc.id,
      ...consentDoc.data(),
    } as Consent;

    // 4. Intentar descargar la firma si existe URL
    let signatureBuffer: Buffer | undefined;

    if (consentData.signatureUrl) {
      try {
        // La signatureUrl puede ser una URL firmada de Storage o base64
        if (consentData.signatureUrl.startsWith("data:image")) {
          // Es base64, extraer el buffer
          const base64Data = consentData.signatureUrl.split(",")[1];
          signatureBuffer = Buffer.from(base64Data, "base64");
        } else {
          // Es una URL, intentar descargar
          const response = await fetch(consentData.signatureUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            signatureBuffer = Buffer.from(arrayBuffer);
          }
        }
      } catch (error) {
        // Si falla la descarga, continuamos sin firma
        console.warn("[PDF Admin] No se pudo obtener la firma:", error);
      }
    }

    // 5. Generar PDF
    const pdfBuffer = await generateConsentPdf(consentData, signatureBuffer);

    // 6. Retornar PDF con headers adecuados
    const consecutivo = consentData.consecutivo || "sin-numero";
    const filename = `consentimiento-${consecutivo}.pdf`;

    // Convertir Buffer a Uint8Array para compatibilidad con NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, max-age=300", // Cache 5 minutos
      },
    });

  } catch (error) {
    console.error("[API Admin Consent PDF] Error:", error);
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
