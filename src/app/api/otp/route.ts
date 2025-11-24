import { NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/schemas/auth.schema";
import { saveOtp, sendOtpEmail } from "@/services/authService";

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

    const { email } = parsed.data;
    const otp = generateOtp();

    await saveOtp(email, otp);
    const result = await sendOtpEmail(email, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "No se pudo enviar el OTP" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP enviado" }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /api/otp", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
