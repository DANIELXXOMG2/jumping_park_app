import { createDoc, deleteDoc, getDocById } from "../lib/firestoreService";
import { sendOtpEmail as sendOtpViaEmail } from "./emailService";
import type { OtpRecord, OtpSession, UserProfile } from "../types/firestore";

// Duración de la sesión OTP en minutos
const OTP_SESSION_DURATION_MINUTES = 15;

export type SendOtpResult = {
  success: boolean;
  error?: string;
};

export async function getUserByCedula(cedula: string): Promise<UserProfile | null> {
  console.log("[AuthService] Buscando en 'users' con ID:", cedula);
  return await getDocById<UserProfile>("users", cedula);
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const otpRecord: OtpRecord = {
    email,
    code,
    expiresAt,
    attempts: 0,
  };

  try {
    await createDoc("otp_sessions", otpRecord, email);
  } catch (error) {
    console.error("Error guardando OTP en Firestore", error);
    throw new Error("No se pudo guardar el OTP");
  }
}

/**
 * Envía un OTP por correo electrónico.
 * Delega al emailService centralizado.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<SendOtpResult> {
  // El log está en emailService - evitamos duplicación
  return sendOtpViaEmail({ to: email, otp });
}

export async function validateOtp(
  email: string,
  code: string,
): Promise<{ valid: boolean; message: string }> {
  try {
    console.log(`[AuthService] Buscando OTP para email: ${email}`);
    // Usamos el email como ID del documento, consistente con saveOtp
    const otpDoc = await getDocById("otp_sessions", email);
    
    if (!otpDoc) {
      console.warn(`[AuthService] No se encontró documento OTP para: ${email}`);
      return { valid: false, message: "Código no solicitado o expirado" };
    }

    const matchesCode = otpDoc.code === code;
    const rawExpiresAt = otpDoc.expiresAt as Date | { toDate?: () => Date };
    const expiresAtDate = rawExpiresAt && "toDate" in rawExpiresAt && typeof rawExpiresAt.toDate === "function"
      ? rawExpiresAt.toDate()
      : (rawExpiresAt as Date);
    const isExpired = expiresAtDate <= new Date();

    if (!matchesCode) {
      console.warn(`[AuthService] Código incorrecto. Recibido: ${code}, Esperado: ${otpDoc.code}`);
      return { valid: false, message: "Código incorrecto" };
    }

    if (isExpired) {
      console.warn(`[AuthService] Código expirado. Expiró en: ${expiresAtDate}`);
      await deleteDoc("otp_sessions", email);
      return { valid: false, message: "Código expirado" };
    }

    console.log(`[AuthService] OTP válido. Eliminando documento.`);
    await deleteDoc("otp_sessions", email);
    return { valid: true, message: "OTP válido" };
  } catch (error) {
    console.error("Error validando OTP", error);
    return { valid: false, message: "No se pudo validar el OTP" };
  }
}

// ============================================================================
// SESIONES OTP - Para proteger endpoints sensibles
// ============================================================================

/**
 * Crea una sesión OTP después de una validación exitosa.
 * Permite verificar que el usuario completó el flujo de autenticación.
 * 
 * @param userId - Cédula del usuario
 * @param email - Email validado
 */
export async function createOtpSession(userId: string, email: string): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_SESSION_DURATION_MINUTES * 60 * 1000);
  
  const session: OtpSession = {
    userId,
    email,
    validatedAt: now,
    expiresAt,
  };

  try {
    // Usamos el userId (cédula) como ID del documento
    await createDoc("otp_sessions", session, userId);
    console.log(`[AuthService] Sesión OTP creada para usuario: ${userId}, expira en ${OTP_SESSION_DURATION_MINUTES} min`);
  } catch (error) {
    console.error("[AuthService] Error creando sesión OTP:", error);
    // No lanzamos error - la sesión es para seguridad adicional, no debe bloquear el flujo
  }
}

/**
 * Verifica si existe una sesión OTP válida para un usuario.
 * Usado para proteger endpoints sensibles como el historial de menores.
 * 
 * @param userId - Cédula del usuario a verificar
 * @returns true si hay una sesión válida, false si no existe o expiró
 */
export async function verifyOtpSession(userId: string): Promise<boolean> {
  try {
    const session = await getDocById<OtpSession>("otp_sessions", userId);
    
    if (!session) {
      console.warn(`[AuthService] No existe sesión OTP para usuario: ${userId}`);
      return false;
    }

    // Verificar expiración
    const rawExpiresAt = session.expiresAt as Date | { toDate?: () => Date };
    const expiresAtDate = rawExpiresAt && "toDate" in rawExpiresAt && typeof rawExpiresAt.toDate === "function"
      ? rawExpiresAt.toDate()
      : (rawExpiresAt as Date);
    
    const isExpired = expiresAtDate <= new Date();

    if (isExpired) {
      console.warn(`[AuthService] Sesión OTP expirada para usuario: ${userId}`);
      // Limpiar sesión expirada
      await deleteDoc("otp_sessions", userId);
      return false;
    }

    console.log(`[AuthService] Sesión OTP válida para usuario: ${userId}`);
    return true;
  } catch (error) {
    console.error("[AuthService] Error verificando sesión OTP:", error);
    return false;
  }
}

/**
 * Elimina la sesión OTP de un usuario (logout o expiración manual).
 * 
 * @param userId - Cédula del usuario
 */
export async function deleteOtpSession(userId: string): Promise<void> {
  try {
    await deleteDoc("otp_sessions", userId);
    console.log(`[AuthService] Sesión OTP eliminada para usuario: ${userId}`);
  } catch (error) {
    console.error("[AuthService] Error eliminando sesión OTP:", error);
  }
}
