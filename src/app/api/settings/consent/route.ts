import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { DEFAULT_CONSENT_CONTENT, type ConsentContentStructure } from "@/lib/data/legalContent";

/**
 * GET /api/settings/consent
 * 
 * Endpoint público que devuelve el contenido del consentimiento informado.
 * Si no existe en Firestore, devuelve el contenido por defecto.
 * 
 * Respuesta:
 * - 200: ConsentContentStructure
 * - 500: Error interno
 */
export async function GET() {
  try {
    // Intentar obtener desde Firestore
    const docRef = db.collection("settings").doc("consent_v1");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as ConsentContentStructure;
      
      return NextResponse.json({
        success: true,
        data,
        source: "firestore",
      });
    }

    // Fallback al contenido por defecto
    return NextResponse.json({
      success: true,
      data: DEFAULT_CONSENT_CONTENT,
      source: "default",
    });
  } catch (error) {
    console.error("Error fetching consent settings:", error);
    
    // En caso de error, devolver el contenido por defecto
    return NextResponse.json({
      success: true,
      data: DEFAULT_CONSENT_CONTENT,
      source: "default-fallback",
      warning: "Error al conectar con Firestore, usando contenido por defecto",
    });
  }
}
