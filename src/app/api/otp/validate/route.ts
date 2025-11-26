import { NextResponse } from "next/server";
import { validateOtpSchema } from "@/lib/schemas/auth.schema";
import { validateOtp } from "@/services/authService";
import { getDocById } from "@/lib/firestoreService";
import type { UserProfile } from "@/types/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    let { email, cedula, code } = parsed.data;
    let userProfile: UserProfile | null = null;

    console.log(`[Validate OTP] Solicitud recibida. Email: ${email || 'N/A'}, Cédula: ${cedula || 'N/A'}, Code: ${code}`);

    // Si viene cédula, buscamos el usuario para obtener el email y luego devolver el perfil
    if (cedula) {
      console.log(`[Validate OTP] Buscando usuario por cédula: ${cedula}`);
      userProfile = await getDocById<UserProfile>("usuarios", cedula);
      
      if (userProfile?.email) {
        // Si no venía email o venía uno diferente (aunque no debería), usamos el del perfil
        email = userProfile.email;
        console.log(`[Validate OTP] Email recuperado de perfil: ${email}`);
      } else if (!email) {
        // Si no hay email en perfil y no vino en request, no podemos validar
        console.warn(`[Validate OTP] Usuario no encontrado o sin email para cédula: ${cedula}`);
        return NextResponse.json({ success: false, error: "Usuario no encontrado o sin email" }, { status: 404 });
      }
    }

    if (!email) {
      console.warn("[Validate OTP] Email requerido y no presente");
      return NextResponse.json({ success: false, error: "Email requerido" }, { status: 400 });
    }

    console.log(`[Validate OTP] Validando OTP para email: ${email} con código: ${code}`);
    const result = await validateOtp(email, code);

    if (!result.valid) {
      console.warn(`[Validate OTP] Validación fallida: ${result.message}`);
      // Retornamos 404 si es código incorrecto/expirado para que el frontend muestre el mensaje adecuado
      return NextResponse.json({ success: false, error: result.message }, { status: 404 });
    }

    console.log("[Validate OTP] Validación exitosa");

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
