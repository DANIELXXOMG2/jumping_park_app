/**
 * API Route: /api/usuarios/check
 * Verifica si un usuario existe por cédula (Blind Check - RF-03).
 * NO expone datos sensibles sin validación OTP.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebaseAdmin";
import { apiHandler, successResponse } from "@/lib/apiHandler";
import { maskEmail } from "@/lib/utils/formatters";
import type { UserProfile } from "@/types/firestore";

// ============================================================================
// SCHEMA
// ============================================================================

const checkUserSchema = z.object({
  cedula: z
    .string()
    .trim()
    .min(6, "La cédula debe tener al menos 6 dígitos")
    .max(15, "La cédula no puede exceder 15 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),
});

// ============================================================================
// TYPES
// ============================================================================

interface CheckUserResponse {
  exists: boolean;
  userData?: {
    emailMasked: string;
  };
}

// ============================================================================
// HELPER
// ============================================================================

/**
 * Sanitiza los datos del usuario para la respuesta.
 * Solo expone el email ofuscado (RF-13).
 */
function sanitizeUserResponse(user: UserProfile): CheckUserResponse["userData"] {
  return {
    emailMasked: maskEmail(user.email),
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { cedula } = checkUserSchema.parse(body);

  const COLLECTION = "users";
  const usersRef = db.collection(COLLECTION);

  // Buscar por campo 'uid' (cédula almacenada)
  const querySnapshot = await usersRef
    .where("uid", "==", cedula)
    .limit(1)
    .get();

  let userData: UserProfile | null = null;

  if (!querySnapshot.empty) {
    userData = querySnapshot.docs[0].data() as UserProfile;
  } else {
    // Fallback: buscar por ID de documento
    const docSnap = await usersRef.doc(cedula).get();
    if (docSnap.exists) {
      userData = docSnap.data() as UserProfile;
    }
  }

  // Usuario no encontrado
  if (!userData) {
    return successResponse<CheckUserResponse>({ exists: false });
  }

  // Usuario encontrado - retornar datos ofuscados
  return successResponse<CheckUserResponse>({
    exists: true,
    userData: sanitizeUserResponse(userData),
  });
});
