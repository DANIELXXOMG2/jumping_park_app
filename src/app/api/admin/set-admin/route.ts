import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { z } from "zod";

const setAdminSchema = z.object({
  email: z.string().email("Email inválido"),
  secret: z.string().min(1, "Secret requerido"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secret } = setAdminSchema.parse(body);

    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey) {
      return NextResponse.json(
        { error: "Configuración del servidor incompleta" },
        { status: 500 }
      );
    }

    if (secret !== adminSecretKey) {
      return NextResponse.json(
        { error: "Secret inválido" },
        { status: 403 }
      );
    }

    const user = await adminAuth.getUserByEmail(email);

    await adminAuth.setCustomUserClaims(user.uid, {
      admin: true,
    });

    await adminAuth.revokeRefreshTokens(user.uid);

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} ahora es administrador`,
      uid: user.uid,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("no user record")) {
      return NextResponse.json(
        { error: "Usuario no encontrado en Firebase Auth" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al establecer permisos de admin" },
      { status: 500 }
    );
  }
}
