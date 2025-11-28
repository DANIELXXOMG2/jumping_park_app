import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";

export interface AuthResult {
  success: true;
  uid: string;
  email: string;
}

export interface AuthError {
  success: false;
  response: NextResponse;
}

export async function verifyAdminToken(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Token de autenticación requerido" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Token de autenticación inválido" },
          { status: 401 }
        ),
      };
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    if (decodedToken.admin !== true) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "No tienes permisos de administrador" },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        return {
          success: false,
          response: NextResponse.json(
            { error: "Token expirado. Inicia sesión nuevamente." },
            { status: 401 }
          ),
        };
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Error de autenticación" },
        { status: 401 }
      ),
    };
  }
}
