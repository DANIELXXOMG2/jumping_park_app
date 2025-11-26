import { NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/schemas/auth.schema";
import { saveOtp, sendOtpEmail, getUserByCedula } from "@/services/authService";
import type { UserProfile } from "@/types/firestore";

const OTP_DIGITS = 6;

function generateOtp(): string {
  const min = 10 ** (OTP_DIGITS - 1);
  const max = 10 ** OTP_DIGITS - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { email, cedula } = parsed.data;
    let targetEmail = email;

    console.log(`[API OTP] Solicitud recibida. Email: ${email || 'N/A'}, Cédula: ${cedula || 'N/A'}`);

    // Caso B: Si no hay email pero hay cédula, buscamos el email del usuario (Login usuario existente)
    if (!targetEmail && cedula) {
      console.log(`[API OTP] Buscando usuario por cédula: ${cedula}`);
      const user = await getUserByCedula(cedula);
      
      if (!user) {
        console.warn(`[API OTP] Usuario no encontrado para cédula: ${cedula}`);
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      
      if (!user.email) {
        console.warn(`[API OTP] Usuario encontrado pero sin email. Cédula: ${cedula}`);
        return NextResponse.json({ error: "Usuario sin email registrado" }, { status: 404 });
      }

      targetEmail = user.email;
      console.log(`[API OTP] Email recuperado para cédula ${cedula}: ${targetEmail}`);
    }

    // Caso A: Payload tiene email (Registro nuevo o reenvío explícito)
    if (!targetEmail) {
      console.error("[API OTP] Faltan datos (Email o Cédula válida)");
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const otp = generateOtp();
    console.log(`[API OTP] Generando y guardando OTP para: ${targetEmail}`);

    await saveOtp(targetEmail, otp);
    
    console.log(`[API OTP] Enviando email a: ${targetEmail}`);
    const result = await sendOtpEmail(targetEmail, otp);

    if (!result.success) {
      console.error(`[API OTP] Fallo envío de email: ${result.error}`);
      return NextResponse.json({ error: result.error ?? "No se pudo enviar el OTP" }, { status: 500 });
    }

    console.log("[API OTP] Proceso completado exitosamente.");
    return NextResponse.json({ message: "OTP enviado" }, { status: 200 });
  } catch (error) {
    console.error("[API OTP] Error no controlado:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
