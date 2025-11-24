import { NextResponse } from "next/server";
import { validateOtpSchema } from "@/lib/schemas/auth.schema";
import { validateOtp } from "@/services/authService";

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

    const { email, code } = parsed.data;
    const result = await validateOtp(email, code);

    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /api/otp/validate", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
