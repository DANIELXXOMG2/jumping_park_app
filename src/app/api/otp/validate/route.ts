import { NextResponse } from "next/server";
import { validateOtpSchema } from "@/lib/schemas/auth.schema";
import { validateOtp, getUserByCedula } from "@/services/authService";
import type { UserProfile } from "@/types/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[Validate API] Body recibido:", JSON.stringify(body));
    const parsed = validateOtpSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[Validate API] Error validación Zod:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { email, cedula, code } = parsed.data;
    let targetEmail = email;
    let userProfile: UserProfile | null = null;

    console.log("[Validate API] Resolviendo email para:", cedula || email);

    if (email) {
      targetEmail = email;
    } else if (cedula) {
      userProfile = await getUserByCedula(cedula);
      if (!userProfile) {
        console.warn(`[Validate API] Usuario no encontrado para cédula: ${cedula}`);
        return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
      }
      if (!userProfile.email) {
        console.error(`[Validate API] Usuario encontrado (${cedula}) pero sin campo 'email' en Firestore.`);
      }
      targetEmail = userProfile.email;
    }

    if (!targetEmail) {
      console.warn("[Validate API] No se pudo resolver un email válido (targetEmail es null/undefined).");
      return NextResponse.json({ success: false, error: "Faltan datos (Email no encontrado)" }, { status: 400 });
    }

    console.log("[Validate API] Email objetivo:", targetEmail);

    const result = await validateOtp(targetEmail, code);

    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.message }, { status: 404 });
    }

    // Si validación exitosa y no tenemos el perfil aún (caso solo email), intentamos buscarlo si es posible?
    // El requerimiento dice: "obtener el perfil COMPLETO del usuario".
    // Si validamos solo con email, podríamos buscar por email en usuarios, pero Firestore no es eficiente para eso sin índice.
    // Pero el flujo principal es con cédula.
    // Si ya tenemos userProfile (porque vino cédula), lo devolvemos.
    
    return NextResponse.json({ 
      success: true, 
      userData: userProfile || undefined 
    }, { status: 200 });

  } catch (error) {
    console.error("Error en POST /api/otp/validate", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
